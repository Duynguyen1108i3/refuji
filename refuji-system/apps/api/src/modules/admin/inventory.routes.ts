// Tính năng: API Quản trị Danh mục Mẫu mã (ProductModels), Kho cá thể theo Serial (ProductItems) & Phiếu bảo dưỡng (MaintenanceLogs)
import { Router, Request, Response } from 'express';
import { db, reconcileActiveOrderItemStatuses } from '../../db.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { getActiveSerialBookingsMap } from '../orders/availability.helper.js';
import { sortModelsByCameraSeries } from '../../utils/cameraSeriesOrder.js';
import { AdminActor, requireAdminOnly } from './admin.middleware.js';

export const adminInventoryRouter = Router();

// =====================================
// 1. PRODUCT MODELS (CATALOG CRUD)
// =====================================

// GET /api/admin/models — Lấy toàn bộ mẫu mã kèm thống kê số cá thể kho thực tế & lịch giữ chỗ hôm nay
adminInventoryRouter.get('/models', (req: Request, res: Response) => {
  try {
    reconcileActiveOrderItemStatuses();
    const bookingsMap = getActiveSerialBookingsMap();

    const category = typeof req.query.category === 'string' ? req.query.category.toUpperCase() : 'ALL';
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    let sql = `
      SELECT pm.*
      FROM product_models pm
      WHERE 1=1
    `;
    const params: any[] = [];
    if (category !== 'ALL') {
      sql += ' AND pm.category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (LOWER(pm.model_name) LIKE ? OR LOWER(pm.description) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY pm.id ASC';

    const rows = db.prepare(sql).all(...params) as any[];
    const allItems = db
      .prepare('SELECT id, model_id, serial_number, status FROM product_items')
      .all() as Array<{ id: number; model_id: number; serial_number: string; status: string }>;

    const itemsByModel = new Map<number, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByModel.get(item.model_id);
      if (list) list.push(item);
      else itemsByModel.set(item.model_id, [item]);
    }

    return res.json(
      sortModelsByCameraSeries(
        rows.map((r) => {
          const modelItems = itemsByModel.get(r.id) || [];
          let availableUnits = 0;
          let rentedUnits = 0;
          let maintenanceUnits = 0;
          let reservedUnits = 0;
          let storefrontAvailableUnits = 0;

          for (const it of modelItems) {
            if (it.status === 'RENTED') {
              rentedUnits++;
            } else if (it.status === 'MAINTENANCE') {
              maintenanceUnits++;
            } else if (it.status === 'AVAILABLE') {
              availableUnits++;
              const booking = bookingsMap.get(it.serial_number);
              if (booking?.booking_kind === 'RESERVED') {
                reservedUnits++;
              } else {
                storefrontAvailableUnits++;
              }
            }
          }

          return {
            ...r,
            total_units: modelItems.length,
            available_units: availableUnits,
            rented_units: rentedUnits,
            maintenance_units: maintenanceUnits,
            reserved_units: reservedUnits,
            storefront_available_units: storefrontAvailableUnits,
            is_active: Boolean(r.is_active),
            specs_json: (() => {
              try {
                return JSON.parse(r.specs_json || '{}');
              } catch {
                return {};
              }
            })(),
          };
        })
      )
    );
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tải danh sách mẫu thiết bị.' });
  }
});

// POST /api/admin/models — Thêm mẫu thiết bị mới (có thể tạo kèm Serial đầu tiên)
adminInventoryRouter.post('/models', requireAdminOnly, (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const {
      model_name,
      category,
      mount_type,
      brand,
      base_rental_price_per_day,
      deposit_amount,
      description,
      image_url,
      specs_json,
      initial_serial,
    } = req.body;

    if (!model_name || !String(model_name).trim()) {
      return res.status(400).json({ error: 'Tên mẫu thiết bị không được để trống.' });
    }
    const cleanCat = ['BODY', 'LENS', 'ACCESSORY'].includes(String(category || '').toUpperCase())
      ? String(category).toUpperCase()
      : 'BODY';
    const cleanMount = ['X_MOUNT', 'G_MOUNT', 'NONE'].includes(String(mount_type || '').toUpperCase())
      ? String(mount_type).toUpperCase()
      : 'NONE';

    const dailyRate = Math.max(0, Number(base_rental_price_per_day) || 0);
    const depositAmt = Math.max(0, Number(deposit_amount) || 0);
    const nowIso = new Date().toISOString();

    const tx = db.transaction(() => {
      const insertRes = db
        .prepare(`
          INSERT INTO product_models (
            model_name, category, mount_type, brand,
            base_rental_price_per_day, deposit_amount, description,
            specs_json, image_url, is_active, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `)
        .run(
          String(model_name).trim(),
          cleanCat,
          cleanMount,
          String(brand || 'Fujifilm').trim(),
          dailyRate,
          depositAmt,
          String(description || '').trim(),
          typeof specs_json === 'string' ? specs_json : JSON.stringify(specs_json || {}),
          String(image_url || '/assets/camera-xt5.png').trim(),
          nowIso
        );

      const modelId = Number(insertRes.lastInsertRowid);
      if (initial_serial && String(initial_serial).trim()) {
        db.prepare(`
          INSERT INTO product_items (
            model_id, serial_number, shutter_count, condition_percent, status, note
          ) VALUES (?, ?, 0, 100, 'AVAILABLE', 'Nhập kho cùng mẫu thiết bị mới')
        `).run(modelId, String(initial_serial).trim().toUpperCase());
      }

      recordAuditLog({
        userId: actor.userId,
        actorType: 'USER',
        actorLabel: actor.fullName,
        action: 'MODEL_CREATED',
        entityType: 'ProductModel',
        entityId: modelId,
        newValue: { model_name, category: cleanCat, dailyRate, depositAmt },
        description: `Thêm mới mẫu thiết bị "${String(model_name).trim()}" (${cleanCat}).`,
      });

      return modelId;
    });

    const newId = tx();
    return res.status(201).json({ success: true, id: newId, message: 'Đã thêm mẫu thiết bị mới vào hệ thống.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Không thể thêm mẫu thiết bị mới.' });
  }
});

// PUT /api/admin/models/:id — Sửa thông tin / đơn giá / tiền cọc mẫu thiết bị
adminInventoryRouter.put('/models/:id', requireAdminOnly, (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const modelId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM product_models WHERE id = ?').get(modelId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy mẫu thiết bị.' });
    }

    const {
      model_name,
      category,
      mount_type,
      base_rental_price_per_day,
      deposit_amount,
      description,
      image_url,
      specs_json,
      is_active,
    } = req.body;

    const nextName = model_name !== undefined ? String(model_name).trim() : existing.model_name;
    const nextCat =
      category && ['BODY', 'LENS', 'ACCESSORY'].includes(String(category).toUpperCase())
        ? String(category).toUpperCase()
        : existing.category;
    const nextMount =
      mount_type && ['X_MOUNT', 'G_MOUNT', 'NONE'].includes(String(mount_type).toUpperCase())
        ? String(mount_type).toUpperCase()
        : existing.mount_type;
    const nextPrice =
      base_rental_price_per_day !== undefined
        ? Math.max(0, Number(base_rental_price_per_day) || 0)
        : existing.base_rental_price_per_day;
    const nextDeposit =
      deposit_amount !== undefined ? Math.max(0, Number(deposit_amount) || 0) : existing.deposit_amount;
    const nextDesc = description !== undefined ? String(description) : existing.description;
    const nextImg = image_url !== undefined ? String(image_url).trim() : existing.image_url;
    const nextSpecs =
      specs_json !== undefined
        ? typeof specs_json === 'string'
          ? specs_json
          : JSON.stringify(specs_json)
        : existing.specs_json;
    const nextActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE product_models
      SET model_name = ?, category = ?, mount_type = ?, base_rental_price_per_day = ?,
          deposit_amount = ?, description = ?, image_url = ?, specs_json = ?, is_active = ?
      WHERE id = ?
    `).run(nextName, nextCat, nextMount, nextPrice, nextDeposit, nextDesc, nextImg, nextSpecs, nextActive, modelId);

    recordAuditLog({
      userId: actor.userId,
      actorType: 'USER',
      actorLabel: actor.fullName,
      action: 'MODEL_UPDATED',
      entityType: 'ProductModel',
      entityId: modelId,
      oldValue: {
        base_rental_price_per_day: existing.base_rental_price_per_day,
        deposit_amount: existing.deposit_amount,
        is_active: Boolean(existing.is_active),
      },
      newValue: {
        base_rental_price_per_day: nextPrice,
        deposit_amount: nextDeposit,
        is_active: Boolean(nextActive),
      },
      description: `Cập nhật cấu hình/giá cho mẫu "${nextName}".`,
    });

    return res.json({ success: true, message: `Đã cập nhật mẫu thiết bị "${nextName}".` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể cập nhật mẫu thiết bị.' });
  }
});

// PATCH /api/admin/models/:id/status — Ẩn / Hiện mẫu thiết bị trên trang chủ
adminInventoryRouter.patch('/models/:id/status', requireAdminOnly, (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const modelId = Number(req.params.id);
    const existing = db.prepare('SELECT id, model_name, is_active FROM product_models WHERE id = ?').get(modelId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy mẫu thiết bị.' });
    }
    const nextActive = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : existing.is_active ? 0 : 1;
    db.prepare('UPDATE product_models SET is_active = ? WHERE id = ?').run(nextActive, modelId);

    recordAuditLog({
      userId: actor.userId,
      actorType: 'USER',
      actorLabel: actor.fullName,
      action: 'MODEL_VISIBILITY_CHANGED',
      entityType: 'ProductModel',
      entityId: modelId,
      oldValue: { is_active: Boolean(existing.is_active) },
      newValue: { is_active: Boolean(nextActive) },
      description: `${nextActive ? 'Hiển thị' : 'Tạm ẩn'} mẫu thiết bị "${existing.model_name}" trên trang khách hàng.`,
    });

    return res.json({
      success: true,
      is_active: Boolean(nextActive),
      message: `${nextActive ? 'Đã kích hoạt hiển thị' : 'Đã tạm ẩn'} "${existing.model_name}".`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể đổi trạng thái hiển thị mẫu thiết bị.' });
  }
});

// =====================================
// 2. PRODUCT ITEMS (SERIAL WAREHOUSE CRUD)
// =====================================

// GET /api/admin/items — Danh sách toàn bộ cá thể vật lý theo Serial kèm thông tin đơn đang thuê/giữ lịch
adminInventoryRouter.get('/items', (req: Request, res: Response) => {
  try {
    reconcileActiveOrderItemStatuses();
    const bookingsMap = getActiveSerialBookingsMap();

    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : 'ALL';
    const modelId = req.query.model_id ? Number(req.query.model_id) : null;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    let sql = `
      SELECT pi.*,
             pm.model_name,
             pm.category,
             pm.mount_type,
             pm.image_url
      FROM product_items pi
      JOIN product_models pm ON pi.model_id = pm.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (modelId && !isNaN(modelId)) {
      sql += ' AND pi.model_id = ?';
      params.push(modelId);
    }
    if (search) {
      sql += ' AND (LOWER(pi.serial_number) LIKE ? OR LOWER(pm.model_name) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY pi.id DESC';

    const rawItems = db.prepare(sql).all(...params) as any[];
    const enrichedItems = rawItems.map((item) => {
      const booking = bookingsMap.get(item.serial_number) || null;
      const effectiveKind =
        booking?.booking_kind === 'DELIVERED'
          ? 'DELIVERED'
          : item.status === 'AVAILABLE' && booking?.booking_kind === 'RESERVED'
          ? 'RESERVED'
          : null;

      return {
        ...item,
        active_order_code: booking?.order_code || null,
        active_order_status: booking?.order_status || null,
        active_start_date: booking?.start_date || null,
        active_end_date: booking?.expected_return_date || null,
        active_customer_name: booking?.customer_name || null,
        booking_kind: effectiveKind,
      };
    });

    const filtered = enrichedItems.filter((item) => {
      if (status === 'ALL') return true;
      if (status === 'AVAILABLE') return item.status === 'AVAILABLE' && item.booking_kind !== 'RESERVED';
      if (status === 'RESERVED') return item.status === 'AVAILABLE' && item.booking_kind === 'RESERVED';
      return item.status === status;
    });

    return res.json(filtered);
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tải danh sách kho Serial.' });
  }
});

// POST /api/admin/items — Nhập kho cá thể Serial mới
adminInventoryRouter.post('/items', (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const {
      model_id,
      serial_number,
      shutter_count,
      condition_percent,
      purchase_date,
      purchase_price,
      next_maintenance_date,
      note,
    } = req.body;

    const cleanSerial = String(serial_number || '').trim().toUpperCase();
    if (!cleanSerial) {
      return res.status(400).json({ error: 'Số Serial Number không được để trống.' });
    }
    const model = db.prepare('SELECT id, model_name FROM product_models WHERE id = ?').get(Number(model_id)) as any;
    if (!model) {
      return res.status(404).json({ error: 'Mẫu thiết bị được chọn không tồn tại.' });
    }

    const dup = db.prepare('SELECT id FROM product_items WHERE UPPER(serial_number) = ?').get(cleanSerial);
    if (dup) {
      return res.status(409).json({ error: `Số Serial "${cleanSerial}" đã tồn tại trong kho.` });
    }

    const result = db
      .prepare(`
        INSERT INTO product_items (
          model_id, serial_number, shutter_count, condition_percent,
          status, purchase_date, purchase_price, total_rental_count,
          next_maintenance_date, note
        ) VALUES (?, ?, ?, ?, 'AVAILABLE', ?, ?, 0, ?, ?)
      `)
      .run(
        model.id,
        cleanSerial,
        Math.max(0, Math.round(Number(shutter_count) || 0)),
        Math.min(100, Math.max(0, Math.round(Number(condition_percent) || 100))),
        purchase_date || new Date().toISOString().slice(0, 10),
        purchase_price ? Number(purchase_price) : null,
        next_maintenance_date || null,
        (note || '').trim() || `Nhập kho ${model.model_name}`
      );

    recordAuditLog({
      userId: actor.userId,
      actorType: 'USER',
      actorLabel: actor.fullName,
      action: 'ITEM_CREATED',
      entityType: 'ProductItem',
      entityId: cleanSerial,
      newValue: { model_id: model.id, serial_number: cleanSerial, status: 'AVAILABLE' },
      description: `Nhập kho cá thể mới "${cleanSerial}" cho mẫu ${model.model_name}.`,
    });

    return res.status(201).json({
      success: true,
      id: Number(result.lastInsertRowid),
      message: `Đã nhập kho Serial ${cleanSerial} (${model.model_name}).`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Không thể nhập kho Serial mới.' });
  }
});

// PUT /api/admin/items/:id — Cập nhật trạng thái, Shutter Count, Độ mới & Ghi chú
adminInventoryRouter.put('/items/:id', (req: Request, res: Response) => {
  try {
    reconcileActiveOrderItemStatuses();
    const actor = (req as any).actor as AdminActor;
    const itemId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM product_items WHERE id = ?').get(itemId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy cá thể thiết bị.' });
    }

    const { shutter_count, condition_percent, status, next_maintenance_date, note } = req.body;
    const allowedStatuses = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'LOST'];
    const nextStatus =
      status && allowedStatuses.includes(String(status).toUpperCase())
        ? String(status).toUpperCase()
        : existing.status;

    const bookingsMap = getActiveSerialBookingsMap();
    const activeBooking = bookingsMap.get(existing.serial_number);
    if (activeBooking?.booking_kind === 'DELIVERED' && nextStatus !== 'RENTED') {
      return res.status(409).json({
        error: `Serial ${existing.serial_number} đang được giao cho đơn #${activeBooking.order_code} (${activeBooking.order_status}). Vui lòng vào Đơn & POS → Check-in Quyết toán (hoặc Hủy đơn) để thu hồi thay vì đổi trạng thái thủ công.`,
      });
    }

    const nextShutter =
      shutter_count !== undefined ? Math.max(0, Math.round(Number(shutter_count) || 0)) : existing.shutter_count;
    const nextCond =
      condition_percent !== undefined
        ? Math.min(100, Math.max(0, Math.round(Number(condition_percent) || 100)))
        : existing.condition_percent;
    const nextMaintDate = next_maintenance_date !== undefined ? next_maintenance_date || null : existing.next_maintenance_date;
    const nextNote = note !== undefined ? note : existing.note;

    db.prepare(`
      UPDATE product_items
      SET status = ?, shutter_count = ?, condition_percent = ?, next_maintenance_date = ?, note = ?
      WHERE id = ?
    `).run(nextStatus, nextShutter, nextCond, nextMaintDate, nextNote, itemId);

    recordAuditLog({
      userId: actor.userId,
      actorType: 'USER',
      actorLabel: actor.fullName,
      action: 'ITEM_UPDATED',
      entityType: 'ProductItem',
      entityId: existing.serial_number,
      oldValue: { status: existing.status, shutter_count: existing.shutter_count, condition_percent: existing.condition_percent },
      newValue: { status: nextStatus, shutter_count: nextShutter, condition_percent: nextCond },
      description: `Cập nhật thông số Serial ${existing.serial_number}.`,
    });

    return res.json({ success: true, message: `Đã cập nhật Serial ${existing.serial_number}.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể cập nhật thông tin cá thể.' });
  }
});

// =====================================
// 3. MAINTENANCE LOGS (BẢO DƯỠNG & VỆ SINH)
// =====================================

// GET /api/admin/maintenance — Danh sách phiếu bảo dưỡng & thiết bị đến hạn
adminInventoryRouter.get('/maintenance', (_req: Request, res: Response) => {
  try {
    const logs = db
      .prepare(`
        SELECT ml.*, pm.model_name, pm.category, pi.status as current_item_status, pi.condition_percent
        FROM maintenance_logs ml
        JOIN product_items pi ON ml.item_id = pi.id
        JOIN product_models pm ON pi.model_id = pm.id
        ORDER BY CASE WHEN ml.completed_at IS NULL THEN 0 ELSE 1 END, ml.id DESC
      `)
      .all();

    const todayPlus7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const dueAlerts = db
      .prepare(`
        SELECT pi.*, pm.model_name, pm.category
        FROM product_items pi
        JOIN product_models pm ON pi.model_id = pm.id
        WHERE pi.status != 'LOST'
          AND (
            pi.shutter_count >= 10000
            OR pi.condition_percent < 92
            OR (pi.next_maintenance_date IS NOT NULL AND date(pi.next_maintenance_date) <= date(?))
          )
        ORDER BY pi.shutter_count DESC
      `)
      .all(todayPlus7);

    return res.json({ logs, dueAlerts });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tải danh sách bảo dưỡng.' });
  }
});

// POST /api/admin/maintenance — Tạo phiếu bảo dưỡng & khóa máy sang MAINTENANCE
adminInventoryRouter.post('/maintenance', (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const { item_id, maintenance_type, description, cost, external_vendor, next_maintenance_date } = req.body;

    const item = db
      .prepare('SELECT id, serial_number, shutter_count, status FROM product_items WHERE id = ?')
      .get(Number(item_id)) as any;

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy cá thể thiết bị để bảo dưỡng.' });
    }
    if (item.status === 'RENTED') {
      return res.status(409).json({
        error: `Serial ${item.serial_number} đang được khách thuê (RENTED). Chỉ có thể tạo phiếu bảo dưỡng sau khi Check-in thu hồi.`,
      });
    }

    const allowedTypes = ['CLEANING', 'REPAIR', 'CALIBRATION', 'SENSOR_CLEANING', 'FIRMWARE_UPDATE', 'GENERAL_INSPECTION'];
    const mType = allowedTypes.includes(String(maintenance_type || '').toUpperCase())
      ? String(maintenance_type).toUpperCase()
      : 'SENSOR_CLEANING';

    const cleanDesc = String(description || '').trim();
    if (!cleanDesc) {
      return res.status(400).json({ error: 'Vui lòng mô tả nội dung bảo dưỡng / vệ sinh.' });
    }

    const nowIso = new Date().toISOString();
    const tx = db.transaction(() => {
      const ins = db
        .prepare(`
          INSERT INTO maintenance_logs (
            item_id, serial_number, maintenance_type, description, cost,
            performed_by, performed_by_name, external_vendor, shutter_at_service,
            started_at, completed_at, next_maintenance_date, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
        `)
        .run(
          item.id,
          item.serial_number,
          mType,
          cleanDesc,
          Math.max(0, Number(cost) || 0),
          actor.userId,
          actor.fullName,
          String(external_vendor || 'ReFuji Care Center').trim(),
          item.shutter_count || 0,
          nowIso.slice(0, 10),
          next_maintenance_date || null,
          nowIso
        );

      db.prepare("UPDATE product_items SET status = 'MAINTENANCE' WHERE id = ?").run(item.id);

      recordAuditLog({
        userId: actor.userId,
        actorType: 'USER',
        actorLabel: actor.fullName,
        action: 'MAINTENANCE_CREATED',
        entityType: 'ProductItem',
        entityId: item.serial_number,
        oldValue: { status: item.status },
        newValue: { status: 'MAINTENANCE', maintenance_type: mType },
        description: `Tạo phiếu bảo dưỡng ${mType} cho Serial ${item.serial_number}: ${cleanDesc}`,
      });

      return Number(ins.lastInsertRowid);
    });

    const logId = tx();
    return res.status(201).json({
      success: true,
      id: logId,
      message: `Đã lập phiếu bảo dưỡng cho Serial ${item.serial_number} và khóa trạng thái MAINTENANCE.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tạo phiếu bảo dưỡng.' });
  }
});

// PATCH /api/admin/maintenance/:logId/complete — Hoàn tất bảo dưỡng & mở lại AVAILABLE
adminInventoryRouter.patch('/maintenance/:logId/complete', (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const logId = Number(req.params.logId);
    const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(logId) as any;

    if (!log) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu bảo dưỡng.' });
    }
    if (log.completed_at) {
      return res.status(400).json({ error: 'Phiếu bảo dưỡng này đã hoàn tất trước đó.' });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const finalCost = req.body.cost !== undefined ? Math.max(0, Number(req.body.cost) || 0) : log.cost;
    const nextMaintDate =
      req.body.next_maintenance_date ||
      new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    const nextCondition =
      req.body.condition_percent !== undefined
        ? Math.min(100, Math.max(0, Math.round(Number(req.body.condition_percent) || 98)))
        : null;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE maintenance_logs
        SET completed_at = ?, cost = ?, next_maintenance_date = ?
        WHERE id = ?
      `).run(todayStr, finalCost, nextMaintDate, logId);

      db.prepare(`
        UPDATE product_items
        SET status = 'AVAILABLE',
            last_maintenance_date = ?,
            next_maintenance_date = ?,
            condition_percent = COALESCE(?, condition_percent)
        WHERE id = ?
      `).run(todayStr, nextMaintDate, nextCondition, log.item_id);

      recordAuditLog({
        userId: actor.userId,
        actorType: 'USER',
        actorLabel: actor.fullName,
        action: 'MAINTENANCE_COMPLETED',
        entityType: 'ProductItem',
        entityId: log.serial_number,
        oldValue: { status: 'MAINTENANCE' },
        newValue: { status: 'AVAILABLE', cost: finalCost, next_maintenance_date: nextMaintDate },
        description: `Hoàn tất bảo dưỡng Serial ${log.serial_number} (Chi phí: ${Number(finalCost).toLocaleString('vi-VN')}₫), mở lại cho thuê.`,
      });
    });

    tx();
    return res.json({
      success: true,
      message: `Đã hoàn tất bảo dưỡng Serial ${log.serial_number}. Thiết bị đã sẵn sàng (AVAILABLE).`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể hoàn tất phiếu bảo dưỡng.' });
  }
});
