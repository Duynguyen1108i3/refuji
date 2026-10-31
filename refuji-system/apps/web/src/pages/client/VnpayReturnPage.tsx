import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';

export const VnpayReturnPage: React.FC = () => {
  // Simulate successful VNPAY transaction response (vnp_ResponseCode = '00')
  const isSuccess = true;
  const orderCode = 'RFJ-20261030-9841';
  const amount = 6760000;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="liquid-glass rounded-3xl p-8 border border-white/20 shadow-2xl">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white mb-2">THANH TOÁN THÀNH CÔNG</h1>
            <p className="text-sm text-zinc-300 mb-6">
              Giao dịch cọc giữ máy của bạn đã được ghi nhận an toàn qua cổng VNPAY. Showroom đã tiến hành chuẩn bị thiết bị.
            </p>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-left flex flex-col gap-2 mb-8">
              <div className="flex justify-between">
                <span className="text-zinc-400">Mã đơn đặt thuê:</span>
                <span className="font-mono font-bold text-white">{orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Số tiền thanh toán:</span>
                <span className="font-bold text-emerald-400 num">6.760.000đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Cổng thanh toán:</span>
                <span className="text-white">VNPAY-QR / Thẻ ATM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Địa điểm nhận máy:</span>
                <span className="text-white">180 Cao Lỗ, Phường 4, Quận 8, TP.HCM</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => { window.location.href = `/orders/tracking/${orderCode}`; }}
              >
                <FileText className="w-4 h-4 mr-1.5" />
                <span>Theo dõi tiến độ đơn hàng</span>
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => { window.location.href = '/'; }}
              >
                <span>Về trang chủ</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white mb-2">THANH TOÁN CHƯA THÀNH CÔNG</h1>
            <p className="text-sm text-zinc-300 mb-6">Giao dịch bị hủy hoặc xảy ra lỗi trong quá trình xử lý ngân hàng.</p>
            <Button variant="primary" size="md" onClick={() => { window.location.href = '/checkout'; }}>
              Thử lại thanh toán
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
