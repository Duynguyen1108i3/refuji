import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { db } from '../../db.js';
import {
  getLockedSerialsForRange,
  normalizeDateStr,
  getTodayLocalStr,
  addDaysToDateStr,
} from '../orders/availability.helper.js';
import { sortModelsByCameraSeries } from '../../utils/cameraSeriesOrder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const catalogRouter = Router();
const prisma = new PrismaClient();

// Pre-load catalog JSON fallback
let cachedCatalog: any[] = [];
try {
  let catalogPath = path.resolve(__dirname, '../../../prisma/seed-data/fujifilm-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    catalogPath = path.resolve(__dirname, '../../../../../../public/fujifilm-catalog.json');
  }
  if (fs.existsSync(catalogPath)) {
    const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const list = Array.isArray(raw) ? raw : (raw.productModels || []);
    cachedCatalog = list.map((m: any, idx: number) => ({
      id: m.id || idx + 1,
      ...m,
    }));
  }
} catch (e) {
  console.warn('Could not preload catalog JSON in catalog router:', e);
}

// Tính năng: Lấy danh mục thiết bị kèm kiểm tra khả dụng theo khoảng ngày (loại trừ GUEST_INQUIRY & đơn hết hạn 15p)
catalogRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, start_date, end_date } = req.query;
    const reqStartDate = typeof start_date === 'string' ? start_date : undefined;
    const reqEndDate = typeof end_date === 'string' ? end_date : undefined;

    // 1. Thử truy vấn Prisma nếu MySQL đang chạy
    try {
      const whereClause: any = { is_active: true };
      if (category && typeof category === 'string') {
        whereClause.category = category.toUpperCase();
      }
      const models = await prisma.productModel.findMany({
        where: whereClause,
        include: { items: true },
        orderBy: { id: 'asc' },
      });
      if (models && models.length > 0) {
        return res.json(sortModelsByCameraSeries(models));
      }
    } catch (_) {
      // Prisma offline -> chuyển sang SQLite / cached catalog
    }

    // 2. Thử truy vấn SQLite db theo giao thoa khoảng ngày
    try {
      const { lockedSerials, activeDeliveredSerials } = getLockedSerialsForRange(
        reqStartDate,
        reqEndDate
      );

      let query = 'SELECT * FROM product_models WHERE is_active = 1';
      const params: any[] = [];
      if (category && typeof category === 'string') {
        query += ' AND category = ?';
        params.push(category.toUpperCase());
      }
      query += ' ORDER BY id ASC';
      const rows = db.prepare(query).all(...params) as any[];
      if (rows && rows.length > 0) {
        const modelsWithItems = rows.map((r) => {
          const rawItems = db.prepare('SELECT * FROM product_items WHERE model_id = ?').all(r.id) as any[];
          const items = rawItems.map((item) => {
            if (item.status === 'MAINTENANCE' || item.status === 'LOST') {
              return item;
            }
            const isLocked = lockedSerials.has(item.serial_number);
            const isOrphanRented =
              item.status === 'RENTED' && !activeDeliveredSerials.has(item.serial_number);
            return {
              ...item,
              status: isLocked || isOrphanRented ? 'RENTED' : 'AVAILABLE',
            };
          });

          let specs = {};
          try {
            specs = JSON.parse(r.specs_json || '{}');
          } catch (_) {}
          return {
            ...r,
            specs_json: specs,
            is_active: Boolean(r.is_active),
            items,
          };
        });
        return res.json(sortModelsByCameraSeries(modelsWithItems));
      }
    } catch (_) {
      // SQLite offline -> fallback to cachedCatalog
    }

    // 3. Trả về từ pre-loaded catalog
    let result = cachedCatalog;
    if (category && typeof category === 'string') {
      result = result.filter((m) => m.category === category.toUpperCase());
    }
    return res.json(sortModelsByCameraSeries(result));
  } catch (error) {
    console.error('❌ Error fetching models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tính năng: Kiểm tra số lượng khả dụng chi tiết của 1 mẫu máy theo khoảng ngày nhận - trả
catalogRouter.get('/:id/availability', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const reqStart = normalizeDateStr(req.query.start_date as string) || getTodayLocalStr();
    const rawEnd = normalizeDateStr(req.query.end_date as string);
    const reqEnd = rawEnd && rawEnd > reqStart ? rawEnd : addDaysToDateStr(reqStart, 3);

    const model = db.prepare('SELECT id, model_name, is_active FROM product_models WHERE id = ?').get(id) as any;
    if (!model) {
      return res.status(404).json({ error: 'Product model not found' });
    }

    const { lockedSerials, activeDeliveredSerials } = getLockedSerialsForRange(reqStart, reqEnd);
    const rawItems = db.prepare('SELECT id, serial_number, status FROM product_items WHERE model_id = ?').all(id) as Array<{
      id: number;
      serial_number: string;
      status: string;
    }>;

    const activePool = rawItems.filter(
      (p) => p.status === 'AVAILABLE' || (p.status === 'RENTED' && activeDeliveredSerials.has(p.serial_number))
    );
    const freeUnits = activePool.filter((p) => !lockedSerials.has(p.serial_number));

    return res.json({
      modelId: model.id,
      modelName: model.model_name,
      startDate: reqStart,
      endDate: reqEnd,
      activePool: activePool.length,
      bookedUnits: activePool.length - freeUnits.length,
      availableCount: freeUnits.length,
      availableSerials: freeUnits.map((u) => u.serial_number),
    });
  } catch (error) {
    console.error(`❌ Error checking availability for model ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id - Chi tiết mẫu máy
catalogRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // 1. Thử truy vấn Prisma
    try {
      const model = await prisma.productModel.findUnique({
        where: { id },
        include: { items: true },
      });
      if (model) return res.json(model);
    } catch (_) {}

    // 2. Thử truy vấn SQLite db
    try {
      const row = db.prepare('SELECT * FROM product_models WHERE id = ?').get(id) as any;
      if (row) {
        const items = db.prepare('SELECT * FROM product_items WHERE model_id = ?').all(row.id);
        let specs = {};
        try {
          specs = JSON.parse(row.specs_json || '{}');
        } catch (_) {}
        return res.json({
          ...row,
          specs_json: specs,
          is_active: Boolean(row.is_active),
          items,
        });
      }
    } catch (_) {}

    // 3. Fallback catalog JSON
    const model = cachedCatalog.find((m) => m.id === id);
    if (!model) {
      return res.status(404).json({ error: 'Product model not found' });
    }
    return res.json(model);
  } catch (error) {
    console.error(`❌ Error fetching model ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
