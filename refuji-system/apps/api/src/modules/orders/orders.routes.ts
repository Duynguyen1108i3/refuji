import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db.js';
import { syncAndEvaluateUserTier } from '../auth/auth.routes.js';

export const ordersRouter = Router();

// POST / - Đặt thuê thiết bị với cơ chế giữ chỗ 15 phút (Reservation Hold)
ordersRouter.post('/', (req: Request, res: Response) => {
  try {
    const { user_id, model_id, model_name, start_date, expected_return_date, total_rent, deposit_amount } = req.body;
    const holdMinutes = 15;
    const paymentDeadline = new Date(Date.now() + holdMinutes * 60 * 1000);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    // Lưu vào bảng rental_orders
    try {
      db.prepare(`
        INSERT INTO rental_orders (
          order_code, user_id, model_id, model_name, start_date,
          expected_return_date, total_rent, deposit_amount, payment_deadline, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        user_id || 1,
        String(model_id || '1'),
        model_name || 'Thiết bị Fujifilm',
        start_date || '2026-10-29',
        expected_return_date || '2026-10-31',
        Number(total_rent) || 0,
        Number(deposit_amount) || 0,
        paymentDeadline.toISOString(),
        now
      );
    } catch (dbErr) {
      console.warn('Lỗi lưu đơn vào DB:', dbErr);
    }

    // Tự động kiểm tra ràng buộc & nâng hạng thành viên nếu đủ điều kiện đơn thuê
    if (user_id) {
      syncAndEvaluateUserTier(Number(user_id));
    }

    console.log(`📦 [Orders] Đã tạo đơn giữ chỗ 15 phút: ${orderId} cho User ${user_id}`);

    res.status(201).json({
      success: true,
      orderId,
      status: 'PENDING_PAYMENT',
      payment_deadline: paymentDeadline.toISOString(),
      holdDeadline: paymentDeadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      message: `Đã đặt giữ chỗ thành công 15 phút cho thiết bị. Hết hạn giữ chỗ lúc: ${paymentDeadline.toLocaleTimeString('vi-VN')}`,
    });
  } catch (err) {
    console.error('❌ Error creating rental order:', err);
    res.status(500).json({ error: 'Không thể tạo đơn đặt thuê' });
  }
});

// GET /my-orders - Lấy danh sách đơn thuê của khách hàng hiện tại
ordersRouter.get('/my-orders', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: number | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || 'refuji_access_secret_key_change_in_prod_min_32_chars'
        ) as { userId: number };
        userId = decoded.userId;
      } catch (_) {}
    }

    if (!userId && req.cookies?.refuji_refresh_token) {
      try {
        const decoded = jwt.verify(
          req.cookies.refuji_refresh_token,
          process.env.JWT_REFRESH_SECRET || 'refuji_refresh_secret_key_change_in_prod_min_32_chars'
        ) as { userId: number };
        userId = decoded.userId;
      } catch (_) {}
    }

    if (!userId) {
      userId = 1; // Mặc định tài khoản demo nếu chưa đăng nhập
    }

    const orders = db.prepare(`
      SELECT * FROM rental_orders WHERE user_id = ? ORDER BY id DESC
    `).all(userId);

    res.json(orders);
  } catch (err) {
    console.error('Lỗi lấy đơn thuê:', err);
    res.status(500).json({ error: 'Không thể lấy danh sách đơn thuê' });
  }
});
