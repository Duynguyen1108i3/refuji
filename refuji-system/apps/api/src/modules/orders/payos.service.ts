import { PayOS } from '@payos/node';
import { env } from '../../config/env.js';

let payosInstance: PayOS | null = null;

export function getPayOSClient(): PayOS | null {
  if (payosInstance) return payosInstance;

  const clientId = env.PAYOS_CLIENT_ID || process.env.PAYOS_CLIENT_ID;
  const apiKey = env.PAYOS_API_KEY || process.env.PAYOS_API_KEY;
  const checksumKey = env.PAYOS_CHECKSUM_KEY || process.env.PAYOS_CHECKSUM_KEY;

  if (clientId && apiKey && checksumKey) {
    try {
      payosInstance = new PayOS({
        clientId,
        apiKey,
        checksumKey,
      });
      return payosInstance;
    } catch (err: any) {
      console.error('❌ [PayOS] Lỗi khởi tạo PayOS client:', err.message);
    }
  }
  return null;
}

export interface PaymentLinkResult {
  orderCode: number;
  qrCodeUrl: string;
  checkoutUrl?: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  amount: number;
  description: string;
}

/**
 * Sinh mã thanh toán VietQR MBBank
 * - Ưu tiên gọi qua PayOS để lấy VietQR động chính thức
 * - Tự động fallback sang Napas VietQR tiêu chuẩn nếu PayOS đang chờ kích hoạt
 */
export async function createOrderPaymentLink(
  orderCodeStr: string,
  amount: number
): Promise<PaymentLinkResult> {
  const mbAccount = env.MB_BANK_ACCOUNT || process.env.MB_BANK_ACCOUNT || '010764831289';
  const mbName = env.MB_ACCOUNT_NAME || process.env.MB_ACCOUNT_NAME || 'NGUYEN THANH DUY';
  
  // Chuẩn hóa nội dung thanh toán: LOẠI BỎ TOÀN BỘ dấu gạch ngang và ký tự đặc biệt
  // Ví dụ: ORD-50997752 -> ORD50997752 => REFUJI ORD50997752
  // Điều này đảm bảo trùng khớp 100% với cú pháp đối soát tự động của PayOS
  const cleanCode = orderCodeStr.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const description = `REFUJI ${cleanCode}`.slice(0, 25);

  // Chuyển mã đơn thành số nguyên an toàn cho PayOS (ví dụ: ORD-12345678 -> 12345678)
  const numericPart = parseInt(orderCodeStr.replace(/\D/g, ''), 10);
  const numericOrderCode = !isNaN(numericPart) && numericPart > 0 
    ? numericPart 
    : Math.floor(100000 + Math.random() * 899999);

  const payos = getPayOSClient();
  if (payos) {
    try {
      let paymentLink: any = null;
      try {
        paymentLink = await payos.paymentRequests.create({
          orderCode: numericOrderCode,
          amount: Math.round(amount),
          description: description,
          returnUrl: `${env.FRONTEND_URL}/payment/success`,
          cancelUrl: `${env.FRONTEND_URL}/payment/cancel`,
        });
        console.log(`✅ [PayOS] Đã tạo Payment Link VietQR cho đơn #${orderCodeStr}`);
      } catch (createErr: any) {
        // Nếu đơn đã tồn tại (code 231) trên PayOS, lấy lại thông tin đơn đó
        if (createErr.message?.includes('231') || createErr.error?.code === '231') {
          console.log(`ℹ️ [PayOS] Đơn #${orderCodeStr} đã tồn tại trên PayOS, truy vấn lại thông tin...`);
          paymentLink = await payos.paymentRequests.get(numericOrderCode);
        } else {
          throw createErr;
        }
      }

      if (paymentLink) {
        const targetBin = paymentLink.bin || '970422';
        const targetAccount = paymentLink.accountNumber || mbAccount;
        const targetName = paymentLink.accountName || mbName;
        const targetDesc = paymentLink.description || description;
        const targetAmount = paymentLink.amount || Math.round(amount);

        const vietQrImageUrl = `https://img.vietqr.io/image/${targetBin}-${targetAccount}-compact2.png?amount=${targetAmount}&addInfo=${encodeURIComponent(targetDesc)}&accountName=${encodeURIComponent(targetName)}`;

        return {
          orderCode: numericOrderCode,
          qrCodeUrl: vietQrImageUrl,
          checkoutUrl: paymentLink.checkoutUrl,
          accountNumber: targetAccount,
          accountName: targetName,
          bankName: 'MB Bank (Quân Đội)',
          amount: targetAmount,
          description: targetDesc,
        };
      }
    } catch (err: any) {
      console.warn(`⚠️ [PayOS] Không thể tạo qua PayOS (${err.message}). Chuyển sang VietQR Napas MBBank trực tiếp.`);
    }
  }

  // Fallback sang VietQR Napas trực tiếp vào tài khoản MBBank của bạn
  const directVietQrUrl = `https://img.vietqr.io/image/970422-${mbAccount}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(mbName)}`;

  return {
    orderCode: numericOrderCode,
    qrCodeUrl: directVietQrUrl,
    accountNumber: mbAccount,
    accountName: mbName,
    bankName: 'MB Bank (Quân Đội)',
    amount: Math.round(amount),
    description: description,
  };
}

/**
 * Xác thực dữ liệu Webhook từ PayOS bằng Checksum Key
 */
export async function verifyPayOSWebhook(webhookBody: any): Promise<any> {
  const payos = getPayOSClient();
  if (!payos) {
    throw new Error('PayOS chưa được cấu hình');
  }

  return await payos.webhooks.verify(webhookBody);
}
