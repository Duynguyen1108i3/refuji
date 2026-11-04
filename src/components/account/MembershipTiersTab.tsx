import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Lock, CheckCircle2, ShieldCheck, Tag, Sparkles, Info } from 'lucide-react';
import { MembershipTierType, TierItem } from './types';
import { useAuth } from '../../context/AuthContext';
import { getAccessTokenInMemory } from '../../services/authApi';

interface MembershipTiersTabProps {
  tiers: TierItem[];
  effectiveTier: MembershipTierType;
  completedRentals: number;
  isAdmin: boolean;
  tierNotice: string | null;
  setTierNotice: (notice: string | null) => void;
  onChangeTier?: (tier: MembershipTierType) => void;
  onApplyVoucher?: (code: string, discount: number) => void;
}

export const MembershipTiersTab: React.FC<MembershipTiersTabProps> = ({
  tiers,
  effectiveTier,
  completedRentals,
  isAdmin,
  tierNotice,
  setTierNotice,
  onChangeTier,
  onApplyVoucher,
}) => {
  const { user, refreshProfile } = useAuth();
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountText: string } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [_isUpdatingTier, setIsUpdatingTier] = useState(false);

  // Xử lý khi nhấn vào thẻ hạng
  const handleTierCardClick = async (tierId: MembershipTierType, minOrders: number) => {
    setTierNotice(null);

    // 1. Trường hợp là ADMIN: Có quyền xét duyệt và gán hạng trực tiếp
    if (isAdmin && user) {
      setIsUpdatingTier(true);
      try {
        const token = getAccessTokenInMemory();
        const res = await fetch(`/api/users/${user.id}/tier`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ tier: tierId }),
        });
        if (res.ok) {
          if (onChangeTier) onChangeTier(tierId);
          await refreshProfile();
          setTierNotice(`👑 Quản trị viên đã xét duyệt nâng hạng thành công: ${tiers.find((t) => t.id === tierId)?.label}`);
        } else {
          setTierNotice('Không thể cập nhật hạng');
        }
      } catch (_) {
        setTierNotice('Lỗi kết nối máy chủ khi cập nhật hạng');
      } finally {
        setIsUpdatingTier(false);
      }
      return;
    }

    // 2. Trường hợp là Khách hàng (CUSTOMER): Không được tự chọn hạng
    if (tierId === effectiveTier) {
      setTierNotice(
        `Bạn hiện đang sở hữu ${tiers.find((t) => t.id === tierId)?.label} với mức chiết khấu ${
          tiers.find((t) => t.id === tierId)?.discountText
        }.`
      );
      return;
    }

    if (completedRentals < minOrders) {
      const remaining = minOrders - completedRentals;
      setTierNotice(
        `🔒 Ràng buộc thăng hạng: Bạn cần hoàn thành thêm ${remaining} đơn thuê máy thành công nữa để tự động nâng lên ${
          tiers.find((t) => t.id === tierId)?.label
        }.`
      );
    } else {
      setTierNotice(`Hạng của bạn đang được hệ thống đồng bộ theo lịch sử thuê máy.`);
    }
  };

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
      setAppliedVoucher({ code, discountText: 'Ưu đãi Đặc quyền VIP: Giảm 15% cọc cho đơn thuê' });
      if (onApplyVoucher) onApplyVoucher(code, 0.15);
      setVoucherCode('');
    } else {
      setVoucherError('Mã ưu đãi không hợp lệ hoặc đã hết lượt.');
    }
  };

  return (
    <div className="space-y-5">
      {/* KHU VỰC HẠNG THÀNH VIÊN */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-[#14171f] uppercase tracking-wider flex items-center gap-1.5">
            <Award size={14} className="text-[#14171f]" />
            <span>Hạng Thành Viên &amp; Quyền Lợi Cọc</span>
          </label>
          <span className="text-[11px] text-[#6e7587] italic">Tự động tính khi kiểm tra &amp; đặt máy</span>
        </div>

        {/* Banner thông báo ràng buộc hoặc thao tác Admin */}
        {tierNotice && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl text-xs mb-3 flex items-start gap-2 border ${
              isAdmin
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-neutral-100 border-neutral-200 text-neutral-800'
            }`}
          >
            <Info size={15} className="shrink-0 mt-0.5 text-[#14171f]" />
            <div className="flex-1">{tierNotice}</div>
            <button
              onClick={() => setTierNotice(null)}
              className="text-neutral-400 hover:text-neutral-700 ml-1 text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* 4 Thẻ Hạng Thành Viên */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tiers.map((tier) => {
            const isCurrent = effectiveTier === tier.id;
            const isEligible = completedRentals >= tier.minOrders;
            const isLocked = !isAdmin && !isEligible && !isCurrent;

            return (
              <div
                key={tier.id}
                onClick={() => handleTierCardClick(tier.id, tier.minOrders)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 relative select-none ${
                  isCurrent
                    ? 'bg-neutral-50/80 border-[#14171f] shadow-sm ring-1 ring-[#14171f]/20 cursor-default'
                    : isAdmin
                    ? 'bg-white border-[#14171f]/15 hover:border-amber-500 hover:bg-amber-50/20 cursor-pointer'
                    : isLocked
                    ? 'bg-white/60 border-[#14171f]/10 opacity-70 hover:opacity-90 cursor-pointer'
                    : 'bg-white border-[#14171f]/15 hover:border-[#14171f]/40 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs sm:text-sm text-[#14171f] flex items-center gap-1.5">
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-[#14171f]" />
                    ) : (
                      <Lock size={12} className="text-neutral-400" />
                    )}
                    {tier.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCurrent ? 'bg-[#14171f] text-white' : 'bg-[#14171f]/[0.08] text-[#14171f]'
                    }`}
                  >
                    {tier.discountText}
                  </span>
                </div>

                <p className="text-[11px] text-[#6e7587] line-clamp-2 min-h-[32px] leading-relaxed">
                  {tier.desc}
                </p>

                <div className="mt-2.5 pt-2 border-t border-[#14171f]/10 flex items-center justify-between text-[10px]">
                  {isCurrent ? (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Hạng hiện tại của bạn</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500">
                      Ràng buộc: Hoàn thành {tier.minOrders} đơn
                    </span>
                  )}
                  <span className="font-mono text-neutral-400">
                    {isCurrent ? `Đã thuê: ${completedRentals} đơn` : `${completedRentals}/${tier.minOrders} đơn`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-[#6e7587] mt-2.5 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
          <span>
            Hạng thành viên do hệ thống tự động kiểm tra và thăng hạng dựa trên số đơn thuê máy thành công (3 đơn lên Hạng Bạc, 8 đơn lên Hạng Vàng, 15 đơn lên Bạch Kim). Khách hàng không thể tự ý chuyển hạng.
          </span>
        </p>
      </div>

      {/* KHU VỰC VOUCHER / MÃ ƯU ĐÃI */}
      <div className="p-4 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-[#14171f] uppercase tracking-wider flex items-center gap-1.5">
            <Tag size={13} className="text-[#14171f]" />
            <span>Mã Ưu Đãi / Voucher Giảm Cọc</span>
          </label>
          <span className="text-[11px] text-[#6e7587]">Áp dụng khi thanh toán</span>
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

        {voucherError && <p className="text-[11px] text-rose-500 mt-2">{voucherError}</p>}

        {appliedVoucher && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>
                Mã <strong>{appliedVoucher.code}</strong>: {appliedVoucher.discountText}
              </span>
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

      {/* Chú thích hệ thống */}
      <div className="text-[11px] text-[#525868] leading-relaxed bg-[#14171f]/[0.03] p-3.5 rounded-xl border border-[#14171f]/10 flex items-start gap-2.5">
        <Sparkles size={16} className="text-[#14171f] shrink-0 mt-0.5" />
        <span>
          Hệ thống <strong>REFUJI</strong> sẽ tự động tính toán mức cọc và chiết khấu ưu đãi tối ưu nhất ngay khi bạn tra cứu lịch hoặc chọn giữ máy. Bạn không cần phải chọn lại hạng mỗi lần xem thiết bị.
        </span>
      </div>
    </div>
  );
};
