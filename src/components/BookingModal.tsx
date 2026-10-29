import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraModel, LensModel } from '../types';
import { X, Calendar, ShieldCheck, Check, Clock } from 'lucide-react';

interface BookingModalProps {
  item: CameraModel | LensModel | null;
  onClose: () => void;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  item, 
  onClose,
  membershipTier = 'BRONZE',
}) => {
  const [days, setDays] = useState(3);
  const [isBooked, setIsBooked] = useState(false);

  if (!item) return null;

  const discountRate = membershipTier === 'PLATINUM' ? 0.15 : membershipTier === 'GOLD' ? 0.10 : membershipTier === 'SILVER' ? 0.05 : 0;
  const discountedDeposit = Math.round(item.depositRate * (1 - discountRate));
  const totalRent = item.dailyRate * days;
  const totalDue = totalRent + discountedDeposit;

  const handleConfirm = () => {
    setIsBooked(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg liquid-glass rounded-3xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/25 text-white"
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all active:scale-90"
        >
          <X size={18} />
        </button>

        {!isBooked ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-16 h-16 rounded-xl border border-white/20 bg-[#121722] p-1.5 flex items-center justify-center shrink-0">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 radar-pulse-green" />
                  <span>Còn máy sẵn sàng</span>
                </span>
                <h3 className="font-serif text-2xl font-normal leading-tight mt-0.5">{item.name}</h3>
                <p className="text-xs text-white/60">{item.dailyRate.toLocaleString('vi-VN')}₫ / ngày</p>
              </div>
            </div>

            {/* Rental Duration Options */}
            <div className="mb-5">
              <label className="text-xs text-white/70 block mb-2 font-medium flex items-center gap-1.5">
                <Calendar size={13} className="text-amber-400" />
                <span>Chọn số ngày thuê:</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      days === d
                        ? 'bg-white text-[#0B0F17] shadow-md font-bold scale-[1.02]'
                        : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 active:scale-95'
                    }`}
                  >
                    {d} ngày
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#10141f] rounded-2xl p-4 mb-5 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Tiền thuê ({days} ngày):</span>
                <span>{totalRent.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Tiền cọc (hoàn lại 100% khi trả máy):</span>
                <span>
                  {discountRate > 0 ? (
                    <>
                      <span className="line-through text-white/40 mr-1.5">{item.depositRate.toLocaleString('vi-VN')}₫</span>
                      <span className="text-amber-400 font-bold">{discountedDeposit.toLocaleString('vi-VN')}₫ (-{discountRate * 100}%)</span>
                    </>
                  ) : (
                    <span>{item.depositRate.toLocaleString('vi-VN')}₫</span>
                  )}
                </span>
              </div>
              <div className="w-full h-[1px] bg-white/10 my-2" />
              <div className="flex justify-between font-semibold text-sm text-white">
                <span>Tổng thanh toán tạm tính:</span>
                <span className="text-emerald-400">{totalDue.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {/* Compliance Note */}
            <div className="flex items-start gap-2.5 text-[11px] text-white/70 mb-6 bg-white/[0.03] p-3 rounded-xl border border-white/10">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Tuân thủ Luật Căn cước 2023:</strong> REFUJI không giữ CCCD gốc. Khách hàng chỉ đối chiếu định danh tại quầy và ký biên bản nhận máy.
              </span>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 bg-white text-[#0B0F17] hover:bg-white/90 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xl hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              Giữ chỗ tạm thời (Hold 15 phút)
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Check size={28} />
            </div>
            <h3 className="font-serif text-2xl mb-2">Đã Giữ Máy Thành Công!</h3>
            <p className="text-xs text-white/70 leading-relaxed mb-4 max-w-xs mx-auto">
              Thiết bị <strong>{item.name}</strong> đã được hệ thống giữ chỗ trong vòng 15 phút. Mã đơn thuê đã được gửi vào ứng dụng.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3.5 py-1.5 rounded-full mb-6 border border-amber-400/20">
              <Clock size={13} />
              <span>Thời hạn thanh toán cọc: 14:59 còn lại</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Đóng và tiếp tục xem
            </button>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
};
