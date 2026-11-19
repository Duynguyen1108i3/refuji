import { Resend } from 'resend';
import { env } from '../../config/env.js';

export interface OrderNotificationPayload {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  modelName: string;
  startDate: string;
  expectedReturnDate: string;
  rentalDays?: number;
  totalRent: number;
  depositAmount?: number;
  totalDue?: number;
  paymentMethod?: string;
  orderStatus?: string;
  assignedSerials?: string[];
  note?: string;
}

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Gửi email xác nhận đơn hàng qua Resend cho Khách hàng & Cửa hàng.
 * Chạy hoàn toàn bất đồng bộ (fire-and-forget), không làm nghẽn phản hồi API.
 */
export async function sendOrderConfirmationEmail(payload: OrderNotificationPayload): Promise<void> {
  if (!resendClient) {
    console.log('ℹ️ [Resend] Chưa cấu hình RESEND_API_KEY trong .env. Bỏ qua gửi email.');
    return;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'ReFuji Camera Rental <onboarding@resend.dev>';
  const shopEmail = env.SHOP_NOTIFICATION_EMAIL || 'duycute11082005@gmail.com';

  const rentFormatted = Number(payload.totalRent || 0).toLocaleString('vi-VN');
  const depositFormatted = Number(payload.depositAmount || 0).toLocaleString('vi-VN');
  const totalDueFormatted = Number(payload.totalDue || (payload.totalRent + (payload.depositAmount || 0))).toLocaleString('vi-VN');

  // 1. Gửi Email xác nhận cho Khách hàng
  if (payload.customerEmail) {
    const customerSubject = `[ReFuji] Xác nhận đơn đặt thuê máy ảnh #${payload.orderCode}`;

    const customerPlainText = `Xin chào ${payload.customerName},\n\n`
      + `Cảm ơn bạn đã đặt thuê thiết bị tại ReFuji!\n`
      + `Mã đơn hàng: #${payload.orderCode}\n`
      + `Thiết bị: ${payload.modelName}\n`
      + `Thời gian thuê: từ ${payload.startDate} đến ${payload.expectedReturnDate}\n`
      + `Tổng tiền thuê: ${rentFormatted} đ\n`
      + `Tiền cọc: ${depositFormatted} đ\n`
      + `Tổng thanh toán: ${totalDueFormatted} đ\n\n`
      + `⏱ Đơn hàng được giữ chỗ trong 15 phút. Quý khách vui lòng hoàn tất thanh toán để hệ thống tự động khóa máy.\n\n`
      + `Hotline hỗ trợ: 0900.000.000\n`
      + `Địa chỉ: ReFuji Camera Rental Studio`;

    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Xác nhận đơn thuê #${payload.orderCode}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">ReFuji Camera Rental</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.85;">Dịch vụ cho thuê máy ảnh Fujifilm chính hãng</p>
          </div>

          <div style="padding: 28px 24px;">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Cảm ơn bạn đã đặt thuê tại ReFuji!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Xin chào <strong>${payload.customerName}</strong>, đơn giữ chỗ thiết bị của bạn đã được khởi tạo thành công trên hệ thống.
            </p>

            <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="background: #f8fafc;">
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Mã đơn hàng</td>
                  <td style="padding: 10px 14px; font-weight: 700; color: #2563eb; text-align: right; border-bottom: 1px solid #e2e8f0;">#${payload.orderCode}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Thiết bị thuê</td>
                  <td style="padding: 10px 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${payload.modelName}</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Thời gian nhận - trả</td>
                  <td style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #e2e8f0;">${payload.startDate} → ${payload.expectedReturnDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Tiền thuê thiết bị</td>
                  <td style="padding: 10px 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${rentFormatted} đ</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Tiền cọc bảo đảm</td>
                  <td style="padding: 10px 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #e2e8f0;">${depositFormatted} đ</td>
                </tr>
                <tr style="background: #eff6ff;">
                  <td style="padding: 12px 14px; font-weight: 700; color: #1e3a8a;">Tổng thanh toán</td>
                  <td style="padding: 12px 14px; font-weight: 700; font-size: 16px; color: #1d4ed8; text-align: right;">${totalDueFormatted} đ</td>
                </tr>
              </table>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                ⏱ <strong>Lưu ý giữ chỗ:</strong> Thiết bị được giữ chỗ tự động trong <strong>15 phút</strong>. Quý khách vui lòng hoàn tất thanh toán theo hướng dẫn trên website để hệ thống khóa máy trong kho.
              </p>
            </div>

            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
              <p style="margin: 0;"><strong>ReFuji Camera Rental Studio</strong></p>
              <p style="margin: 4px 0;">Hotline / Zalo hỗ trợ kỹ thuật: 0900.000.000</p>
              <p style="margin: 0;">Email này được gửi tự động để xác nhận đơn đặt thuê của quý khách.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const result = await resendClient.emails.send({
        from: fromEmail,
        to: payload.customerEmail,
        subject: customerSubject,
        text: customerPlainText,
        html: customerHtml,
      });
      console.log(`✅ [Resend] Đã gửi mail cho khách (${payload.customerEmail}) - ID:`, result.data?.id);
    } catch (err: any) {
      console.error(`❌ [Resend Error] Không gửi được mail cho khách:`, err?.message || err);
    }
  }

  // 2. Gửi Email thông báo đơn mới cho Shop
  if (shopEmail && shopEmail !== payload.customerEmail) {
    try {
      await resendClient.emails.send({
        from: fromEmail,
        to: shopEmail,
        subject: `[ĐƠN MỚI] Khách #${payload.orderCode} - ${payload.customerName}`,
        text: `Có đơn đặt thuê mới:\nMã: #${payload.orderCode}\nKhách: ${payload.customerName} - ${payload.customerPhone}\nThiết bị: ${payload.modelName}\nNgày: ${payload.startDate} đến ${payload.expectedReturnDate}\nTổng tiền: ${totalDueFormatted} đ`,
      });
      console.log(`✅ [Resend] Đã gửi thông báo đơn mới cho Shop (${shopEmail})`);
    } catch (err: any) {
      console.error(`❌ [Resend Error] Không gửi được thông báo cho Shop:`, err?.message || err);
    }
  }
}
