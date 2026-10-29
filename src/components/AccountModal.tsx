import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  User, 
  Award, 
  ShieldCheck, 
  Tag, 
  Sparkles, 
  Check, 
  ChevronRight,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

export type MembershipTierType = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: MembershipTierType;
  onChangeTier: (tier: MembershipTierType) => void;
  onApplyVoucher?: (code: string, discount: number) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onChangeTier,
  onApplyVoucher,
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountText: string } | null>(null);
  const [voucherError, setVoucherError] = useState('');

  if (!isOpen) return null;

  const tiers: { id: MembershipTierType; label: string; discountText: string; desc: string; color: string }[] = [
    { 
      id: 'BRONZE', 
      label: 'Hạng Đồng', 
      discountText: '0% cọc', 
      desc: 'Mức cọc tiêu chuẩn dành cho thành viên mới',
      color: 'border-white/20 text-white/80'
    },
    { 
      id: 'SILVER', 
      label: 'Hạng Bạc', 
      discountText: 'Giảm 5% cọc', 
      desc: 'Áp dụng sau 3 lần thuê máy thành công',
      color: 'border-slate-300 text-slate-200'
    },
    { 
      id: 'GOLD', 
      label: 'Hạng Vàng', 
      discountText: 'Giảm 10% cọc', 
      desc: 'Đặc quyền giữ chỗ ưu tiên + Giảm 10% tiền cọc',
      color: 'border-amber-400 text-amber-300'
    },
    { 
      id: 'PLATINUM', 
      label: 'Bạch Kim', 
      discountText: 'Giảm 15% cọc', 
      desc: 'Fast-track nhận máy tại quầy + Giảm 15% tiền cọc',
      color: 'border-cyan-400 text-cyan-200'
    },
  ];

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'FUJI10' || code === 'STU2026') {
      setAppliedVoucher({ code, discountText: 'Giảm thêm 10% tiền cọc' });
      if (onApplyVoucher) onApplyVoucher(code, 0.1);
      setVoucherCode('');
    } else if (code === 'VIPCAMERA') {
      setAppliedVoucher({ code, discountText: 'Đặc quyền VIP: Giảm 15% cọc' });
      if (onApplyVoucher) onApplyVoucher(code, 0.15);
      onChangeTier('PLATINUM');
      setVoucherCode('');
    } else {
      setVoucherError('Mã ưu đãi không hợp lệ hoặc đã hết lượt.');
    }
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
        className="relative w-full max-w-xl liquid-glass rounded-3xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/20 text-white max-h-[92vh] overflow-y-auto"
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all active:scale-90"
        >
          <X size={18} />
        </button>

        {/* Header thông tin hội viên */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/10 mb-6">
          <div className="w-14 h-14 rounded-2xl crystal-liquid-glass flex items-center justify-center text-white text-xl font-bold border border-white/20 shadow-inner">
            TX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-white">Trần Txi</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {tiers.find(t => t.id === currentTier)?.label}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5">trantxi@refuji.stu.edu.vn • ĐACN STU 2026</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1">
              <ShieldCheck size={14} />
              <span>Định danh CCCD điện tử hợp lệ (Luật Căn cước 2023)</span>
            </div>
          </div>
        </div>

        {/* KHU VỰC HẠNG THÀNH VIÊN & TỰ ĐỘNG TÍNH CỌC */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-amber-400" />
              <span>Hạng Thành Viên &amp; Quyền Lợi Cọc</span>
            </label>
            <span className="text-[11px] text-white/50 italic">Tự động tính khi kiểm tra &amp; đặt máy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tiers.map((t) => {
              const isSelected = currentTier === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onChangeTier(t.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-white/15 border-white/40 shadow-lg scale-[1.01]'
                      : 'bg-[#10141f]/70 border-white/10 hover:border-white/25 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 radar-pulse-amber" />}
                      <span>{t.label}</span>
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/90">
                      {t.discountText}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* KHU VỰC ÁP MÃ VOUCHER / KHUYẾN MÃI */}
        <div className="mb-6 bg-[#10141f]/90 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 mb-2.5">
            <Tag size={13} className="text-emerald-400" />
            <span>Mã Ưu Đãi / Voucher Giảm Cọc</span>
          </div>

          <form onSubmit={handleApplyVoucher} className="flex gap-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Nhập mã (VD: FUJI10, STU2026, VIPCAMERA)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-white/90 text-[#0B0F17] font-semibold text-xs transition-all active:scale-95 shrink-0 cursor-pointer shadow-md"
            >
              Áp dụng
            </button>
          </form>

          {voucherError && (
            <p className="text-[11px] text-rose-400 mt-2">{voucherError}</p>
          )}

          {appliedVoucher && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Mã <strong>{appliedVoucher.code}</strong>: {appliedVoucher.discountText}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedVoucher(null)}
                className="text-[10px] text-emerald-400/80 hover:text-emerald-300 underline cursor-pointer"
              >
                Hủy mã
              </button>
            </div>
          )}
        </div>

        {/* Nghiệp vụ tự động áp dụng */}
        <div className="text-[11px] text-white/60 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5 flex items-start gap-2.5">
          <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            Hệ thống <strong>REFUJI</strong> sẽ tự động tính toán mức cọc và chiết khấu ưu đãi tối ưu nhất ngay khi bạn tra cứu lịch hoặc chọn giữ máy. Bạn không cần phải chọn lại hạng mỗi lần xem thiết bị.
          </span>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-white/90 text-[#0B0F17] font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Hoàn tất &amp; Lưu hồ sơ
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
