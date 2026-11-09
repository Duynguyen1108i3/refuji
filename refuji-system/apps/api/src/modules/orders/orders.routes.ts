import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db.js';
import { syncAndEvaluateUserTier } from '../auth/auth.routes.js';

export const ordersRouter = Router();

// Hàm trích xuất ID số nguyên từ model_id
function parseModelId(rawId: string | number): number | null {
  if (typeof rawId === 'number') return rawId;
  const match = String(rawId).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// POST / - Đặt thuê thiết bị với ràng buộc tồn kho & cơ chế giữ chỗ 15 phút (Reservation Hold)
ordersRouter.post('/', (req: Request, res: Response) => {
  try {
    const { 
      user_id, 
      model_id, 
      model_name, 
      start_date, 
      expected_return_date, 
      total_rent, 
      deposit_amount 
    } = req.body;

    // 1. Tự động giải phóng các đơn giữ chỗ 15 phút đã hết hạn mà chưa thanh toán
    try {
      db.prepare(`
        UPDATE rental_orders 
        SET order_status = 'CANCELLED' 
        WHERE order_status = 'PENDING_PAYMENT' 
          AND datetime(payment_deadline) < datetime('now')
      `).run();
    } catch (_) {}

    // 2. Ràng buộc ngày tháng hợp lệ
    const sDate = new Date(start_date || Date.now());
    const eDate = new Date(expected_return_date || Date.now() + 3 * 86400000);
    const nowZero = new Date();
    nowZero.setHours(0, 0, 0, 0);

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      return res.status(400).json({ error: 'Định dạng ngày thuê không hợp lệ.' });
    }
    if (sDate < nowZero) {
      return res.status(400).json({ error: 'Ngày bắt đầu thuê không thể trong quá khứ.' });
    }
    if (eDate <= sDate) {
      return res.status(400).json({ error: 'Ngày trả máy phải sau ngày nhận máy ít nhất 1 ngày.' });
    }
    const rentalDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24));
    if (rentalDays > 30) {
      return res.status(400).json({ error: 'Thời gian thuê tối đa cho mỗi đơn hàng là 30 ngày.' });
    }

    // 3. Chuẩn hóa danh sách thiết bị cần kiểm tra tồn kho (đơn lẻ hoặc giỏ hàng)
    let itemsToValidate: Array<{ model_id: string | number; model_name: string; quantity: number }> = [];
    if (Array.isArray(req.body.items) && req.body.items.length > 0) {
      itemsToValidate = req.body.items.map((it: any) => ({
        model_id: it.model_id || it.modelId,
        model_name: it.model_name || it.modelName || 'Thiết bị Fujifilm',
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));
    } else {
      itemsToValidate = [
        {
          model_id: model_id || '1',
          model_name: model_name || 'Thiết bị Fujifilm',
          quantity: Math.max(1, Number(req.body.quantity) || 1),
        },
      ];
    }

    // 4. RÀNG BUỘC ĐẶT ĐƠN & SO SÁNH GIỚI HẠN TỒN KHO THỰC TẾ
    const allAssignedSerials: string[] = [];
    const validatedItemsDetail: any[] = [];

    for (const it of itemsToValidate) {
      const numModelId = parseModelId(it.model_id);
      
      // Tìm mẫu thiết bị trong bảng product_models
      let model = null;
      if (numModelId) {
        model = db.prepare('SELECT id, model_name, category, is_active FROM product_models WHERE id = ?').get(numModelId) as any;
      }
      if (!model && it.model_name) {
        model = db.prepare('SELECT id, model_name, category, is_active FROM product_models WHERE model_name LIKE ?').get(`%${it.model_name}%`) as any;
      }

      if (!model) {
        return res.status(400).json({
          error: `Mẫu thiết bị "${it.model_name}" không tồn tại trong kho dữ liệu hệ thống.`,
        });
      }

      if (!model.is_active) {
        return res.status(400).json({
          error: `Thiết bị "${model.model_name}" hiện đang tạm ngừng kinh doanh dịch vụ cho thuê.`,
        });
      }

      // Lấy toàn bộ cá thể Serial Number trong kho của mẫu này
      const physicalItems = db.prepare(`
        SELECT id, serial_number, status, condition_percent 
        FROM product_items 
        WHERE model_id = ?
      `).all(model.id) as any[];

      const availableItems = physicalItems.filter((p) => p.status === 'AVAILABLE');

      if (availableItems.length === 0) {
        return res.status(400).json({
          error: `Ràng buộc kho: Thiết bị "${model.model_name}" hiện đã hết hàng trong kho (${physicalItems.length} máy đang cho thuê hoặc bảo dưỡng).`,
        });
      }

      // Kiểm tra các đơn giữ chỗ chưa hết hạn hoặc đơn đã xác nhận đang giữ cá thể của mẫu này
      const activeOrders = db.prepare(`
        SELECT id, order_code, assigned_serials, quantity 
        FROM rental_orders 
        WHERE (
          model_id = ? 
          OR model_id = ? 
          OR items_detail LIKE ?
        )
        AND (
          order_status IN ('CONFIRMED', 'DELIVERED')
          OR (order_status = 'PENDING_PAYMENT' AND datetime(payment_deadline) > datetime('now'))
        )
      `).all(
        String(model.id),
        `fuji-${model.category.toLowerCase() === 'body' ? 'cam' : model.category.toLowerCase() === 'lens' ? 'lens' : 'acc'}-${model.id}`,
        `%"model_id":${model.id}%`
      ) as any[];

      const lockedSerials = new Set<string>();
      for (const ord of activeOrders) {
        if (ord.assigned_serials) {
          ord.assigned_serials
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
            .forEach((s: string) => lockedSerials.add(s));
        }
      }

      // Serial còn trống trong kho thực tế (chưa bị khóa bởi đơn khác và chưa gán trong cùng lượt đặt này)
      const freeUnits = availableItems.filter(
        (u) => !lockedSerials.has(u.serial_number) && !allAssignedSerials.includes(u.serial_number)
      );

      const availableCount = freeUnits.length;

      if (availableCount <= 0) {
        return res.status(400).json({
          error: `Ràng buộc kho: Toàn bộ ${availableItems.length} thiết bị "${model.model_name}" trong kho hiện đang được khách hàng khác thuê hoặc giữ chỗ 15 phút. Vui lòng chọn thiết bị khác!`,
        });
      }

      if (it.quantity > availableCount) {
        return res.status(400).json({
          error: `Ràng buộc tồn kho: Bạn yêu cầu ${it.quantity} thiết bị "${model.model_name}", nhưng trong kho hiện chỉ còn ${availableCount} thiết bị khả dụng.`,
        });
      }

      // Gán đúng số Serial Number thực tế cho đơn hàng
      const assigned = freeUnits.slice(0, it.quantity).map((u) => u.serial_number);
      allAssignedSerials.push(...assigned);

      validatedItemsDetail.push({
        model_id: model.id,
        model_name: model.model_name,
        quantity: it.quantity,
        assigned_serials: assigned,
      });
    }

    // 5. Khởi tạo đơn giữ chỗ 15 phút
    const holdMinutes = 15;
    const paymentDeadline = new Date(Date.now() + holdMinutes * 60 * 1000);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const totalQuantity = itemsToValidate.reduce((acc, it) => acc + it.quantity, 0);

    try {
      db.prepare(`
        INSERT INTO rental_orders (
          order_code, user_id, model_id, model_name, start_date,
          expected_return_date, total_rent, deposit_amount, order_status, 
          payment_deadline, created_at, assigned_serials, quantity, items_detail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT', ?, ?, ?, ?, ?)
      `).run(
        orderId,
        user_id || 1,
        String(itemsToValidate[0]?.model_id || '1'),
        itemsToValidate.length === 1 ? itemsToValidate[0].model_name : `Giỏ hàng (${totalQuantity} thiết bị)`,
        start_date || '2026-11-05',
        expected_return_date || '2026-11-08',
        Number(total_rent) || 0,
        Number(deposit_amount) || 0,
        paymentDeadline.toISOString(),
        now,
        allAssignedSerials.join(', '),
        totalQuantity,
        JSON.stringify(validatedItemsDetail)
      );
    } catch (dbErr) {
      console.warn('Lỗi lưu đơn vào DB:', dbErr);
    }

    // Tự động kiểm tra ràng buộc & nâng hạng thành viên nếu đủ điều kiện đơn thuê
    if (user_id) {
      syncAndEvaluateUserTier(Number(user_id));
    }

    console.log(`📦 [Orders] Đã tạo đơn giữ chỗ 15 phút: ${orderId} cho User ${user_id}. Serials gán: ${allAssignedSerials.join(', ')}`);

    res.status(201).json({
      success: true,
      orderId,
      status: 'PENDING_PAYMENT',
      payment_deadline: paymentDeadline.toISOString(),
      holdDeadline: paymentDeadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      assignedSerials: allAssignedSerials,
      message: `Đã khóa giữ chỗ 15 phút thành công. Đã gán Serial đối chứng kho: ${allAssignedSerials.join(', ')}`,
    });
  } catch (err: any) {
    console.error('❌ Error creating rental order:', err);
    res.status(500).json({ error: err.message || 'Không thể tạo đơn đặt thuê' });
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

// GET /:orderCode - Lấy chi tiết đơn thuê theo mã đơn
ordersRouter.get('/:orderCode', (req: Request, res: Response) => {
  try {
    const { orderCode } = req.params;
    const order = db.prepare('SELECT * FROM rental_orders WHERE order_code = ?').get(orderCode);
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn thuê' });
    }
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy chi tiết đơn' });
  }
});

// POST /:orderCode/pay - Thanh toán cọc & chuyển trạng thái sang CONFIRMED
ordersRouter.post('/:orderCode/pay', (req: Request, res: Response) => {
  try {
    const { orderCode } = req.params;
    const { payment_method } = req.body;

    const order = db.prepare('SELECT * FROM rental_orders WHERE order_code = ?').get(orderCode) as any;
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra thời hạn 15 phút nếu đơn còn ở PENDING_PAYMENT
    if (order.order_status === 'PENDING_PAYMENT' && order.payment_deadline) {
      const deadline = new Date(order.payment_deadline);
      if (deadline < new Date()) {
        db.prepare("UPDATE rental_orders SET order_status = 'CANCELLED' WHERE order_code = ?").run(orderCode);
        return res.status(400).json({
          error: 'Thời hạn giữ chỗ 15 phút cho đơn hàng này đã hết hạn. Thiết bị đã được trả về kho.',
        });
      }
    }

    db.prepare(`
      UPDATE rental_orders 
      SET order_status = 'CONFIRMED'
      WHERE order_code = ?
    `).run(orderCode);

    // Đồng bộ lại hạng nếu hoàn thành đơn thuê
    if (order.user_id) {
      syncAndEvaluateUserTier(order.user_id);
    }

    console.log(`💳 [Payment] Đã ghi nhận thanh toán thành công cho đơn ${orderCode} qua ${payment_method || 'VIETQR'}`);

    return res.json({
      success: true,
      message: `Thanh toán thành công! Đơn hàng ${orderCode} đã được chuyển sang trạng thái ĐÃ XÁC NHẬN (CONFIRMED).`,
      orderStatus: 'CONFIRMED',
    });
  } catch (err) {
    console.error('Lỗi xử lý thanh toán:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xử lý thanh toán' });
  }
});
