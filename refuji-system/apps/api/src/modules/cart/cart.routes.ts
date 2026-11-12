// Tính năng: Quản lý giỏ hàng bền vững theo tài khoản & gộp (merge) giỏ khách vãng lai khi đăng nhập
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../../db.js';
import { extractAuthUser, AuthenticatedActor } from '../../utils/auth-context.js';
import {
  getLockedSerialsForRange,
  getModelLiveItemsAndCount,
  normalizeDateStr,
  parseModelId,
} from '../orders/availability.helper.js';

export const cartRouter = Router();

interface AuthedRequest extends Request {
  actor?: AuthenticatedActor;
}

function requireAuthUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const actor = extractAuthUser(req);
  if (!actor) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để đồng bộ giỏ hàng tài khoản.' });
  }
  req.actor = actor;
  return next();
}

cartRouter.use(requireAuthUser);

function toFrontendId(modelId: number, category: string): string {
  if (category === 'BODY') return `fuji-cam-${modelId}`;
  if (category === 'LENS') return `fuji-lens-${modelId}`;
  return `fuji-acc-${modelId}`;
}

function resolveProductModel(rawModelId: string | number, rawModelName?: string) {
  const numId = parseModelId(rawModelId);
  if (numId !== null) {
    const byId = db.prepare('SELECT * FROM product_models WHERE id = ?').get(numId) as any;
    if (byId) return byId;
  }
  if (rawModelName && rawModelName.trim()) {
    const exact = db
      .prepare('SELECT * FROM product_models WHERE model_name = ?')
      .get(rawModelName.trim()) as any;
    if (exact) return exact;
    const fuzzy = db
      .prepare('SELECT * FROM product_models WHERE model_name LIKE ?')
      .get(`%${rawModelName.trim()}%`) as any;
    if (fuzzy) return fuzzy;
  }
  return null;
}

function getHydratedUserCart(userId: number, startDate?: string, endDate?: string) {
  const { lockedSerials, activeDeliveredSerials } = getLockedSerialsForRange(startDate, endDate);

  const rows = db
    .prepare(
      `
      SELECT c.id as cart_row_id,
             c.model_id,
             c.quantity,
             c.created_at as cart_created_at,
             c.updated_at as cart_updated_at,
             m.model_name,
             m.category,
             m.mount_type,
             m.brand,
             m.base_rental_price_per_day,
             m.deposit_amount,
             m.description,
             m.specs_json,
             m.image_url,
             m.is_active
      FROM cart_items c
      INNER JOIN product_models m ON c.model_id = m.id
      WHERE c.user_id = ? AND m.is_active = 1
      ORDER BY c.id ASC
    `
    )
    .all(userId) as any[];

  const items = rows.map((row) => {
    const { items: physicalItems, availableCount } = getModelLiveItemsAndCount(
      row.model_id,
      lockedSerials,
      activeDeliveredSerials
    );
    let specs: Record<string, any> = {};
    try {
      specs = row.specs_json ? JSON.parse(row.specs_json) : {};
    } catch (_) {}

    return {
      modelId: row.model_id,
      frontendId: toFrontendId(row.model_id, row.category),
      quantity: row.quantity,
      addedAt: row.cart_created_at,
      updatedAt: row.cart_updated_at,
      availableCount,
      model: {
        id: row.model_id,
        model_name: row.model_name,
        category: row.category,
        mount_type: row.mount_type,
        brand: row.brand,
        base_rental_price_per_day: row.base_rental_price_per_day,
        deposit_amount: row.deposit_amount,
        description: row.description,
        specs_json: specs,
        image_url: row.image_url,
        is_active: Boolean(row.is_active),
        items: physicalItems,
      },
    };
  });

  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
  return { items, totalQuantity };
}

const mergeSchema = z.object({
  items: z
    .array(
      z.object({
        modelId: z.union([z.string(), z.number()]),
        modelName: z.string().optional(),
        quantity: z.coerce.number().int().min(1).max(99),
      })
    )
    .max(100),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const addItemSchema = z.object({
  modelId: z.union([z.string(), z.number()]),
  modelName: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(99).optional().default(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// GET /api/cart - Lấy giỏ hàng đã lưu trong DB của tài khoản hiện tại
cartRouter.get('/', (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.actor!.userId;
    const startDate = normalizeDateStr(req.query.start_date as string) || undefined;
    const endDate = normalizeDateStr(req.query.end_date as string) || undefined;

    const cart = getHydratedUserCart(userId, startDate, endDate);
    return res.json(cart);
  } catch (err) {
    console.error('❌ Lỗi tải giỏ hàng:', err);
    return res.status(500).json({ error: 'Không thể tải giỏ hàng của tài khoản.' });
  }
});

// POST /api/cart/merge - Gộp giỏ hàng khách vãng lai vào giỏ hàng cũ trong DB khi đăng nhập
cartRouter.post('/merge', (req: AuthedRequest, res: Response) => {
  try {
    const parsed = mergeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dữ liệu giỏ hàng cần gộp không hợp lệ.' });
    }

    const userId = req.actor!.userId;
    const startDate = normalizeDateStr(parsed.data.start_date) || undefined;
    const endDate = normalizeDateStr(parsed.data.end_date) || undefined;
    const incomingItems = parsed.data.items;

    const mergeTx = db.transaction(() => {
      const existingRows = db
        .prepare('SELECT model_id, quantity FROM cart_items WHERE user_id = ?')
        .all(userId) as Array<{ model_id: number; quantity: number }>;

      const previousQuantity = existingRows.reduce((sum, r) => sum + r.quantity, 0);
      const existingMap = new Map<number, number>(existingRows.map((r) => [r.model_id, r.quantity]));

      const { lockedSerials, activeDeliveredSerials } = getLockedSerialsForRange(startDate, endDate);

      // Gom các item trùng model_id từ giỏ vãng lai
      const groupedGuest = new Map<number, { model: any; quantity: number }>();
      const warnings: string[] = [];

      for (const rawItem of incomingItems) {
        const model = resolveProductModel(rawItem.modelId, rawItem.modelName);
        if (!model) {
          warnings.push(`Không tìm thấy thiết bị "${rawItem.modelName || rawItem.modelId}" trong hệ thống.`);
          continue;
        }
        if (!model.is_active) {
          warnings.push(`Thiết bị "${model.model_name}" hiện tạm ngừng cho thuê nên không được gộp.`);
          continue;
        }
        const prev = groupedGuest.get(model.id);
        groupedGuest.set(model.id, {
          model,
          quantity: (prev?.quantity || 0) + rawItem.quantity,
        });
      }

      const now = new Date().toISOString();
      const upsertStmt = db.prepare(`
        INSERT INTO cart_items (user_id, model_id, quantity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, model_id) DO UPDATE SET
          quantity = excluded.quantity,
          updated_at = excluded.updated_at
      `);

      let mergedGuestCount = 0;

      for (const [modelId, entry] of groupedGuest.entries()) {
        const { model, quantity: guestQty } = entry;
        const { availableCount } = getModelLiveItemsAndCount(
          modelId,
          lockedSerials,
          activeDeliveredSerials
        );
        const existingQty = existingMap.get(modelId) || 0;
        const desiredQty = existingQty + guestQty;

        let finalQty = desiredQty;
        if (availableCount <= 0) {
          finalQty = existingQty > 0 ? existingQty : guestQty;
          warnings.push(
            `Thiết bị "${model.model_name}" hiện đã hết máy khả dụng trong khoảng ngày đã chọn.`
          );
        } else if (desiredQty > availableCount) {
          finalQty = availableCount;
          warnings.push(
            `"${model.model_name}" chỉ còn ${availableCount} máy khả dụng — giỏ hàng đã tự điều chỉnh về ${availableCount}.`
          );
        }

        upsertStmt.run(userId, modelId, finalQty, now, now);
        mergedGuestCount += guestQty;
      }

      return { previousQuantity, mergedGuestCount, warnings };
    });

    const txInfo = mergeTx();
    const cart = getHydratedUserCart(userId, startDate, endDate);

    console.log(
      `🛒 [Cart Merge] User #${userId}: trước=${txInfo.previousQuantity}, gộp thêm=${txInfo.mergedGuestCount}, sau=${cart.totalQuantity}`
    );

    return res.json({
      ...cart,
      previousQuantity: txInfo.previousQuantity,
      mergedGuestCount: txInfo.mergedGuestCount,
      warnings: txInfo.warnings,
    });
  } catch (err) {
    console.error('❌ Lỗi gộp giỏ hàng:', err);
    return res.status(500).json({ error: 'Không thể gộp giỏ hàng vào tài khoản.' });
  }
});

// POST /api/cart/items - Thêm thiết bị vào giỏ hàng tài khoản (có kiểm tra tồn kho theo lịch thuê)
cartRouter.post('/items', (req: AuthedRequest, res: Response) => {
  try {
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Thông tin thiết bị thêm vào giỏ không hợp lệ.' });
    }

    const userId = req.actor!.userId;
    const startDate = normalizeDateStr(parsed.data.start_date) || undefined;
    const endDate = normalizeDateStr(parsed.data.end_date) || undefined;
    const addQty = parsed.data.quantity;

    const model = resolveProductModel(parsed.data.modelId, parsed.data.modelName);
    if (!model || !model.is_active) {
      return res.status(404).json({ error: 'Thiết bị không tồn tại hoặc đã ngừng cho thuê.' });
    }

    const result = db.transaction(() => {
      const { lockedSerials, activeDeliveredSerials } = getLockedSerialsForRange(startDate, endDate);
      const { availableCount } = getModelLiveItemsAndCount(
        model.id,
        lockedSerials,
        activeDeliveredSerials
      );

      if (availableCount <= 0) {
        return {
          ok: false as const,
          status: 409,
          error: `Thiết bị "${model.model_name}" hiện đã hết hàng trong kho hoặc đang có người giữ chỗ!`,
          maxAvailable: 0,
        };
      }

      const existing = db
        .prepare('SELECT quantity FROM cart_items WHERE user_id = ? AND model_id = ?')
        .get(userId, model.id) as { quantity: number } | undefined;

      const nextQty = (existing?.quantity || 0) + addQty;
      if (nextQty > availableCount) {
        return {
          ok: false as const,
          status: 409,
          error: `Kho chỉ còn ${availableCount} thiết bị "${model.model_name}". Đã đạt số lượng tối đa!`,
          maxAvailable: availableCount,
        };
      }

      const now = new Date().toISOString();
      db.prepare(
        `
        INSERT INTO cart_items (user_id, model_id, quantity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, model_id) DO UPDATE SET
          quantity = excluded.quantity,
          updated_at = excluded.updated_at
      `
      ).run(userId, model.id, nextQty, now, now);

      return { ok: true as const };
    })();

    if (!result.ok) {
      const cart = getHydratedUserCart(userId, startDate, endDate);
      return res.status(result.status).json({
        error: result.error,
        maxAvailable: result.maxAvailable,
        ...cart,
      });
    }

    const cart = getHydratedUserCart(userId, startDate, endDate);
    return res.json({
      ...cart,
      message: `Đã thêm "${model.model_name}" vào giỏ hàng thuê!`,
    });
  } catch (err) {
    console.error('❌ Lỗi thêm vào giỏ hàng:', err);
    return res.status(500).json({ error: 'Không thể thêm thiết bị vào giỏ hàng.' });
  }
});

// PUT /api/cart/items/:modelId - Cập nhật số lượng chính xác của một thiết bị trong giỏ
cartRouter.put('/items/:modelId', (req: AuthedRequest, res: Response) => {
  try {
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Số lượng cập nhật không hợp lệ.' });
    }

    const userId = req.actor!.userId;
    const rawModelParam = String(req.params.modelId);
    const model = resolveProductModel(rawModelParam);
    const startDate = normalizeDateStr(parsed.data.start_date) || undefined;
    const endDate = normalizeDateStr(parsed.data.end_date) || undefined;
    const newQty = parsed.data.quantity;

    if (!model) {
      const fallbackId = parseModelId(rawModelParam);
      if (fallbackId !== null && newQty <= 0) {
        db.prepare('DELETE FROM cart_items WHERE user_id = ? AND model_id = ?').run(userId, fallbackId);
      }
      return res.json(getHydratedUserCart(userId, startDate, endDate));
    }

    if (newQty <= 0) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND model_id = ?').run(userId, model.id);
      return res.json(getHydratedUserCart(userId, startDate, endDate));
    }

    const txRes = db.transaction(() => {
      const existing = db
        .prepare('SELECT quantity FROM cart_items WHERE user_id = ? AND model_id = ?')
        .get(userId, model.id) as { quantity: number } | undefined;

      const currentQty = existing?.quantity || 0;
      const { lockedSerials, activeDeliveredSerials } = getLockedSerialsForRange(startDate, endDate);
      const { availableCount } = getModelLiveItemsAndCount(
        model.id,
        lockedSerials,
        activeDeliveredSerials
      );

      // Luôn cho phép giảm số lượng nếu đang vượt tồn kho, chỉ chặn khi tăng vượt ngưỡng khả dụng
      if (newQty > currentQty && newQty > availableCount) {
        return {
          ok: false as const,
          status: 409,
          error:
            availableCount <= 0
              ? `Thiết bị "${model.model_name}" hiện tạm hết hàng trong kho.`
              : `Kho chỉ còn tối đa ${availableCount} thiết bị "${model.model_name}".`,
          maxAvailable: Math.max(0, availableCount),
        };
      }

      const now = new Date().toISOString();
      db.prepare(
        `
        INSERT INTO cart_items (user_id, model_id, quantity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, model_id) DO UPDATE SET
          quantity = excluded.quantity,
          updated_at = excluded.updated_at
      `
      ).run(userId, model.id, newQty, now, now);

      return { ok: true as const };
    })();

    const cart = getHydratedUserCart(userId, startDate, endDate);
    if (!txRes.ok) {
      return res.status(txRes.status).json({
        error: txRes.error,
        maxAvailable: txRes.maxAvailable,
        ...cart,
      });
    }

    return res.json(cart);
  } catch (err) {
    console.error('❌ Lỗi cập nhật số lượng giỏ hàng:', err);
    return res.status(500).json({ error: 'Không thể cập nhật số lượng trong giỏ hàng.' });
  }
});

// DELETE /api/cart/items/:modelId - Xóa một thiết bị khỏi giỏ hàng
cartRouter.delete('/items/:modelId', (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.actor!.userId;
    const rawModelParam = String(req.params.modelId);
    const model = resolveProductModel(rawModelParam);
    const targetModelId = model ? model.id : parseModelId(rawModelParam);
    const startDate = normalizeDateStr(req.query.start_date as string) || undefined;
    const endDate = normalizeDateStr(req.query.end_date as string) || undefined;

    if (targetModelId !== null) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND model_id = ?').run(userId, targetModelId);
    }

    return res.json(getHydratedUserCart(userId, startDate, endDate));
  } catch (err) {
    console.error('❌ Lỗi xóa thiết bị khỏi giỏ:', err);
    return res.status(500).json({ error: 'Không thể xóa thiết bị khỏi giỏ hàng.' });
  }
});

// DELETE /api/cart - Xóa toàn bộ giỏ hàng của tài khoản (khi bấm Xóa tất cả hoặc sau khi đặt đơn)
cartRouter.delete('/', (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.actor!.userId;
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    return res.json({ success: true, items: [], totalQuantity: 0 });
  } catch (err) {
    console.error('❌ Lỗi xóa toàn bộ giỏ hàng:', err);
    return res.status(500).json({ error: 'Không thể xóa giỏ hàng.' });
  }
});
