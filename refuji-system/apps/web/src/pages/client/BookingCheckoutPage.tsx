import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CreditCard, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';
import { PRODUCT_FIXTURES } from '../../services/catalog-fixtures.ts';
import { formatVND, calcDeposit, MembershipTier } from '@refuji/shared';

interface BookingCheckoutPageProps {
  userTier?: MembershipTier | null;
}

export const BookingCheckoutPage: React.FC<BookingCheckoutPageProps> = ({ userTier = 'GOLD' }) => {
  // 15-minute reservation timer (900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);
  const [cartItems, setCartItems] = useState([
    { model: PRODUCT_FIXTURES[0], days: 2, quantity: 1 },
    { model: PRODUCT_FIXTURES[4], days: 2, quantity: 1 }
  ]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const totalRent = cartItems.reduce((acc, it) => acc + it.model.baseRentalPricePerDay * it.days * it.quantity, 0);
  const totalDeposit = cartItems.reduce((acc, it) => acc + calcDeposit(it.model.depositAmount, userTier) * it.quantity, 0);
  const grandTotal = totalRent + totalDeposit;

  const removeItem = (idx: number) => {
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <a href="/catalog" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Tiếp tục chọn thêm thiết bị</span>
      </a>

      {/* 15-Minute Hold Banner */}
      <div className="liquid-glass rounded-2xl p-4 mb-8 border border-amber-500/30 flex items-center justify-between bg-amber-500/10">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-white">Đang giữ chỗ thiết bị cho bạn</p>
            <p className="text-xs text-zinc-300">Hoàn tất đặt cọc trước khi hết giờ để tránh thiết bị được chuyển cho khách khác</p>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-amber-400 font-mono font-bold text-lg num">
          {minutes}:{seconds}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Item Rows */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white mb-2">Danh sách thiết bị thuê ({cartItems.length})</h2>
          {cartItems.map((item, idx) => (
            <div key={idx} className="liquid-glass rounded-2xl p-4 border border-white/15 flex items-center justify-between gap-4">
              <img src={item.model.imageUrl} alt={item.model.modelName} className="w-16 h-14 object-contain bg-zinc-900 rounded-lg p-1" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">{item.model.modelName}</h3>
                <p className="text-xs text-zinc-400 num">Thuê {item.days} ngày • Đơn giá: {formatVND(item.model.baseRentalPricePerDay)}/ngày</p>
                <p className="text-xs text-emerald-400 num">Cọc bảo đảm: {formatVND(calcDeposit(item.model.depositAmount, userTier))}</p>
              </div>
              <button onClick={() => removeItem(idx)} className="p-2 text-zinc-400 hover:text-rose-400" aria-label="Xóa dòng">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary & Payment */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="liquid-glass rounded-2xl p-6 border border-white/15">
            <h2 className="text-base font-bold text-white mb-4">Chi tiết thanh toán</h2>
            <div className="flex flex-col gap-2.5 text-xs pb-4 border-b border-white/10">
              <div className="flex justify-between">
                <span className="text-zinc-400">Tiền thuê ({cartItems.length} thiết bị):</span>
                <span className="font-semibold text-white num">{formatVND(totalRent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tổng tiền cọc (Ưu đãi Hạng Vàng -10%):</span>
                <span className="font-semibold text-white num">{formatVND(totalDeposit)}</span>
              </div>
            </div>

            <div className="py-4 flex justify-between items-center text-sm font-bold text-white">
              <span>Tổng thanh toán cọc & tiền thuê:</span>
              <span className="text-lg text-emerald-400 num">{formatVND(grandTotal)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg shadow-emerald-950/50"
              onClick={() => {
                window.location.href = '/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=RFJ2026103001';
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              <span>Thanh toán bảo đảm qua VNPAY</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
