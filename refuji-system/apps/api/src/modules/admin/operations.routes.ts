// Tính năng: API Nghiệp vụ Bàn giao (Check-out KYC + Ảnh đối chứng) & Thu hồi Quyết toán (Check-in Phí trễ/Hư hỏng/Hoàn cọc)
import { Router, Request, Response } from 'express';
import { db } from '../../db.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { syncAndEvaluateUserTier } from '../auth/auth.routes.js';
import { parseModelId } from '../orders/availability.helper.js';
import { AdminActor, normalizeOrderCode } from './admin.middleware.js';
import { calculateCheckinSettlement, DamageLevelType } from './settlement.helper.js';

export const adminOperationsRouter = Router();

// Helper tính tổng đơn giá thuê/ngày từ order
function computeDailyRentSumForOrder(order: any): number {
  let items: any[] = [];
  try {
    items = order.items_detail ? JSON.parse(order.items_detail) : [];
  } catch (_) {}
  if (items.length > 0) {
    const sum = items.reduce(
      (acc, it) => acc + (Number(it.daily_rate) || 0) * Math.max(1, Number(it.quantity) || 1),
      0
    );
    if (sum > 0) return sum;
  }
  const s = new Date(order.start_date);
  const e = new Date(order.expected_return_date);
  const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000));
  return Math.round((Number(order.total_rent) || 0) / days);
}

// GET /api/admin/orders/:orderCode/records — Toàn bộ hồ sơ bàn giao, thu hồi, ảnh & giao dịch của 1 đơn hàng
adminOperationsRouter.get('/orders/:orderCode/records', (req: Request, res: Response) => {
  try {
    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    const order = db
      .prepare(`
        SELECT o.*,
               u.full_name as user_full_name,
               u.phone as user_phone,
               u.email as user_email,
               u.membership_tier as user_membership_tier,
               u.reputation_score as user_reputation_score,
               k.id_card_last4 as user_id_card_last4
        FROM rental_orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN user_kyc k ON u.id = k.user_id
        WHERE UPPER(o.order_code) = ?
      `)
      .get(orderCode) as any;

    if (!order) {
      return res.status(404).json({ error: `Không tìm thấy đơn #${orderCode}` });
    }

    const checkoutRecord = db
      .prepare('SELECT * FROM checkout_records WHERE UPPER(order_code) = ?')
      .get(orderCode) as any;

    const returnRecord = db
      .prepare('SELECT * FROM return_records WHERE UPPER(order_code) = ?')
      .get(orderCode) as any;

    const returnItems = returnRecord
      ? db
          .prepare('SELECT * FROM return_item_details WHERE return_record_id = ?')
          .all(returnRecord.id)
      : [];

    const inspectionPhotos = db
      .prepare('SELECT id, order_code, serial_number, phase, photo_data, caption, uploaded_at FROM inspection_photos WHERE UPPER(order_code) = ? ORDER BY id ASC')
      .all(orderCode);

    const transactions = db
      .prepare('SELECT * FROM payment_transactions WHERE UPPER(order_code) = ? ORDER BY id DESC')
      .all(orderCode);

    let parsedItems: any[] = [];
    try {
      parsedItems = order.items_detail ? JSON.parse(order.items_detail) : [];
    } catch (_) {}

    // Lấy Serial hiện tại của các items trong đơn để hiển thị Check-out / Check-in
    const assignedList = order.assigned_serials
      ? String(order.assigned_serials).split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    const assignedItemUnits = assignedList.map((sn: string) => {
      const unit = db
        .prepare(`
          SELECT pi.*, pm.model_name, pm.deposit_amount as model_deposit
          FROM product_items pi
          JOIN product_models pm ON pi.model_id = pm.id
          WHERE pi.serial_number = ?
        `)
        .get(sn) as any;
      return (
        unit || {
          serial_number: sn,
          model_name: order.model_name,
          shutter_count: 0,
          condition_percent: 98,
          status: 'AVAILABLE',
          model_deposit: order.deposit_amount,
        }
      );
    });

    // Lấy toàn bộ Serial ứng viên thuộc các mẫu trong đơn để Staff có thể chọn hoặc đổi Serial vật lý khi Check-out
    const targetModelIds = Array.from(
      new Set(
        (parsedItems.length > 0
          ? parsedItems.map((it: any) => parseModelId(it.model_id))
          : [parseModelId(order.model_id)]
        ).filter((n): n is number => typeof n === 'number' && !isNaN(n) && n > 0)
      )
    );
    const warehouseSerials: any[] = [];
    for (const mId of targetModelIds) {
      const mItems = db
        .prepare(`
          SELECT pi.*, pm.model_name, pm.deposit_amount as model_deposit
          FROM product_items pi
          JOIN product_models pm ON pi.model_id = pm.id
          WHERE pi.model_id = ?
          ORDER BY CASE WHEN pi.status = 'AVAILABLE' THEN 0 ELSE 1 END, pi.id ASC
        `)
        .all(mId) as any[];
      warehouseSerials.push(...mItems);
    }

    const paidDep = db
      .prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payment_transactions WHERE UPPER(order_code) = ? AND transaction_type = 'DEPOSIT' AND status = 'SUCCESS'")
      .get(orderCode) as { s: number };
    const paidRent = db
      .prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payment_transactions WHERE UPPER(order_code) = ? AND transaction_type IN ('RENTAL_FEE', 'FULL_BOOKING') AND status = 'SUCCESS'")
      .get(orderCode) as { s: number };

    const missingDeposit = Math.max(0, (Number(order.deposit_amount) || 0) - (paidDep?.s || 0));
    const missingRent = Math.max(0, (Number(order.total_rent) || 0) - (paidRent?.s || 0));

    return res.json({
      order: {
        ...order,
        is_guest: order.is_guest === 1,
        customer_name: order.is_guest === 1 ? order.guest_name : order.user_full_name || 'Thành viên ReFuji',
        customer_phone: order.is_guest === 1 ? order.guest_phone : order.user_phone || '',
        customer_email: order.is_guest === 1 ? order.guest_email : order.user_email || '',
        membership_tier: order.is_guest === 1 ? 'GUEST' : order.user_membership_tier || 'BRONZE',
        reputation_score: order.is_guest === 1 ? null : order.user_reputation_score ?? 100,
        id_card_last4: order.is_guest === 1 ? null : order.user_id_card_last4 || null,
        items_detail: parsedItems,
        daily_rent_sum: computeDailyRentSumForOrder(order),
        paid_deposit_amount: paidDep?.s || 0,
        paid_rent_amount: paidRent?.s || 0,
        missing_deposit_amount: missingDeposit,
        missing_rent_amount: missingRent,
        remaining_due: missingDeposit + missingRent,
      },
      assigned_item_units: assignedItemUnits,
      warehouse_serials: warehouseSerials,
      checkout_record: checkoutRecord
        ? {
            ...checkoutRecord,
            accessories: (() => {
              try {
                return JSON.parse(checkoutRecord.accessories_json || '{}');
              } catch {
                return {};
              }
            })(),
            shutter_snapshots: (() => {
              try {
                return JSON.parse(checkoutRecord.shutter_snapshots_json || '{}');
              } catch {
                return {};
              }
            })(),
          }
        : null,
      return_record: returnRecord,
      return_items: returnItems,
      inspection_photos: inspectionPhotos,
      transactions,
    });
  } catch (err: any) {
    console.error('❌ [Operations] Lỗi tải hồ sơ đơn hàng:', err);
    return res.status(500).json({ error: 'Không thể tải hồ sơ bàn giao / thu hồi đơn hàng.' });
  }
});

// POST /api/admin/orders/:orderCode/checkout — Quy trình Bàn giao máy tại quầy (UC-02)
adminOperationsRouter.post('/orders/:orderCode/checkout', (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    const {
      kyc_verification_method,
      kyc_document_last4,
      contract_signed,
      assigned_serials,
      accessories,
      shutter_snapshots,
      condition_notes,
      collect_remaining_rent,
      rent_payment_method,
      photos,
    } = req.body;

    const allowedKyc = ['CITIZEN_ID_CARD', 'VNEID_APP', 'PASSPORT', 'FAST_TRACK_PLATINUM'];
    if (!allowedKyc.includes(String(kyc_verification_method || '').toUpperCase())) {
      return res.status(400).json({ error: 'Phương thức đối chiếu KYC không hợp lệ.' });
    }

    const cleanLast4 = String(kyc_document_last4 || '').trim();
    if (!/^\d{4}$/.test(cleanLast4)) {
      return res.status(400).json({ error: 'Bắt buộc nhập đủ 4 chữ số cuối CCCD / VNeID đã đối chiếu trực tiếp.' });
    }

    if (!contract_signed) {
      return res.status(400).json({ error: 'Khách hàng phải xác nhận ký biên bản bàn giao thiết bị.' });
    }

    const serialsList: string[] = Array.isArray(assigned_serials)
      ? assigned_serials.map((s: any) => String(s).trim()).filter(Boolean)
      : String(assigned_serials || '').split(',').map((s) => s.trim()).filter(Boolean);

    if (serialsList.length === 0) {
      return res.status(400).json({ error: 'Phải chọn ít nhất 1 mã Serial vật lý để bàn giao.' });
    }

    const photoList: Array<{ photo_data: string; caption?: string; serial_number?: string }> = Array.isArray(photos)
      ? photos.filter((p: any) => p && typeof p.photo_data === 'string' && p.photo_data.length > 20)
      : [];

    if (photoList.length < 2) {
      return res.status(400).json({
        error: 'Bắt buộc chụp / tải lên tối thiểu 2 ảnh đối chứng ngoại quan & cảm biến trước khi bàn giao.',
      });
    }

    const checkoutTx = db.transaction(() => {
      const order = db
        .prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?')
        .get(orderCode) as any;

      if (!order) {
        return { ok: false as const, status: 404, error: `Không tìm thấy đơn #${orderCode}` };
      }

      if (!['CONFIRMED', 'PENDING'].includes(order.order_status)) {
        return {
          ok: false as const,
          status: 400,
          error: `Chỉ có thể bàn giao đơn ở trạng thái CONFIRMED / PENDING (hiện tại: ${order.order_status}).`,
        };
      }

      // Kiểm tra đối chiếu CCCD nếu Thành viên đã có KYC
      if (order.is_guest === 0 && order.user_id) {
        const kycRow = db
          .prepare('SELECT id_card_last4 FROM user_kyc WHERE user_id = ?')
          .get(order.user_id) as { id_card_last4?: string } | undefined;
        if (kycRow?.id_card_last4 && kycRow.id_card_last4 !== '0000' && kycRow.id_card_last4 !== cleanLast4) {
          return {
            ok: false as const,
            status: 400,
            error: `4 số cuối CCCD không khớp hồ sơ thành viên (yêu cầu ****${kycRow.id_card_last4}).`,
          };
        }
      }

      // Kiểm tra hợp lệ từng Serial (không MAINTENANCE / LOST / đang RENTED ở đơn khác)
      for (const sn of serialsList) {
        const item = db
          .prepare('SELECT id, serial_number, status FROM product_items WHERE serial_number = ?')
          .get(sn) as any;
        if (!item) {
          return { ok: false as const, status: 400, error: `Số Serial "${sn}" không tồn tại trong kho.` };
        }
        if (item.status === 'MAINTENANCE' || item.status === 'LOST') {
          return { ok: false as const, status: 409, error: `Serial "${sn}" đang ở trạng thái ${item.status}, không thể bàn giao.` };
        }
        if (item.status === 'RENTED') {
          return { ok: false as const, status: 409, error: `Serial "${sn}" hiện đang được đơn khác giữ (RENTED).` };
        }
      }

      // Kiểm tra thu đủ tiền thuê & cọc trước khi rời quầy (Mục 4.1)
      const nowIso = new Date().toISOString();
      const rentPayMethod = ['CASH', 'BANK_TRANSFER', 'VIETQR', 'VNPAY'].includes(String(rent_payment_method || '').toUpperCase())
        ? String(rent_payment_method).toUpperCase()
        : 'CASH';
      const rentAmt = Number(order.total_rent) || 0;
      const depositAmt = Number(order.deposit_amount) || 0;

      const paidDepRow = db
        .prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payment_transactions WHERE UPPER(order_code) = ? AND transaction_type = 'DEPOSIT' AND status = 'SUCCESS'")
        .get(orderCode) as { s: number };
      const paidRentRow = db
        .prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payment_transactions WHERE UPPER(order_code) = ? AND transaction_type IN ('RENTAL_FEE', 'FULL_BOOKING') AND status = 'SUCCESS'")
        .get(orderCode) as { s: number };

      const missingDeposit = Math.max(0, depositAmt - (paidDepRow?.s || 0));
      const missingRent = Math.max(0, rentAmt - (paidRentRow?.s || 0));
      const totalMissingAtCounter = missingDeposit + missingRent;

      if (order.payment_status !== 'PAID_FULL' && totalMissingAtCounter > 0) {
        if (!collect_remaining_rent) {
          return {
            ok: false as const,
            status: 400,
            error: `Thiết bị chỉ được rời quầy sau khi xác nhận thu đủ ${totalMissingAtCounter.toLocaleString('vi-VN')}₫ còn thiếu (PAID_FULL).`,
          };
        }

        if (missingDeposit > 0) {
          db.prepare(`
            INSERT INTO payment_transactions (
              order_id, order_code, transaction_code, amount, payment_method,
              transaction_type, status, note, processed_by, processed_by_name, created_at
            ) VALUES (?, ?, ?, ?, ?, 'DEPOSIT', 'SUCCESS', ?, ?, ?, ?)
          `).run(
            order.id,
            orderCode,
            `TXN-DEP-${orderCode}-${Date.now().toString().slice(-4)}`,
            missingDeposit,
            rentPayMethod,
            `Thu tiền cọc tại quầy khi Check-out #${orderCode}`,
            actor.userId,
            actor.fullName,
            nowIso
          );
        }

        if (missingRent > 0) {
          db.prepare(`
            INSERT INTO payment_transactions (
              order_id, order_code, transaction_code, amount, payment_method,
              transaction_type, status, note, processed_by, processed_by_name, created_at
            ) VALUES (?, ?, ?, ?, ?, 'RENTAL_FEE', 'SUCCESS', ?, ?, ?, ?)
          `).run(
            order.id,
            orderCode,
            `TXN-CHK-${orderCode}-${Date.now().toString().slice(-4)}`,
            missingRent,
            rentPayMethod,
            `Thu tiền thuê tại quầy khi Check-out #${orderCode}`,
            actor.userId,
            actor.fullName,
            nowIso
          );
        }
      }

      // Lưu CheckoutRecord
      db.prepare(`
        INSERT INTO checkout_records (
          order_id, order_code, staff_id, staff_name, checkout_date,
          kyc_verification_method, kyc_document_last4, contract_signed,
          accessories_json, shutter_snapshots_json, condition_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      `).run(
        order.id,
        orderCode,
        actor.userId,
        actor.fullName,
        nowIso,
        String(kyc_verification_method).toUpperCase(),
        cleanLast4,
        JSON.stringify(accessories || {}),
        JSON.stringify(shutter_snapshots || {}),
        (condition_notes || '').trim(),
        nowIso
      );

      // Lưu ảnh đối chứng Check-out
      const insPhoto = db.prepare(`
        INSERT INTO inspection_photos (
          order_id, order_code, serial_number, phase, photo_data, caption, uploaded_by, uploaded_at
        ) VALUES (?, ?, ?, 'CHECKOUT', ?, ?, ?, ?)
      `);
      for (const ph of photoList) {
        insPhoto.run(
          order.id,
          orderCode,
          ph.serial_number || serialsList[0],
          ph.photo_data,
          ph.caption || 'Ảnh đối chứng Check-out',
          actor.userId,
          nowIso
        );
      }

      // Cập nhật ProductItems -> RENTED & shutter snapshot
      const updateItem = db.prepare(`
        UPDATE product_items
        SET status = 'RENTED',
            shutter_count = COALESCE(?, shutter_count),
            total_rental_count = total_rental_count + 1
        WHERE serial_number = ?
      `);
      for (const sn of serialsList) {
        const snapShutter = shutter_snapshots && typeof shutter_snapshots[sn] === 'number'
          ? Math.max(0, Math.round(shutter_snapshots[sn]))
          : null;
        updateItem.run(snapShutter, sn);
      }

      // Cập nhật RentalOrders -> DELIVERED & PAID_FULL
      db.prepare(`
        UPDATE rental_orders
        SET order_status = 'DELIVERED',
            payment_status = 'PAID_FULL',
            assigned_serials = ?
        WHERE id = ?
      `).run(serialsList.join(', '), order.id);

      recordAuditLog({
        userId: actor.userId,
        actorType: 'USER',
        actorLabel: actor.fullName,
        action: 'ORDER_CHECKOUT',
        entityType: 'RentalOrder',
        entityId: orderCode,
        oldValue: { order_status: order.order_status, payment_status: order.payment_status },
        newValue: {
          order_status: 'DELIVERED',
          payment_status: 'PAID_FULL',
          assigned_serials: serialsList,
          kyc_last4: cleanLast4,
        },
        description: `Bàn giao đơn #${orderCode} (${serialsList.join(', ')}), đối chiếu KYC ****${cleanLast4} & thu đủ tiền thuê.`,
      });

      return {
        ok: true as const,
        orderCode,
        orderStatus: 'DELIVERED',
        assignedSerials: serialsList,
      };
    });

    const result = checkoutTx();
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({
      success: true,
      ...result,
      message: `Đã hoàn tất bàn giao (Check-out) đơn #${orderCode}. Thiết bị đã chuyển sang RENTED.`,
    });
  } catch (err: any) {
    console.error('❌ [Check-out] Lỗi bàn giao:', err);
    return res.status(500).json({ error: err.message || 'Lỗi máy chủ khi bàn giao thiết bị.' });
  }
});

// POST /api/admin/orders/:orderCode/checkin-preview — Dự toán hoàn cọc & phí phạt Check-in theo Mục 4.2/4.5/4.7
adminOperationsRouter.post('/orders/:orderCode/checkin-preview', (req: Request, res: Response) => {
  try {
    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    const order = db
      .prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?')
      .get(orderCode) as any;

    if (!order) {
      return res.status(404).json({ error: `Không tìm thấy đơn #${orderCode}` });
    }

    const calculation = calculateCheckinSettlement({
      expectedReturnDateStr: order.expected_return_date,
      actualReturnDateIso: req.body.actual_return_date || new Date().toISOString(),
      dailyRentSum: computeDailyRentSumForOrder(order),
      depositHeld: Number(order.deposit_amount) || 0,
      otherFee: Number(req.body.other_fee) || 0,
      itemInspections: Array.isArray(req.body.item_inspections) ? req.body.item_inspections : [],
    });

    return res.json({ success: true, calculation });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể dự toán quyết toán.' });
  }
});

// POST /api/admin/orders/:orderCode/checkin — Thu hồi & Quyết toán hoàn cọc (Check-in)
adminOperationsRouter.post('/orders/:orderCode/checkin', (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    const {
      actual_return_date,
      other_fee,
      other_fee_description,
      staff_inspection_notes,
      refund_method,
      item_inspections,
      photos,
    } = req.body;

    const checkinTx = db.transaction(() => {
      const order = db
        .prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?')
        .get(orderCode) as any;

      if (!order) {
        return { ok: false as const, status: 404, error: `Không tìm thấy đơn #${orderCode}` };
      }

      if (!['DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL'].includes(order.order_status)) {
        return {
          ok: false as const,
          status: 400,
          error: `Chỉ có thể Check-in thu hồi đơn đang giao (DELIVERED / OVERDUE). Trạng thái hiện tại: ${order.order_status}.`,
        };
      }

      const assignedList = order.assigned_serials
        ? String(order.assigned_serials).split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      const rawInspections =
        Array.isArray(item_inspections) && item_inspections.length > 0
          ? item_inspections
          : assignedList.map((sn: string) => ({
              serial_number: sn,
              model_name: order.model_name,
              unit_deposit:
                assignedList.length > 0
                  ? Math.round((Number(order.deposit_amount) || 0) / assignedList.length)
                  : Number(order.deposit_amount) || 0,
              condition_after: 98,
              shutter_count_after: 0,
              damage_level: 'NONE' as DamageLevelType,
              missing_accessories_fee: 0,
            }));

      const calc = calculateCheckinSettlement({
        expectedReturnDateStr: order.expected_return_date,
        actualReturnDateIso: actual_return_date || new Date().toISOString(),
        dailyRentSum: computeDailyRentSumForOrder(order),
        depositHeld: Number(order.deposit_amount) || 0,
        otherFee: Number(other_fee) || 0,
        itemInspections: rawInspections,
      });

      const nowIso = new Date().toISOString();

      // 1. Ghi ReturnRecord
      const retRes = db
        .prepare(`
          INSERT INTO return_records (
            order_id, order_code, staff_id, staff_name, actual_return_date,
            late_hours, late_days, total_late_fee, total_damage_fee,
            total_missing_acc_fee, other_fee, other_fee_description,
            deposit_held, refund_amount, additional_charge_amount,
            staff_inspection_notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          order.id,
          orderCode,
          actor.userId,
          actor.fullName,
          calc.actualReturnDateIso,
          calc.diffHours,
          calc.lateDays,
          calc.totalLateFee,
          calc.totalDamageFee,
          calc.totalMissingAccFee,
          calc.otherFee,
          (other_fee_description || '').trim() || null,
          calc.depositHeld,
          calc.refundAmount,
          calc.additionalChargeAmount,
          (staff_inspection_notes || '').trim() || null,
          nowIso
        );
      const returnRecordId = Number(retRes.lastInsertRowid);

      // 2. Ghi ReturnItemDetails & cập nhật trạng thái ProductItems + tự mở phiếu bảo dưỡng nếu cần
      const insRetDetail = db.prepare(`
        INSERT INTO return_item_details (
          return_record_id, order_code, item_id, serial_number, model_name,
          condition_after, shutter_count_after, damage_level, damage_description,
          damage_fee, accessories_returned_json, missing_accessories_fee, next_item_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const comp of calc.computedItems) {
        const itemRow = db
          .prepare('SELECT id, model_id FROM product_items WHERE serial_number = ?')
          .get(comp.serial_number) as { id: number; model_id: number } | undefined;

        insRetDetail.run(
          returnRecordId,
          orderCode,
          itemRow?.id ?? null,
          comp.serial_number,
          comp.model_name,
          comp.condition_after,
          comp.shutter_count_after,
          comp.damage_level,
          comp.damage_description || null,
          comp.damage_fee,
          JSON.stringify(comp.accessories_returned || {}),
          comp.missing_accessories_fee,
          comp.next_item_status,
          nowIso
        );

        if (itemRow) {
          db.prepare(`
            UPDATE product_items
            SET status = ?,
                condition_percent = ?,
                shutter_count = CASE WHEN ? > shutter_count THEN ? ELSE shutter_count END
            WHERE id = ?
          `).run(
            comp.next_item_status,
            comp.condition_after,
            comp.shutter_count_after,
            comp.shutter_count_after,
            itemRow.id
          );

          // Tự động mở phiếu bảo dưỡng nếu thiết bị bị đánh dấu MAINTENANCE lúc trả máy
          if (comp.next_item_status === 'MAINTENANCE') {
            db.prepare(`
              INSERT INTO maintenance_logs (
                item_id, serial_number, maintenance_type, description, cost,
                performed_by, performed_by_name, external_vendor, shutter_at_service,
                started_at, completed_at, created_at
              ) VALUES (?, ?, 'REPAIR', ?, 0, ?, ?, 'ReFuji Care Center', ?, ?, NULL, ?)
            `).run(
              itemRow.id,
              comp.serial_number,
              `Kiểm tra sau Check-in đơn #${orderCode} (${comp.damage_level}): ${comp.damage_description || 'Cần kiểm định kỹ thuật'}`,
              actor.userId,
              actor.fullName,
              comp.shutter_count_after,
              nowIso.slice(0, 10),
              nowIso
            );
          }
        }
      }

      // 3. Lưu ảnh kiểm định Check-in nếu có
      const photoList: Array<{ photo_data: string; caption?: string; serial_number?: string }> = Array.isArray(photos)
        ? photos.filter((p: any) => p && typeof p.photo_data === 'string' && p.photo_data.length > 20)
        : [];
      if (photoList.length > 0) {
        const insPhoto = db.prepare(`
          INSERT INTO inspection_photos (
            order_id, order_code, serial_number, phase, photo_data, caption, uploaded_by, uploaded_at
          ) VALUES (?, ?, ?, 'CHECKIN', ?, ?, ?, ?)
        `);
        for (const ph of photoList) {
          insPhoto.run(
            order.id,
            orderCode,
            ph.serial_number || assignedList[0] || null,
            ph.photo_data,
            ph.caption || 'Ảnh đối chứng Check-in',
            actor.userId,
            nowIso
          );
        }
      }

      // 4. Ghi sổ cái PaymentTransactions (Phí phạt + Hoàn cọc)
      const resolvedRefundMethod = String(refund_method || 'BANK_TRANSFER').toUpperCase() === 'CASH'
        ? 'CASH'
        : 'BANK_TRANSFER';

      if (calc.totalLateFee > 0) {
        db.prepare(`
          INSERT INTO payment_transactions (
            order_id, order_code, transaction_code, amount, payment_method,
            transaction_type, status, note, processed_by, processed_by_name, created_at
          ) VALUES (?, ?, ?, ?, ?, 'LATE_FEE', 'SUCCESS', ?, ?, ?, ?)
        `).run(
          order.id,
          orderCode,
          `TXN-LATE-${orderCode}-${Date.now().toString().slice(-4)}`,
          calc.totalLateFee,
          resolvedRefundMethod,
          `Khấu trừ phí trễ hạn (${calc.lateDays} ngày) đơn #${orderCode}`,
          actor.userId,
          actor.fullName,
          nowIso
        );
      }
      if (calc.totalDamageFee + calc.totalMissingAccFee + calc.otherFee > 0) {
        db.prepare(`
          INSERT INTO payment_transactions (
            order_id, order_code, transaction_code, amount, payment_method,
            transaction_type, status, note, processed_by, processed_by_name, created_at
          ) VALUES (?, ?, ?, ?, ?, 'DAMAGE_FEE', 'SUCCESS', ?, ?, ?, ?)
        `).run(
          order.id,
          orderCode,
          `TXN-DMG-${orderCode}-${Date.now().toString().slice(-4)}`,
          calc.totalDamageFee + calc.totalMissingAccFee + calc.otherFee,
          resolvedRefundMethod,
          `Khấu trừ phí hư hỏng / phụ kiện / khác đơn #${orderCode}`,
          actor.userId,
          actor.fullName,
          nowIso
        );
      }
      if (calc.refundAmount > 0) {
        db.prepare(`
          INSERT INTO payment_transactions (
            order_id, order_code, transaction_code, amount, payment_method,
            transaction_type, status, note, processed_by, processed_by_name, created_at
          ) VALUES (?, ?, ?, ?, ?, 'REFUND', 'REFUNDED', ?, ?, ?, ?)
        `).run(
          order.id,
          orderCode,
          `TXN-REF-${orderCode}-${Date.now().toString().slice(-4)}`,
          calc.refundAmount,
          resolvedRefundMethod,
          `Hoàn tiền cọc cho khách khi quyết toán Check-in đơn #${orderCode}`,
          actor.userId,
          actor.fullName,
          nowIso
        );
      }

      // 5. Cập nhật điểm uy tín & tổng đơn hoàn tất cho Thành viên (Khách vãng lai = 0)
      if (order.is_guest === 0 && order.user_id) {
        const userRow = db
          .prepare('SELECT id, reputation_score, total_completed_rentals, is_active FROM users WHERE id = ?')
          .get(order.user_id) as any;
        if (userRow) {
          const nextScore = Math.min(100, Math.max(0, (userRow.reputation_score ?? 100) + calc.reputationDelta));
          const nextCompleted = (userRow.total_completed_rentals || 0) + 1;
          const nextActive = nextScore < 20 ? 0 : userRow.is_active;
          db.prepare(`
            UPDATE users
            SET reputation_score = ?, total_completed_rentals = ?, is_active = ?, updated_at = ?
            WHERE id = ?
          `).run(nextScore, nextCompleted, nextActive, nowIso, userRow.id);
        }
      }

      // 6. Chuyển RentalOrders -> RETURNED
      db.prepare(`
        UPDATE rental_orders
        SET order_status = 'RETURNED',
            payment_status = ?
        WHERE id = ?
      `).run(calc.resultingPaymentStatus, order.id);

      recordAuditLog({
        userId: actor.userId,
        actorType: 'USER',
        actorLabel: actor.fullName,
        action: 'ORDER_CHECKIN_SETTLED',
        entityType: 'RentalOrder',
        entityId: orderCode,
        oldValue: { order_status: order.order_status },
        newValue: {
          order_status: 'RETURNED',
          payment_status: calc.resultingPaymentStatus,
          total_penalty: calc.totalPenalty,
          refund_amount: calc.refundAmount,
        },
        description: `Thu hồi & quyết toán đơn #${orderCode}: Phạt ${calc.totalPenalty.toLocaleString('vi-VN')}₫, hoàn cọc ${calc.refundAmount.toLocaleString('vi-VN')}₫.`,
      });

      return {
        ok: true as const,
        orderCode,
        orderStatus: 'RETURNED',
        calculation: calc,
        userId: order.user_id,
      };
    });

    const result = checkinTx();
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    if (result.userId) {
      syncAndEvaluateUserTier(result.userId);
    }

    return res.json({
      success: true,
      ...result,
      message: `Đã thu hồi & quyết toán đơn #${orderCode}. Số tiền hoàn trả khách: ${result.calculation.refundAmount.toLocaleString('vi-VN')}₫.`,
    });
  } catch (err: any) {
    console.error('❌ [Check-in] Lỗi thu hồi & quyết toán:', err);
    return res.status(500).json({ error: err.message || 'Không thể hoàn tất thu hồi đơn hàng.' });
  }
});
