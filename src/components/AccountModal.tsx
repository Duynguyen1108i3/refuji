import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Award, 
  ShieldCheck, 
  Tag, 
  Sparkles, 
  Check, 
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

  const tiers: { id: MembershipTierType; label: string; discountText: string; desc: string }[] = [
    { 
      id: 'BRONZE', 
      label: 'Hạng Đồng', 
      discountText: '0% cọc', 
      desc: 'Mức cọc tiêu chuẩn dành cho thành viên mới',
    },
    { 
      id: 'SILVER', 
      label: 'Hạng Bạc', 
      discountText: 'Giảm 5% cọc', 
      desc: 'Áp dụng sau 3 lần thuê máy thành công',
    },
    { 
      id: 'GOLD', 
      label: 'Hạng Vàng', 
      discountText: 'Giảm 10% cọc', 
      desc: 'Đặc quyền giữ chỗ ưu tiên + Giảm 10% tiền cọc',
    },
    { 
      id: 'PLATINUM', 
      label: 'Bạch Kim', 
      discountText: 'Giảm 15% cọc', 
      desc: 'Fast-track nhận máy tại quầy + Giảm 15% tiền cọc',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14171f]/40 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(20,24,32,0.18)] border border-[#14171f]/10 text-[#14171f] max-h-[92vh] overflow-y-auto"
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#6e7587] hover:text-[#14171f] p-2 rounded-full hover:bg-[#14171f]/[0.06] transition-all active:scale-90"
        >
          <X size={18} />
        </button>

        {/* Header thông tin hội viên */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#14171f]/10 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#14171f]/[0.06] border border-[#14171f]/12 flex items-center justify-center text-[#14171f] text-xl font-bold shadow-sm">
            TX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#14171f]">Trần Txi</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.07] text-[#14171f] border border-[#14171f]/12">
                {tiers.find(t => t.id === currentTier)?.label}
              </span>
            </div>
            <p className="text-xs text-[#6e7587] mt-0.5">trantxi@refuji.stu.edu.vn • ĐACN STU 2026</p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#484e5e] mt-1">
              <ShieldCheck size={14} className="text-[#14171f]" />
              <span>Định danh CCCD điện tử hợp lệ (Luật Căn cước 2023)</span>
            </div>
          </div>
        </div>

        {/* KHU VỰC HẠNG THÀNH VIÊN & TỰ ĐỘNG TÍNH CỌC */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-[#14171f] uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-[#14171f]" />
              <span>Hạng Thành Viên &amp; Quyền Lợi Cọc</span>
            </label>
            <span className="text-[11px] text-[#6e7587] italic">Tự động tính khi kiểm tra &amp; đặt máy</span>
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
                      ? 'bg-[#14171f]/[0.07] border-[#14171f]/35 shadow-sm scale-[1.01]'
                      : 'bg-[#f7f8fa] border-[#14171f]/10 hover:border-[#14171f]/25 hover:bg-[#14171f]/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#14171f] flex items-center gap-1.5">
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#14171f] radar-pulse-white" />}
                      <span>{t.label}</span>
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#14171f]/[0.08] text-[#14171f]">
                      {t.discountText}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6e7587] leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* KHU VỰC ÁP MÃ VOUCHER / KHUYẾN MÃI */}
        <div className="mb-6 bg-[#f7f8fa] rounded-2xl p-4 border border-[#14171f]/10">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#14171f] mb-2.5">
            <Tag size={13} className="text-[#14171f]" />
            <span>Mã Ưu Đãi / Voucher Giảm Cọc</span>
          </div>

          <form onSubmit={handleApplyVoucher} className="flex gap-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Nhập mã (VD: FUJI10, STU2026, VIPCAMERA)"
              className="flex-1 px-4 py-2.5 rounded-full bg-white border border-[#14171f]/15 text-xs text-[#14171f] placeholder-[#8e95a6] focus:outline-none focus:border-[#14171f]/40 transition-colors shadow-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white font-semibold text-xs transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm"
            >
              Áp dụng
            </button>
          </form>

          {voucherError && (
            <p className="text-[11px] text-rose-500 mt-2">{voucherError}</p>
          )}

          {appliedVoucher && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Mã <strong>{appliedVoucher.code}</strong>: {appliedVoucher.discountText}</span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedVoucher(null)}
                className="text-[10px] text-emerald-600 hover:text-emerald-800 underline cursor-pointer"
              >
                Hủy mã
              </button>
            </div>
          )}
        </div>

        {/* Nghiệp vụ tự động áp dụng */}
        <div className="text-[11px] text-[#525868] leading-relaxed bg-[#14171f]/[0.03] p-3.5 rounded-xl border border-[#14171f]/10 flex items-start gap-2.5">
          <Sparkles size={16} className="text-[#14171f] shrink-0 mt-0.5" />
          <span>
            Hệ thống <strong>REFUJI</strong> sẽ tự động tính toán mức cọc và chiết khấu ưu đãi tối ưu nhất ngay khi bạn tra cứu lịch hoặc chọn giữ máy. Bạn không cần phải chọn lại hạng mỗi lần xem thiết bị.
          </span>
        </div>

        <div className="mt-6 pt-4 border-t border-[#14171f]/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Hoàn tất &amp; Lưu hồ sơ
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
