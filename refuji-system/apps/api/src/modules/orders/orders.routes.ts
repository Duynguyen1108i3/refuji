// Tính năng: Xử lý đặt đơn Thành viên & Khách vãng lai (đặt nhanh 3 bước), giữ chỗ 15p theo khoảng ngày, tra cứu/hủy vãng lai & Admin POS
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db.js';
import { syncAndEvaluateUserTier } from '../auth/auth.routes.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { extractAuthUser } from '../../utils/auth-context.js';
import { requireStaffOrAdmin, normalizeOrderCode } from '../admin/admin.middleware.js';
import {
  checkAndAllocateModelsForRange,
  getTodayLocalStr,
  addDaysToDateStr,
  normalizeDateStr,
  releaseExpiredPendingHolds,
  RequestedModelItem,
  parseModelId,
} from './availability.helper.js';

export const ordersRouter = Router();
export const adminOrdersRouter = Router();

const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;
const RFC_5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const normalizePhone = (raw?: string | null): string =>
  String(raw || '').replace(/[\s.-]/g, '').trim();

const guestInfoSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có tối thiểu 2 ký tự')
    .max(150, 'Họ và tên không được vượt quá 150 ký tự'),
  phone: z
    .string()
    .transform((v) => normalizePhone(v))
    .refine((v) => VN_PHONE_REGEX.test(v), {
      message: 'Số điện thoại phải gồm 10 chữ số hợp lệ (bắt đầu bằng 03, 05, 07, 08, 09)',
    }),
  email: z
    .string()
    .trim()
    .refine((v) => RFC_5322_EMAIL_REGEX.test(v), {
      message: 'Địa chỉ email không đúng định dạng',
    }),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional().default(''),
  privacy_consent: z.boolean().refine((v) => v === true, {
    message: 'Vui lòng đồng ý chính sách bảo vệ dữ liệu cá nhân theo Luật BVDLCN 2025',
  }),
});

// Tính năng: Tạo đơn đặt thuê (Hỗ trợ Thành viên JWT và Khách vãng lai: Online giữ chỗ 15p hoặc Tại quầy GUEST_INQUIRY)
ordersRouter.post('/', (req: Request, res: Response) => {
  try {
    const authUser = extractAuthUser(req);
    const isGuest = !authUser;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    let validatedGuest: z.infer<typeof guestInfoSchema> | null = null;
    if (isGuest) {
      const rawGuest = req.body.guest_info || {
        full_name: req.body.guest_name,
        phone: req.body.guest_phone,
        email: req.body.guest_email,
        note: req.body.guest_note || '',
        privacy_consent: req.body.privacy_consent,
      };
      const parsed = guestInfoSchema.safeParse(rawGuest);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return res.status(400).json({
          error: firstIssue?.message || 'Thông tin khách hàng chưa hợp lệ',
          field: firstIssue?.path?.join('.'),
        });
      }
      validatedGuest = parsed.data;
    }

    const rawPaymentMethod = String(req.body.payment_method || 'VIETQR').toUpperCase();
    const resolvedPaymentMethod: 'VIETQR' | 'VNPAY' | 'COUNTER' =
      rawPaymentMethod === 'VNPAY' ? 'VNPAY' : rawPaymentMethod === 'COUNTER' ? 'COUNTER' : 'VIETQR';

    const bookingMode = req.body.booking_mode ? String(req.body.booking_mode).toUpperCase() : '';
    const isCounterInquiry =
      isGuest && (bookingMode === 'COUNTER_INQUIRY' || resolvedPaymentMethod === 'COUNTER');

    const startDateStr = normalizeDateStr(req.body.start_date) || getTodayLocalStr();
    const endDateStr = normalizeDateStr(req.body.expected_return_date) || addDaysToDateStr(startDateStr, 3);
    const todayStr = getTodayLocalStr();

    if (!startDateStr || !endDateStr) {
      return res.status(400).json({ error: 'Định dạng ngày thuê không hợp lệ.' });
    }
    if (startDateStr < todayStr) {
      return res.status(400).json({ error: 'Ngày bắt đầu thuê không thể trong quá khứ.' });
    }
    if (endDateStr <= startDateStr) {
      return res.status(400).json({ error: 'Ngày trả máy phải sau ngày nhận máy ít nhất 1 ngày.' });
    }

    const sParts = startDateStr.split('-').map(Number);
    const eParts = endDateStr.split('-').map(Number);
    const rentalDays = Math.round(
      (Date.UTC(eParts[0], eParts[1] - 1, eParts[2]) - Date.UTC(sParts[0], sParts[1] - 1, sParts[2])) /
        86400000
    );
    if (rentalDays < 1 || rentalDays > 30) {
      return res.status(400).json({ error: 'Thời gian thuê hợp lệ từ 1 đến 30 ngày cho mỗi đơn hàng.' });
    }

    let itemsToValidate: RequestedModelItem[] = [];
    if (Array.isArray(req.body.items) && req.body.items.length > 0) {
      itemsToValidate = req.body.items.map((it: any) => ({
        model_id: it.model_id || it.modelId,
        model_name: it.model_name || it.modelName || 'Thiết bị Fujifilm',
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));
    } else {
      itemsToValidate = [
        {
          model_id: req.body.model_id || '1',
          model_name: req.body.model_name || 'Thiết bị Fujifilm',
          quantity: Math.max(1, Number(req.body.quantity) || 1),
        },
      ];
    }

    let discountRate = 0;
    if (!isGuest && authUser) {
      const tierRow = db
        .prepare('SELECT discount_percent FROM membership_tiers WHERE tier_code = ?')
        .get(authUser.membershipTier) as { discount_percent: number } | undefined;
      discountRate = tierRow ? Number(tierRow.discount_percent) / 100 : 0;
    }

    const executeBooking = db.transaction(() => {
      releaseExpiredPendingHolds();

      if (isGuest && validatedGuest) {
        if (!isCounterInquiry) {
          const activeHoldCount = db
            .prepare(`
              SELECT COUNT(*) as cnt FROM rental_orders
              WHERE is_guest = 1
                AND order_status = 'PENDING_PAYMENT'
                AND payment_deadline IS NOT NULL
                AND datetime(payment_deadline) >= datetime('now')
                AND (guest_phone = ? OR ip_address = ?)
            `)
            .get(validatedGuest.phone, clientIp) as { cnt: number };

          if (activeHoldCount.cnt >= 2) {
            return {
              ok: false as const,
              status: 429,
              error:
                'Số điện thoại hoặc thiết bị của bạn đang có 2 đơn giữ chỗ chưa thanh toán. Vui lòng hoàn tất thanh toán hoặc tự hủy đơn cũ trước khi giữ thêm máy.',
            };
          }
        } else {
          const activeInquiryCount = db
            .prepare(`
              SELECT COUNT(*) as cnt FROM rental_orders
              WHERE is_guest = 1
                AND order_status = 'GUEST_INQUIRY'
                AND (guest_phone = ? OR ip_address = ?)
            `)
            .get(validatedGuest.phone, clientIp) as { cnt: number };

          if (activeInquiryCount.cnt >= 3) {
            return {
              ok: false as const,
              status: 429,
              error:
                'Bạn đang có nhiều yêu cầu đặt tại quầy chờ xử lý. Vui lòng chờ nhân viên liên hệ hoặc tra cứu hủy bớt yêu cầu cũ.',
            };
          }
        }
      }

      const allocation = checkAndAllocateModelsForRange(
        itemsToValidate,
        startDateStr,
        endDateStr,
        rentalDays,
        discountRate,
        undefined,
        !isCounterInquiry
      );

      if (!allocation.ok) {
        return allocation;
      }

      const holdMinutes = 15;
      const paymentDeadline = isCounterInquiry
        ? null
        : new Date(Date.now() + holdMinutes * 60 * 1000);
      const orderId = `ORD-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 89)}`;
      const now = new Date().toISOString();
      const totalQuantity = itemsToValidate.reduce((acc, it) => acc + it.quantity, 0);
      const orderStatus = isCounterInquiry ? 'GUEST_INQUIRY' : 'PENDING_PAYMENT';
      const displayModelName =
        allocation.validatedItemsDetail.length === 1
          ? allocation.validatedItemsDetail[0].model_name
          : `Giỏ hàng (${totalQuantity} thiết bị)`;

      const finalRent = allocation.serverTotalRent > 0 ? allocation.serverTotalRent : Number(req.body.total_rent) || 0;
      const finalDeposit =
        allocation.serverTotalDeposit > 0 ? allocation.serverTotalDeposit : Number(req.body.deposit_amount) || 0;

      db.prepare(`
        INSERT INTO rental_orders (
          order_code, user_id, is_guest, guest_name, guest_phone, guest_email, guest_note,
          payment_method, payment_status, privacy_consent_at, ip_address, model_id, model_name,
          start_date, expected_return_date, total_rent, deposit_amount, order_status,
          payment_deadline, created_at, assigned_serials, quantity, items_detail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        authUser ? authUser.userId : null,
        isGuest ? 1 : 0,
        validatedGuest ? validatedGuest.full_name : null,
        validatedGuest ? validatedGuest.phone : null,
        validatedGuest ? validatedGuest.email : null,
        validatedGuest ? validatedGuest.note || null : null,
        resolvedPaymentMethod,
        validatedGuest ? now : null,
        clientIp,
        String(allocation.validatedItemsDetail[0]?.model_id || itemsToValidate[0]?.model_id || '1'),
        displayModelName,
        startDateStr,
        endDateStr,
        finalRent,
        finalDeposit,
        orderStatus,
        paymentDeadline ? paymentDeadline.toISOString() : null,
        now,
        isCounterInquiry ? null : allocation.allAssignedSerials.join(', '),
        totalQuantity,
        JSON.stringify(allocation.validatedItemsDetail)
      );

      recordAuditLog({
        userId: authUser ? authUser.userId : null,
        actorType: 'USER',
        actorLabel: isGuest ? `${validatedGuest?.full_name || 'Khách vãng lai'} (Guest)` : authUser?.email || 'Thành viên',
        action: 'ORDER_CREATED',
        entityType: 'RentalOrder',
        entityId: orderId,
        newValue: {
          order_status: orderStatus,
          is_guest: isGuest,
          total_rent: finalRent,
          deposit_amount: finalDeposit,
          assigned_serials: isCounterInquiry ? [] : allocation.allAssignedSerials,
        },
        description: `Tạo đơn ${isGuest ? 'Khách vãng lai' : 'Thành viên'} #${orderId} (${displayModelName}).`,
        ipAddress: clientIp,
      });

      return {
        ok: true as const,
        orderId,
        orderStatus,
        paymentDeadline,
        assignedSerials: isCounterInquiry ? [] : allocation.allAssignedSerials,
        finalRent,
        finalDeposit,
      };
    });

    const txResult = executeBooking();
    if (!txResult.ok) {
      return res.status(txResult.status).json({ error: txResult.error });
    }

    if (!isGuest && authUser) {
      syncAndEvaluateUserTier(authUser.userId);
    }

    console.log(
      `📦 [Orders] Đã tạo ${isGuest ? 'đơn Khách vãng lai' : `đơn User ${authUser?.userId}`}: ${txResult.orderId} (${txResult.orderStatus})`
    );

    return res.status(201).json({
      success: true,
      orderId: txResult.orderId,
      status: txResult.orderStatus,
      isGuest,
      paymentMethod: resolvedPaymentMethod,
      payment_deadline: txResult.paymentDeadline ? txResult.paymentDeadline.toISOString() : null,
      holdDeadline: txResult.paymentDeadline
        ? txResult.paymentDeadline.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : null,
      assignedSerials: txResult.assignedSerials,
      totalRent: txResult.finalRent,
      depositAmount: txResult.finalDeposit,
      totalDue: txResult.finalRent + txResult.finalDeposit,
      message: isCounterInquiry
        ? `Đã gửi yêu cầu đặt tại quầy #${txResult.orderId}. Nhân viên ReFuji sẽ gọi xác nhận trước khi chốt máy (chưa khóa kho).`
        : `Đã khóa giữ chỗ 15 phút thành công. Serial đối chứng kho: ${txResult.assignedSerials.join(', ')}`,
    });
  } catch (err: any) {
    console.error('❌ Error creating rental order:', err);
    return res.status(500).json({ error: err.message || 'Không thể tạo đơn đặt thuê' });
  }
});

// Tính năng: Lấy đơn thuê của Thành viên đang đăng nhập (từ chối 401 nếu chưa xác thực, bỏ fallback userId=1)
ordersRouter.get('/my-orders', (req: Request, res: Response) => {
  try {
    releaseExpiredPendingHolds();
    const authUser = extractAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để xem lịch sử đơn thuê cá nhân.' });
    }

    const orders = db
      .prepare('SELECT * FROM rental_orders WHERE user_id = ? ORDER BY id DESC')
      .all(authUser.userId);

    return res.json(orders);
  } catch (err) {
    console.error('Lỗi lấy đơn thuê:', err);
    return res.status(500).json({ error: 'Không thể lấy danh sách đơn thuê' });
  }
});

// Tính năng: Tra cứu công khai đơn Khách vãng lai bắt buộc khớp đồng thời Mã đơn + SĐT (theo Luật BVDLCN 2025)
ordersRouter.get('/guest-lookup', (req: Request, res: Response) => {
  try {
    releaseExpiredPendingHolds();
    const orderCode = normalizeOrderCode(req.query.orderCode as string);
    const phone = normalizePhone(req.query.phone as string);

    if (!orderCode || !phone) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ cả Mã đơn hàng và Số điện thoại đặt đơn.' });
    }

    const order = db
      .prepare(`
        SELECT id, order_code, is_guest, guest_name, guest_phone, guest_email, guest_note,
               payment_method, model_id, model_name, start_date, expected_return_date,
               total_rent, deposit_amount, order_status, payment_deadline, created_at,
               assigned_serials, quantity, items_detail
        FROM rental_orders
        WHERE UPPER(order_code) = ? AND guest_phone = ? AND is_guest = 1
      `)
      .get(orderCode, phone) as any;

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn vãng lai khớp với Mã đơn và Số điện thoại này.' });
    }

    return res.json(order);
  } catch (err) {
    console.error('Lỗi tra cứu đơn vãng lai:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tra cứu đơn hàng' });
  }
});

// Tính năng: Khách vãng lai tự hủy đơn đang giữ chỗ (PENDING_PAYMENT) hoặc yêu cầu tại quầy (GUEST_INQUIRY)
ordersRouter.post('/:orderCode/guest-cancel', (req: Request, res: Response) => {
  try {
    releaseExpiredPendingHolds();
    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    const phone = normalizePhone(req.body.phone || req.body.guest_phone);

    if (!orderCode || !phone) {
      return res.status(400).json({ error: 'Vui lòng cung cấp Mã đơn và Số điện thoại đặt đơn để hủy.' });
    }

    const order = db
      .prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ? AND guest_phone = ? AND is_guest = 1')
      .get(orderCode, phone) as any;

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn vãng lai khớp với thông tin đã cung cấp.' });
    }

    if (order.order_status === 'CANCELLED') {
      return res.status(400).json({ error: 'Đơn hàng này đã được hủy trước đó.' });
    }

    if (order.order_status !== 'PENDING_PAYMENT' && order.order_status !== 'GUEST_INQUIRY') {
      return res.status(400).json({
        error: 'Đơn hàng đã xác nhận hoặc đang bàn giao. Vui lòng liên hệ trực tiếp quầy ReFuji để xử lý theo chính sách hoàn cọc.',
      });
    }

    db.prepare(`
      UPDATE rental_orders
      SET order_status = 'CANCELLED',
          assigned_serials = NULL,
          cancellation_reason = 'Khách vãng lai tự hủy đơn',
          cancelled_by = 'GUEST',
          cancelled_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), order.id);

    recordAuditLog({
      actorType: 'USER',
      actorLabel: `${order.guest_name || 'Khách vãng lai'} (Guest)`,
      action: 'ORDER_CANCELLED',
      entityType: 'RentalOrder',
      entityId: order.order_code,
      oldValue: { order_status: order.order_status },
      newValue: { order_status: 'CANCELLED' },
      description: `Khách vãng lai tự hủy đơn #${order.order_code}.`,
    });

    console.log(`🛑 [Guest Cancel] Khách vãng lai đã tự hủy đơn ${order.order_code} (${phone})`);

    return res.json({
      success: true,
      orderCode: order.order_code,
      orderStatus: 'CANCELLED',
      message: `Đã hủy đơn #${order.order_code} và giải phóng thiết bị về kho.`,
    });
  } catch (err) {
    console.error('Lỗi tự hủy đơn vãng lai:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi hủy đơn' });
  }
});

// Tính năng: Thành viên đã đăng nhập (hoặc Nhân viên/Admin) tự hủy đơn đang giữ chỗ/chờ duyệt và trả Serial về kho
ordersRouter.post('/:orderCode/cancel', (req: Request, res: Response) => {
  try {
    releaseExpiredPendingHolds();
    const authUser = extractAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để hủy đơn hàng.' });
    }

    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    if (!orderCode) {
      return res.status(400).json({ error: 'Mã đơn hàng không hợp lệ.' });
    }

    const order = db
      .prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?')
      .get(orderCode) as any;

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    }

    const isAdminOrStaff = authUser.role === 'ADMIN' || authUser.role === 'STAFF';
    if (!isAdminOrStaff && order.user_id !== authUser.userId) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy đơn hàng này.' });
    }

    if (order.order_status === 'CANCELLED') {
      return res.status(400).json({ error: 'Đơn hàng này đã được hủy trước đó.' });
    }

    if (
      order.order_status !== 'PENDING_PAYMENT' &&
      order.order_status !== 'PENDING' &&
      order.order_status !== 'GUEST_INQUIRY'
    ) {
      return res.status(400).json({
        error: 'Đơn hàng đã xác nhận hoặc đang bàn giao. Vui lòng liên hệ trực tiếp quầy ReFuji để xử lý theo chính sách hoàn cọc.',
      });
    }

    db.prepare(`
      UPDATE rental_orders
      SET order_status = 'CANCELLED',
          assigned_serials = NULL,
          cancellation_reason = ?,
          cancelled_by = ?,
          cancelled_at = ?
      WHERE id = ?
    `).run(
      isAdminOrStaff ? 'Nhân viên POS hủy giữ chỗ' : 'Thành viên tự hủy giữ chỗ',
      authUser.email,
      new Date().toISOString(),
      order.id
    );

    recordAuditLog({
      userId: authUser.userId,
      actorType: 'USER',
      actorLabel: authUser.email,
      action: 'ORDER_CANCELLED',
      entityType: 'RentalOrder',
      entityId: order.order_code,
      oldValue: { order_status: order.order_status },
      newValue: { order_status: 'CANCELLED' },
      description: `Tài khoản ${authUser.email} hủy giữ chỗ đơn #${order.order_code}.`,
    });

    console.log(`🛑 [Member Cancel] Tài khoản #${authUser.userId} đã hủy đơn ${order.order_code}`);

    return res.json({
      success: true,
      orderCode: order.order_code,
      orderStatus: 'CANCELLED',
      message: `Đã hủy giữ chỗ đơn #${order.order_code} và trả thiết bị về kho.`,
    });
  } catch (err) {
    console.error('Lỗi tự hủy đơn thành viên:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi hủy đơn' });
  }
});

// Tính năng: Thanh toán giữ chỗ (Kiểm tra chủ sở hữu; khách vãng lai chọn COUNTER chuyển thành GUEST_INQUIRY không khóa Serial)
ordersRouter.post('/:orderCode/pay', (req: Request, res: Response) => {
  try {
    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    const rawMethod = String(req.body.payment_method || 'VIETQR').toUpperCase();
    const paymentMethod: 'VIETQR' | 'VNPAY' | 'COUNTER' =
      rawMethod === 'VNPAY' ? 'VNPAY' : rawMethod === 'COUNTER' ? 'COUNTER' : 'VIETQR';
    const guestPhone = normalizePhone(req.body.guest_phone || req.body.phone);
    const authUser = extractAuthUser(req);

    const order = db
      .prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?')
      .get(orderCode) as any;

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const isAdminOrStaff = authUser?.role === 'ADMIN' || authUser?.role === 'STAFF';
    if (order.is_guest === 1) {
      if (!isAdminOrStaff && (!guestPhone || guestPhone !== order.guest_phone)) {
        return res.status(403).json({
          error: 'Vui lòng cung cấp đúng số điện thoại đặt đơn vãng lai để xác nhận thanh toán.',
        });
      }
    } else if (!isAdminOrStaff && (!authUser || authUser.userId !== order.user_id)) {
      return res.status(401).json({ error: 'Bạn không có quyền thanh toán đơn hàng này.' });
    }

    if (order.order_status === 'CANCELLED') {
      return res.status(400).json({ error: 'Đơn hàng này đã bị hủy trước đó.' });
    }
    if (order.order_status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Đơn hàng này đã được xác nhận thanh toán trước đó.' });
    }

    if (order.order_status === 'PENDING_PAYMENT' && order.payment_deadline) {
      const deadline = new Date(order.payment_deadline);
      if (deadline < new Date()) {
        db.prepare("UPDATE rental_orders SET order_status = 'CANCELLED', assigned_serials = NULL WHERE id = ?").run(order.id);
        return res.status(400).json({
          error: 'Thời hạn giữ chỗ 15 phút cho đơn hàng này đã hết hạn. Thiết bị đã được trả về kho.',
        });
      }
    }

    if (order.is_guest === 1 && paymentMethod === 'COUNTER') {
      db.prepare(`
        UPDATE rental_orders
        SET order_status = 'GUEST_INQUIRY',
            payment_method = 'COUNTER',
            assigned_serials = NULL,
            payment_deadline = NULL
        WHERE id = ?
      `).run(order.id);

      console.log(`🏪 [Guest Counter] Đơn vãng lai ${order.order_code} chuyển về GUEST_INQUIRY (nhả khóa Serial)`);

      return res.json({
        success: true,
        orderStatus: 'GUEST_INQUIRY',
        message: `Đã chuyển đơn #${order.order_code} sang yêu cầu đặt tại quầy (chưa khóa máy). Nhân viên ReFuji sẽ gọi xác nhận với bạn.`,
      });
    }

    if (order.order_status === 'GUEST_INQUIRY') {
      const sDate = normalizeDateStr(order.start_date) || getTodayLocalStr();
      const eDate = normalizeDateStr(order.expected_return_date) || addDaysToDateStr(sDate, 3);
      const sParts = sDate.split('-').map(Number);
      const eParts = eDate.split('-').map(Number);
      const rentalDays = Math.max(
        1,
        Math.round((Date.UTC(eParts[0], eParts[1] - 1, eParts[2]) - Date.UTC(sParts[0], sParts[1] - 1, sParts[2])) / 86400000)
      );
      let itemsToLock: RequestedModelItem[] = [];
      try {
        const parsedDetail = JSON.parse(order.items_detail || '[]');
        if (Array.isArray(parsedDetail) && parsedDetail.length > 0) {
          itemsToLock = parsedDetail.map((it: any) => ({
            model_id: it.model_id || order.model_id,
            model_name: it.model_name || order.model_name,
            quantity: Math.max(1, Number(it.quantity) || 1),
          }));
        }
      } catch (_) {}
      if (itemsToLock.length === 0) {
        itemsToLock = [{ model_id: order.model_id, model_name: order.model_name, quantity: order.quantity || 1 }];
      }

      const allocation = checkAndAllocateModelsForRange(
        itemsToLock,
        sDate,
        eDate,
        rentalDays,
        0,
        order.order_code,
        true
      );
      if (!allocation.ok) {
        return res.status(allocation.status).json({ error: allocation.error });
      }

      const nowIso = new Date().toISOString();
      const nextPaymentStatus = paymentMethod === 'COUNTER' ? 'UNPAID' : 'PAID_FULL';
      db.prepare(`
        UPDATE rental_orders
        SET order_status = 'CONFIRMED',
            payment_method = ?,
            payment_status = ?,
            assigned_serials = ?,
            items_detail = ?
        WHERE id = ?
      `).run(
        paymentMethod,
        nextPaymentStatus,
        allocation.allAssignedSerials.join(', '),
        JSON.stringify(allocation.validatedItemsDetail),
        order.id
      );

      if (paymentMethod !== 'COUNTER') {
        const depAmt = Number(order.deposit_amount) || 0;
        const rentAmt = Number(order.total_rent) || 0;
        if (depAmt > 0) {
          db.prepare(`
            INSERT INTO payment_transactions (
              order_id, order_code, transaction_code, amount, payment_method,
              transaction_type, status, note, processed_by_name, created_at
            ) VALUES (?, ?, ?, ?, ?, 'DEPOSIT', 'SUCCESS', ?, ?, ?)
          `).run(
            order.id,
            order.order_code,
            `TXN-DEP-${order.order_code}-${Date.now().toString().slice(-4)}`,
            depAmt,
            paymentMethod,
            `Thu tiền cọc qua ${paymentMethod} cho đơn #${order.order_code}`,
            paymentMethod === 'VNPAY' ? 'VNPAY Gateway' : 'VietQR Gateway',
            nowIso
          );
        }
        if (rentAmt > 0) {
          db.prepare(`
            INSERT INTO payment_transactions (
              order_id, order_code, transaction_code, amount, payment_method,
              transaction_type, status, note, processed_by_name, created_at
            ) VALUES (?, ?, ?, ?, ?, 'RENTAL_FEE', 'SUCCESS', ?, ?, ?)
          `).run(
            order.id,
            order.order_code,
            `TXN-RNT-${order.order_code}-${Date.now().toString().slice(-4)}`,
            rentAmt,
            paymentMethod,
            `Thu tiền thuê trước qua ${paymentMethod} cho đơn #${order.order_code}`,
            paymentMethod === 'VNPAY' ? 'VNPAY Gateway' : 'VietQR Gateway',
            nowIso
          );
        }
      }

      recordAuditLog({
        userId: authUser?.userId ?? null,
        actorType: paymentMethod === 'VNPAY' ? 'PAYMENT_WEBHOOK' : 'USER',
        actorLabel: paymentMethod === 'VNPAY' ? 'VNPAY Gateway' : order.guest_name || authUser?.email || 'Khách hàng',
        action: 'PAYMENT_CONFIRMED',
        entityType: 'RentalOrder',
        entityId: order.order_code,
        oldValue: { order_status: 'GUEST_INQUIRY' },
        newValue: { order_status: 'CONFIRMED', payment_method: paymentMethod, payment_status: nextPaymentStatus },
        description: `Thanh toán & xác nhận đơn #${order.order_code} qua ${paymentMethod}.`,
      });

      return res.json({
        success: true,
        message: `Thanh toán thành công! Đơn hàng ${order.order_code} đã được chuyển sang ĐÃ XÁC NHẬN (CONFIRMED).`,
        orderStatus: 'CONFIRMED',
        assignedSerials: allocation.allAssignedSerials,
      });
    }

    const nowIso = new Date().toISOString();
    const nextPaymentStatus = paymentMethod === 'COUNTER' ? 'UNPAID' : 'PAID_FULL';
    db.prepare(`
      UPDATE rental_orders
      SET order_status = 'CONFIRMED', payment_method = ?, payment_status = ?
      WHERE id = ?
    `).run(paymentMethod, nextPaymentStatus, order.id);

    if (paymentMethod !== 'COUNTER') {
      const depAmt = Number(order.deposit_amount) || 0;
      const rentAmt = Number(order.total_rent) || 0;
      if (depAmt > 0) {
        db.prepare(`
          INSERT INTO payment_transactions (
            order_id, order_code, transaction_code, amount, payment_method,
            transaction_type, status, note, processed_by_name, created_at
          ) VALUES (?, ?, ?, ?, ?, 'DEPOSIT', 'SUCCESS', ?, ?, ?)
        `).run(
          order.id,
          order.order_code,
          `TXN-DEP-${order.order_code}-${Date.now().toString().slice(-4)}`,
          depAmt,
          paymentMethod,
          `Thu tiền cọc qua ${paymentMethod} cho đơn #${order.order_code}`,
          paymentMethod === 'VNPAY' ? 'VNPAY Gateway' : 'VietQR Gateway',
          nowIso
        );
      }
      if (rentAmt > 0) {
        db.prepare(`
          INSERT INTO payment_transactions (
            order_id, order_code, transaction_code, amount, payment_method,
            transaction_type, status, note, processed_by_name, created_at
          ) VALUES (?, ?, ?, ?, ?, 'RENTAL_FEE', 'SUCCESS', ?, ?, ?)
        `).run(
          order.id,
          order.order_code,
          `TXN-RNT-${order.order_code}-${Date.now().toString().slice(-4)}`,
          rentAmt,
          paymentMethod,
          `Thu tiền thuê trước qua ${paymentMethod} cho đơn #${order.order_code}`,
          paymentMethod === 'VNPAY' ? 'VNPAY Gateway' : 'VietQR Gateway',
          nowIso
        );
      }
    }

    recordAuditLog({
      userId: authUser?.userId ?? null,
      actorType: paymentMethod === 'VNPAY' ? 'PAYMENT_WEBHOOK' : 'USER',
      actorLabel: paymentMethod === 'VNPAY' ? 'VNPAY Gateway' : order.guest_name || authUser?.email || 'Khách hàng',
      action: 'PAYMENT_CONFIRMED',
      entityType: 'RentalOrder',
      entityId: order.order_code,
      oldValue: { order_status: order.order_status, payment_status: order.payment_status },
      newValue: { order_status: 'CONFIRMED', payment_method: paymentMethod, payment_status: nextPaymentStatus },
      description: `Thanh toán & giữ chỗ đơn #${order.order_code} qua ${paymentMethod}.`,
    });

    if (order.user_id) {
      syncAndEvaluateUserTier(order.user_id);
    }

    console.log(`💳 [Payment] Đã ghi nhận thanh toán thành công cho đơn ${order.order_code} qua ${paymentMethod}`);

    return res.json({
      success: true,
      message: `Thanh toán thành công! Đơn hàng ${order.order_code} đã được chuyển sang trạng thái ĐÃ XÁC NHẬN (CONFIRMED).`,
      orderStatus: 'CONFIRMED',
    });
  } catch (err) {
    console.error('Lỗi xử lý thanh toán:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xử lý thanh toán' });
  }
});

// Tính năng: Xem chi tiết đơn hàng có kiểm tra quyền truy cập (tránh lộ PII vãng lai theo Mã đơn)
ordersRouter.get('/:orderCode', (req: Request, res: Response) => {
  try {
    releaseExpiredPendingHolds();
    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    const phoneQuery = normalizePhone(req.query.phone as string);
    const authUser = extractAuthUser(req);

    const order = db
      .prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?')
      .get(orderCode) as any;

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn thuê' });
    }

    const isAdminOrStaff = authUser?.role === 'ADMIN' || authUser?.role === 'STAFF';
    const isOwnerMember = authUser && order.user_id && authUser.userId === order.user_id;
    const isVerifiedGuest = order.is_guest === 1 && phoneQuery && phoneQuery === order.guest_phone;

    if (!isAdminOrStaff && !isOwnerMember && !isVerifiedGuest) {
      return res.status(403).json({
        error: 'Vui lòng sử dụng tính năng Tra cứu đơn (kèm SĐT) hoặc đăng nhập đúng tài khoản đặt đơn.',
      });
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy chi tiết đơn' });
  }
});

// ==========================================
// ADMIN / STAFF POS ORDER ROUTES (/api/admin/orders)
// ==========================================
adminOrdersRouter.use(requireStaffOrAdmin);

function formatAdminOrderRow(row: any) {
  let parsedItems: any[] = [];
  try {
    parsedItems = row.items_detail ? JSON.parse(row.items_detail) : [];
  } catch (_) {}

  const isGuest = row.is_guest === 1;
  return {
    id: row.id,
    order_code: row.order_code,
    user_id: row.user_id,
    is_guest: isGuest,
    customer_name: isGuest ? row.guest_name : row.user_full_name || 'Thành viên ReFuji',
    customer_phone: isGuest ? row.guest_phone : row.user_phone || '',
    customer_email: isGuest ? row.guest_email : row.user_email || '',
    guest_note: row.guest_note || null,
    membership_tier: isGuest ? 'GUEST' : row.user_membership_tier || 'BRONZE',
    reputation_score: isGuest ? null : row.user_reputation_score ?? 100,
    id_card_last4: isGuest ? null : row.user_id_card_last4 || null,
    model_id: row.model_id,
    model_name: row.model_name,
    start_date: row.start_date,
    expected_return_date: row.expected_return_date,
    total_rent: row.total_rent,
    deposit_amount: row.deposit_amount,
    payment_method: row.payment_method || 'VIETQR',
    payment_status: row.payment_status || 'UNPAID',
    order_status: row.order_status,
    payment_deadline: row.payment_deadline,
    assigned_serials: row.assigned_serials,
    cancellation_reason: row.cancellation_reason || null,
    quantity: row.quantity || 1,
    items_detail: parsedItems,
    created_at: row.created_at,
  };
}

// Tính năng: Lấy toàn bộ đơn hàng (Thành viên + Khách vãng lai) cho hàng đợi Admin POS
adminOrdersRouter.get('/', (req: Request, res: Response) => {
  try {
    releaseExpiredPendingHolds();
    const { status, customer_type, search } = req.query;

    let sql = `
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
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && typeof status === 'string' && status !== 'ALL') {
      sql += ' AND o.order_status = ?';
      params.push(status.toUpperCase());
    }
    if (customer_type === 'guest') {
      sql += ' AND o.is_guest = 1';
    } else if (customer_type === 'member') {
      sql += ' AND o.is_guest = 0';
    }
    if (search && typeof search === 'string' && search.trim()) {
      const kw = `%${search.trim()}%`;
      sql += ' AND (o.order_code LIKE ? OR o.guest_name LIKE ? OR o.guest_phone LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)';
      params.push(kw, kw, kw, kw, kw);
    }

    sql += ' ORDER BY o.id DESC';
    const rows = db.prepare(sql).all(...params) as any[];
    return res.json(rows.map(formatAdminOrderRow));
  } catch (err) {
    console.error('❌ Lỗi lấy danh sách đơn POS:', err);
    return res.status(500).json({ error: 'Không thể tải danh sách đơn thuê POS' });
  }
});

// Tính năng: Lấy chi tiết 1 đơn hàng cho màn Check-out POS (kèm cảnh báo KYC và Serial khả dụng trong kho)
adminOrdersRouter.get('/:orderCode', (req: Request, res: Response) => {
  try {
    releaseExpiredPendingHolds();
    const orderCode = normalizeOrderCode(String(req.params.orderCode));

    const row = db
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

    if (!row) {
      return res.status(404).json({ error: `Không tìm thấy đơn hàng #${orderCode}` });
    }

    const formatted = formatAdminOrderRow(row);
    const targetModelIds =
      formatted.items_detail.length > 0
        ? formatted.items_detail.map((it: any) => parseModelId(it.model_id)).filter(Boolean)
        : [parseModelId(row.model_id)].filter(Boolean);

    const availableSerials: Array<{ model_id: number; model_name: string; serial_number: string; shutter_count: number; status: string }> = [];
    for (const mId of targetModelIds) {
      const items = db
        .prepare(`
          SELECT pi.model_id, pm.model_name, pi.serial_number, pi.shutter_count, pi.status
          FROM product_items pi
          JOIN product_models pm ON pi.model_id = pm.id
          WHERE pi.model_id = ?
        `)
        .all(mId) as any[];
      availableSerials.push(...items);
    }

    return res.json({
      ...formatted,
      warehouse_serials: availableSerials,
    });
  } catch (err) {
    console.error('❌ Lỗi lấy chi tiết đơn POS:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy chi tiết đơn POS' });
  }
});

// Tính năng: Hàm xử lý chuyển trạng thái đơn hàng từ Admin POS (Duyệt GUEST_INQUIRY sẽ kiểm tra lại kho & khóa Serial)
function handleAdminStatusUpdate(req: Request, res: Response, forcedStatus?: string) {
  try {
    const orderCode = normalizeOrderCode(String(req.params.orderCode));
    const nextStatus = String(forcedStatus || req.body.status || '').toUpperCase();
    const customSerial = req.body.assigned_serials ? String(req.body.assigned_serials).trim() : '';

    const allowedStatuses = ['CONFIRMED', 'DELIVERED', 'RETURNED', 'CANCELLED', 'OVERDUE'];
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ error: 'Trạng thái cập nhật không hợp lệ' });
    }

    const tx = db.transaction(() => {
      releaseExpiredPendingHolds();
      const order = db
        .prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?')
        .get(orderCode) as any;

      if (!order) {
        return { ok: false as const, status: 404, error: `Không tìm thấy đơn #${orderCode}` };
      }

      if (nextStatus === 'CONFIRMED') {
        const needsSerialAssignment =
          order.order_status === 'GUEST_INQUIRY' ||
          order.order_status === 'PENDING' ||
          !order.assigned_serials;

        if (needsSerialAssignment) {
          const sDate = normalizeDateStr(order.start_date) || getTodayLocalStr();
          const eDate = normalizeDateStr(order.expected_return_date) || addDaysToDateStr(sDate, 3);
          const sParts = sDate.split('-').map(Number);
          const eParts = eDate.split('-').map(Number);
          const rentalDays = Math.max(
            1,
            Math.round(
              (Date.UTC(eParts[0], eParts[1] - 1, eParts[2]) - Date.UTC(sParts[0], sParts[1] - 1, sParts[2])) / 86400000
            )
          );

          let itemsToLock: RequestedModelItem[] = [];
          try {
            const parsedDetail = JSON.parse(order.items_detail || '[]');
            if (Array.isArray(parsedDetail) && parsedDetail.length > 0) {
              itemsToLock = parsedDetail.map((it: any) => ({
                model_id: it.model_id || order.model_id,
                model_name: it.model_name || order.model_name,
                quantity: Math.max(1, Number(it.quantity) || 1),
              }));
            }
          } catch (_) {}
          if (itemsToLock.length === 0) {
            itemsToLock = [
              { model_id: order.model_id, model_name: order.model_name, quantity: order.quantity || 1 },
            ];
          }

          const allocation = checkAndAllocateModelsForRange(
            itemsToLock,
            sDate,
            eDate,
            rentalDays,
            0,
            order.order_code,
            true
          );

          if (!allocation.ok) {
            return allocation;
          }

          db.prepare(`
            UPDATE rental_orders
            SET order_status = 'CONFIRMED',
                assigned_serials = ?,
                items_detail = ?
            WHERE id = ?
          `).run(
            allocation.allAssignedSerials.join(', '),
            JSON.stringify(allocation.validatedItemsDetail),
            order.id
          );

          return {
            ok: true as const,
            orderCode: order.order_code,
            orderStatus: 'CONFIRMED',
            assignedSerials: allocation.allAssignedSerials,
            message: `Đã duyệt đơn #${order.order_code} và khóa Serial kho: ${allocation.allAssignedSerials.join(', ')}`,
          };
        }

        db.prepare("UPDATE rental_orders SET order_status = 'CONFIRMED' WHERE id = ?").run(order.id);
        return {
          ok: true as const,
          orderCode: order.order_code,
          orderStatus: 'CONFIRMED',
          assignedSerials: order.assigned_serials ? order.assigned_serials.split(',').map((s: string) => s.trim()) : [],
          message: `Đã duyệt đơn #${order.order_code} sang CONFIRMED.`,
        };
      }

      if (nextStatus === 'DELIVERED') {
        const finalSerials = customSerial || order.assigned_serials || '';
        db.prepare(`
          UPDATE rental_orders
          SET order_status = 'DELIVERED', assigned_serials = ?
          WHERE id = ?
        `).run(finalSerials || null, order.id);

        if (finalSerials) {
          const serialList = finalSerials.split(',').map((s: string) => s.trim()).filter(Boolean);
          const markRented = db.prepare("UPDATE product_items SET status = 'RENTED' WHERE serial_number = ?");
          for (const sn of serialList) {
            markRented.run(sn);
          }
        }
        return {
          ok: true as const,
          orderCode: order.order_code,
          orderStatus: 'DELIVERED',
          assignedSerials: finalSerials ? finalSerials.split(',').map((s: string) => s.trim()) : [],
          message: `Đã bàn giao đơn #${order.order_code} (DELIVERED).`,
        };
      }

      if (nextStatus === 'RETURNED') {
        db.prepare("UPDATE rental_orders SET order_status = 'RETURNED' WHERE id = ?").run(order.id);
        if (order.assigned_serials) {
          const serialList = String(order.assigned_serials).split(',').map((s) => s.trim()).filter(Boolean);
          const markAvail = db.prepare("UPDATE product_items SET status = 'AVAILABLE' WHERE serial_number = ?");
          for (const sn of serialList) {
            markAvail.run(sn);
          }
        }
        return {
          ok: true as const,
          orderCode: order.order_code,
          orderStatus: 'RETURNED',
          message: `Đã thu hồi đơn #${order.order_code} và trả thiết bị về kho.`,
        };
      }

      // Tính năng: Giải phóng toàn bộ Serial đang gán khi Admin/Staff hủy đơn
      if (nextStatus === 'CANCELLED') {
        const serialListToFree = new Set<string>();
        if (order.assigned_serials) {
          String(order.assigned_serials)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((s) => serialListToFree.add(s));
        }

        db.prepare(`
          UPDATE rental_orders
          SET order_status = 'CANCELLED',
              assigned_serials = NULL,
              cancellation_reason = ?,
              cancelled_by = ?,
              cancelled_at = ?
          WHERE id = ?
        `).run(
          String(req.body.reason || 'Admin/Staff hủy từ hàng đợi POS'),
          (req as any).actor?.email || 'admin',
          new Date().toISOString(),
          order.id
        );

        if (serialListToFree.size > 0) {
          const remainingDelivered = db
            .prepare(`
              SELECT assigned_serials
              FROM rental_orders
              WHERE id != ?
                AND order_status IN ('DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL')
                AND assigned_serials IS NOT NULL
            `)
            .all(order.id) as Array<{ assigned_serials: string | null }>;

          const stillHeldSet = new Set<string>();
          for (const rem of remainingDelivered) {
            String(rem.assigned_serials || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .forEach((s) => stillHeldSet.add(s));
          }

          const markAvailIfRented = db.prepare(
            "UPDATE product_items SET status = 'AVAILABLE' WHERE serial_number = ? AND status = 'RENTED'"
          );
          for (const sn of serialListToFree) {
            if (!stillHeldSet.has(sn)) {
              markAvailIfRented.run(sn);
            }
          }
        }
      } else {
        db.prepare(`UPDATE rental_orders SET order_status = ? WHERE id = ?`).run(nextStatus, order.id);
      }

      const actorInfo = (req as any).actor;
      recordAuditLog({
        userId: actorInfo?.userId ?? null,
        actorType: 'USER',
        actorLabel: actorInfo?.email || 'Nhân viên POS',
        action: `ADMIN_ORDER_${nextStatus}`,
        entityType: 'RentalOrder',
        entityId: order.order_code,
        oldValue: { order_status: order.order_status },
        newValue: { order_status: nextStatus },
        description: `Nhân viên POS chuyển trạng thái đơn #${order.order_code} sang ${nextStatus}.`,
      });
      return {
        ok: true as const,
        orderCode: order.order_code,
        orderStatus: nextStatus,
        message:
          nextStatus === 'CANCELLED'
            ? `Đã hủy đơn #${order.order_code} và giải phóng Serial về kho.`
            : `Đã cập nhật trạng thái đơn #${order.order_code} sang ${nextStatus}.`,
      };
    });

    const result = tx();
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('❌ Lỗi cập nhật trạng thái POS:', err);
    return res.status(500).json({ error: err.message || 'Không thể cập nhật trạng thái đơn hàng' });
  }
}

adminOrdersRouter.patch('/:orderCode/status', (req, res) => handleAdminStatusUpdate(req, res));
adminOrdersRouter.post('/:orderCode/approve', (req, res) => handleAdminStatusUpdate(req, res, 'CONFIRMED'));
adminOrdersRouter.post('/:orderCode/reject', (req, res) => handleAdminStatusUpdate(req, res, 'CANCELLED'));
