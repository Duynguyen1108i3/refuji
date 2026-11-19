import { Request, Response } from 'express';
import { db } from '../../db.js';
import { verifyPayOSWebhook } from './payos.service.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { checkAndAllocateModelsForRange, RequestedModelItem } from './availability.helper.js';
import { sendOrderToGoogleAppsScript } from './order-notification.service.js';

export async function handlePayOSWebhook(req: Request, res: Response) {
  try {
    const webhookBody = req.body;

    // 1. Xác thực chữ ký Webhook từ PayOS bằng Checksum Key
    let verifiedData: any;
    try {
      verifiedData = await verifyPayOSWebhook(webhookBody);
    } catch (err: any) {
      console.warn('⚠️ [PayOS Webhook] Chữ ký không hợp lệ hoặc dữ liệu sai lệch:', err.message);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.log('🔔 [PayOS Webhook] Nhận tín hiệu thanh toán hợp lệ từ MBBank/PayOS:', verifiedData);

    const { orderCode: numericCode, amount, reference, description } = verifiedData;

    // 2. Tìm đơn hàng tương ứng trong cơ sở dữ liệu
    // - Cách A: Tìm theo mã đơn trong description (REFUJI ORD-xxxx hoặc ORDxxxx)
    // - Cách B: Tìm theo số numericCode trong order_code
    let order: any = null;
    if (description) {
      const match = description.match(/ORD-?([A-Za-z0-9]+)/i);
      if (match) {
        const fullMatch = match[0].toUpperCase();
        const codeDigits = match[1];

        // Thử tìm theo mã đầy đủ hoặc dạng có dấu gạch ngang
        order = db.prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?').get(fullMatch) as any;
        if (!order) {
          order = db.prepare('SELECT * FROM rental_orders WHERE UPPER(order_code) = ?').get(`ORD-${codeDigits.replace(/^ORD-?/i, '')}`) as any;
        }
        if (!order) {
          const allRecent = db.prepare(`
            SELECT * FROM rental_orders 
            ORDER BY id DESC LIMIT 100
          `).all() as any[];
          order = allRecent.find((o) => {
            const oDigits = o.order_code.replace(/\D/g, '');
            const targetDigits = codeDigits.replace(/\D/g, '');
            return oDigits === targetDigits && oDigits.length > 0;
          });
        }
      }
    }

    if (!order && numericCode) {
      // Tìm đơn hàng có các chữ số trùng numericCode
      const allPending = db.prepare(`
        SELECT * FROM rental_orders 
        WHERE order_status IN ('PENDING_PAYMENT', 'GUEST_INQUIRY')
        ORDER BY id DESC LIMIT 50
      `).all() as any[];

      order = allPending.find((o) => {
        const numPart = parseInt(o.order_code.replace(/\D/g, ''), 10);
        return numPart === numericCode;
      });
    }

    if (!order) {
      console.warn(`⚠️ [PayOS Webhook] Không tìm thấy đơn hàng cho orderCode=${numericCode}, desc=${description}`);
      return res.status(200).json({ message: 'Order not found, ignored' });
    }

    // 3. Chống xử lý trùng (Idempotency)
    if (order.order_status === 'CONFIRMED' && order.payment_status === 'PAID_FULL') {
      console.log(`ℹ️ [PayOS Webhook] Đơn #${order.order_code} đã thanh toán từ trước.`);
      return res.status(200).json({ message: 'Already confirmed' });
    }

    // 4. Kiểm tra số tiền
    const totalDue = (Number(order.total_rent) || 0) + (Number(order.deposit_amount) || 0);
    if (amount < totalDue) {
      console.warn(`⚠️ [PayOS Webhook] Đơn #${order.order_code} chuyển thiếu tiền: nhận ${amount}đ / cần ${totalDue}đ`);
    }

    // 5. Khóa thiết bị & Cập nhật đơn hàng thành ĐÃ XÁC NHẬN (CONFIRMED)
    let assignedSerialsList = order.assigned_serials ? order.assigned_serials.split(',').map((s: string) => s.trim()) : [];

    // Nếu là đơn vãng lai chưa khóa máy (GUEST_INQUIRY), tiến hành phân bổ kho
    if (order.order_status === 'GUEST_INQUIRY' || !order.assigned_serials) {
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

      const sParts = order.start_date.split('-').map(Number);
      const eParts = order.expected_return_date.split('-').map(Number);
      const rentalDays = Math.max(
        1,
        Math.round((Date.UTC(eParts[0], eParts[1] - 1, eParts[2]) - Date.UTC(sParts[0], sParts[1] - 1, sParts[2])) / 86400000)
      );

      const allocation = checkAndAllocateModelsForRange(
        itemsToLock,
        order.start_date,
        order.expected_return_date,
        rentalDays,
        0,
        order.order_code,
        true
      );

      if (allocation.ok) {
        assignedSerialsList = allocation.allAssignedSerials;
        db.prepare(`
          UPDATE rental_orders
          SET assigned_serials = ?, items_detail = ?
          WHERE id = ?
        `).run(
          allocation.allAssignedSerials.join(', '),
          JSON.stringify(allocation.validatedItemsDetail),
          order.id
        );
      }
    }

    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE rental_orders
      SET order_status = 'CONFIRMED',
          payment_method = 'VIETQR',
          payment_status = 'PAID_FULL',
          payment_deadline = NULL
      WHERE id = ?
    `).run(order.id);

    // 6. Ghi nhận lịch sử giao dịch vào payment_transactions
    const txnCode = reference || `TXN-PAYOS-${order.order_code}-${Date.now().toString().slice(-4)}`;
    db.prepare(`
      INSERT INTO payment_transactions (
        order_id, order_code, transaction_code, amount, payment_method,
        transaction_type, gateway_transaction_id, status, note, processed_by_name, created_at
      ) VALUES (?, ?, ?, ?, 'VIETQR', 'FULL_PAYMENT', ?, 'SUCCESS', ?, 'PayOS Webhook (MBBank)', ?)
    `).run(
      order.id,
      order.order_code,
      txnCode,
      amount,
      reference || String(numericCode),
      `Khách thanh toán VietQR MBBank thành công ${amount.toLocaleString('vi-VN')}₫ cho đơn #${order.order_code}`,
      nowIso
    );

    // 7. Ghi Audit Log
    recordAuditLog({
      userId: order.user_id ?? null,
      actorType: 'PAYMENT_WEBHOOK',
      actorLabel: 'PayOS Gateway (MBBank)',
      action: 'PAYMENT_CONFIRMED',
      entityType: 'RentalOrder',
      entityId: order.order_code,
      oldValue: { order_status: order.order_status, payment_status: order.payment_status },
      newValue: { order_status: 'CONFIRMED', payment_method: 'VIETQR', payment_status: 'PAID_FULL' },
      description: `PayOS Webhook xác nhận khách đã chuyển khoản ${amount.toLocaleString('vi-VN')}₫ cho đơn #${order.order_code}.`,
    });

    // 8. Gửi thông báo ngầm sang Google Sheet / Email
    sendOrderToGoogleAppsScript({
      orderCode: order.order_code,
      customerName: order.guest_name || 'Khách hàng',
      customerPhone: order.guest_phone || '',
      customerEmail: order.guest_email || '',
      modelName: order.model_name,
      startDate: order.start_date,
      expectedReturnDate: order.expected_return_date,
      totalRent: order.total_rent,
      depositAmount: order.deposit_amount,
      totalDue: totalDue,
      paymentMethod: 'VIETQR (MBBank)',
      orderStatus: 'CONFIRMED',
      assignedSerials: assignedSerialsList,
    });

    console.log(`🎉 [PayOS Webhook] ĐÃ XÁC NHẬN THANH TOÁN THÀNH CÔNG ĐƠN #${order.order_code}!`);

    return res.status(200).json({ success: true, message: 'Order payment confirmed' });
  } catch (error: any) {
    console.error('❌ [PayOS Webhook Error]:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
