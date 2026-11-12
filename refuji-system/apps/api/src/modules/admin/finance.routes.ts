// Tính năng: API Quản lý Giao dịch Tài chính, Sổ cái VNPAY/VietQR/Quầy & Ghi nhận thu/hoàn cọc thủ công
import { Router, Request, Response } from 'express';
import { db } from '../../db.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { AdminActor, normalizeOrderCode } from './admin.middleware.js';

export const adminFinanceRouter = Router();

// GET /api/admin/payments — Danh sách sổ cái giao dịch & tổng hợp dòng tiền
adminFinanceRouter.get('/payments', (req: Request, res: Response) => {
  try {
    const typeFilter = typeof req.query.type === 'string' ? req.query.type.toUpperCase() : 'ALL';
    const methodFilter = typeof req.query.method === 'string' ? req.query.method.toUpperCase() : 'ALL';
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    let sql = `
      SELECT pt.*, ro.model_name, ro.is_guest, ro.guest_name, u.full_name as member_name
      FROM payment_transactions pt
      LEFT JOIN rental_orders ro ON pt.order_id = ro.id
      LEFT JOIN users u ON ro.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (typeFilter !== 'ALL') {
      sql += ' AND pt.transaction_type = ?';
      params.push(typeFilter);
    }
    if (methodFilter !== 'ALL') {
      sql += ' AND pt.payment_method = ?';
      params.push(methodFilter);
    }
    if (search) {
      sql += ' AND (LOWER(pt.transaction_code) LIKE ? OR LOWER(pt.order_code) LIKE ? OR LOWER(pt.note) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY pt.id DESC';

    const transactions = db.prepare(sql).all(...params) as any[];

    const allRows = db.prepare('SELECT amount, transaction_type, payment_method, status FROM payment_transactions').all() as any[];
    const totalCollected = allRows
      .filter((r) => r.transaction_type !== 'REFUND' && r.status === 'SUCCESS')
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const totalDeposits = allRows
      .filter((r) => r.transaction_type === 'DEPOSIT' && r.status === 'SUCCESS')
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const totalRefunds = allRows
      .filter((r) => r.transaction_type === 'REFUND')
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const totalPenalties = allRows
      .filter((r) => ['LATE_FEE', 'DAMAGE_FEE', 'OTHER_FEE'].includes(r.transaction_type) && r.status === 'SUCCESS')
      .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

    return res.json({
      transactions: transactions.map((t) => ({
        ...t,
        customer_name: t.is_guest === 1 ? t.guest_name || 'Khách vãng lai' : t.member_name || 'Thành viên ReFuji',
      })),
      summary: {
        totalCollected,
        totalDeposits,
        totalRefunds,
        totalPenalties,
        netCashflow: totalCollected - totalRefunds,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tải danh sách giao dịch tài chính.' });
  }
});

// POST /api/admin/payments/manual — Ghi nhận giao dịch thu/hoàn tiền tại quầy gắn với đơn hàng thực tế
adminFinanceRouter.post('/payments/manual', (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const { order_code, amount, payment_method, transaction_type, note } = req.body;

    const cleanCode = normalizeOrderCode(order_code);
    const order = db.prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?').get(cleanCode) as any;
    if (!order) {
      return res.status(404).json({ error: `Không tìm thấy đơn hàng #${cleanCode}` });
    }

    const numericAmount = Math.round(Number(amount) || 0);
    if (numericAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền giao dịch phải lớn hơn 0₫.' });
    }

    const allowedMethods = ['CASH', 'BANK_TRANSFER', 'VIETQR', 'VNPAY'];
    const pMethod = allowedMethods.includes(String(payment_method || '').toUpperCase())
      ? String(payment_method).toUpperCase()
      : 'CASH';

    const allowedTypes = ['DEPOSIT', 'RENTAL_FEE', 'FULL_BOOKING', 'LATE_FEE', 'DAMAGE_FEE', 'OTHER_FEE', 'REFUND'];
    const tType = allowedTypes.includes(String(transaction_type || '').toUpperCase())
      ? String(transaction_type).toUpperCase()
      : 'RENTAL_FEE';

    const nowIso = new Date().toISOString();
    const txCode = `TXN-POS-${cleanCode.slice(-6)}-${Date.now().toString().slice(-4)}`;
    const txStatus = tType === 'REFUND' ? 'REFUNDED' : 'SUCCESS';

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO payment_transactions (
          order_id, order_code, transaction_code, amount, payment_method,
          transaction_type, status, note, processed_by, processed_by_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        order.id,
        order.order_code,
        txCode,
        numericAmount,
        pMethod,
        tType,
        txStatus,
        String(note || '').trim() || `Ghi nhận ${tType} tại quầy cho đơn #${order.order_code}`,
        actor.userId,
        actor.fullName,
        nowIso
      );

      // Tự động cập nhật payment_status trên rental_orders nếu thu đủ hoặc hoàn tiền
      if (tType === 'DEPOSIT' && order.payment_status === 'UNPAID') {
        db.prepare("UPDATE rental_orders SET payment_status = 'DEPOSITED' WHERE id = ?").run(order.id);
      } else if (tType === 'RENTAL_FEE' || tType === 'FULL_BOOKING') {
        db.prepare("UPDATE rental_orders SET payment_status = 'PAID_FULL' WHERE id = ?").run(order.id);
      } else if (tType === 'REFUND') {
        db.prepare("UPDATE rental_orders SET payment_status = 'REFUNDED' WHERE id = ?").run(order.id);
      }

      recordAuditLog({
        userId: actor.userId,
        actorType: 'USER',
        actorLabel: actor.fullName,
        action: 'MANUAL_PAYMENT_RECORDED',
        entityType: 'PaymentTransaction',
        entityId: txCode,
        newValue: { order_code: order.order_code, amount: numericAmount, transaction_type: tType, payment_method: pMethod },
        description: `Ghi nhận giao dịch ${tType} (${numericAmount.toLocaleString('vi-VN')}₫ qua ${pMethod}) cho đơn #${order.order_code}.`,
      });
    });

    tx();
    return res.status(201).json({
      success: true,
      transaction_code: txCode,
      message: `Đã ghi nhận giao dịch ${txCode} (${numericAmount.toLocaleString('vi-VN')}₫).`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Không thể ghi nhận giao dịch thủ công.' });
  }
});
