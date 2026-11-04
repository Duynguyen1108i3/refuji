import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, ShieldCheck, Package, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  MembershipTierType,
  AccountModalProps,
  TierItem,
  appleTabVariants,
} from './account/types';
import { MembershipTiersTab } from './account/MembershipTiersTab';
import { RentalOrdersTab } from './account/RentalOrdersTab';
import { UserProfileTab } from './account/UserProfileTab';

export type { MembershipTierType, AccountModalProps };

const TIERS: TierItem[] = [
  {
    id: 'BRONZE',
    label: 'Hạng Đồng',
    discountText: '0% cọc',
    minOrders: 0,
    desc: 'Mức cọc tiêu chuẩn dành cho thành viên mới',
  },
  {
    id: 'SILVER',
    label: 'Hạng Bạc',
    discountText: 'Giảm 5% cọc',
    minOrders: 3,
    desc: 'Áp dụng sau 3 lần thuê máy thành công',
  },
  {
    id: 'GOLD',
    label: 'Hạng Vàng',
    discountText: 'Giảm 10% cọc',
    minOrders: 8,
    desc: 'Đặc quyền giữ chỗ ưu tiên + Giảm 10% tiền cọc',
  },
  {
    id: 'PLATINUM',
    label: 'Bạch Kim',
    discountText: 'Giảm 15% cọc',
    minOrders: 15,
    desc: 'Fast-track nhận máy tại quầy + Giảm 15% tiền cọc',
  },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onChangeTier,
  onApplyVoucher,
}) => {
  const { user } = useAuth();

  // Lưu và khôi phục tab đang chọn trong sessionStorage
  const [activeTab, setActiveTab] = useState<'tiers' | 'orders' | 'profile'>(() => {
    if (typeof window === 'undefined') return 'tiers';
    const saved = sessionStorage.getItem('refuji_account_active_tab');
    return saved === 'tiers' || saved === 'orders' || saved === 'profile' ? saved : 'tiers';
  });

  const [tabDirection, setTabDirection] = useState<number>(1);
  const [tierNotice, setTierNotice] = useState<string | null>(null);

  const tabIndexMap: Record<'tiers' | 'orders' | 'profile', number> = {
    tiers: 0,
    orders: 1,
    profile: 2,
  };

  const handleTabChange = (tab: 'tiers' | 'orders' | 'profile') => {
    if (tab === activeTab) return;
    const oldIdx = tabIndexMap[activeTab];
    const newIdx = tabIndexMap[tab];
    setTabDirection(newIdx > oldIdx ? 1 : -1);
    setActiveTab(tab);
    setTierNotice(null);
    try {
      sessionStorage.setItem('refuji_account_active_tab', tab);
    } catch (_) {}
  };

  if (!isOpen) return null;

  const isAdmin = user?.role === 'ADMIN';
  const completedRentals = user?.total_completed_rentals || 0;
  const effectiveTier: MembershipTierType = user?.membership_tier || currentTier || 'BRONZE';

  const displayName = user?.full_name || 'Trần Txi';
  const displayEmail = user?.email || 'trantxi@refuji.stu.edu.vn';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#14171f]/45 backdrop-blur-xl select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 34,
          mass: 0.8,
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_70px_rgba(20,24,32,0.18)] border border-[#14171f]/10 text-[#14171f] h-[670px] max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 text-[#6e7587] hover:text-[#14171f] w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          aria-label="Đóng"
        >
          <X size={16} />
        </button>

        {/* 1. Header thông tin hội viên */}
        <div className="p-6 sm:p-7 pb-4 border-b border-[#14171f]/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] aspect-square rounded-full bg-[#14171f] text-white flex items-center justify-center text-base sm:text-lg font-bold shadow-md shrink-0 ring-4 ring-[#14171f]/5 select-none">
              {initials || 'TX'}
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#14171f] truncate">
                  {displayName}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.07] text-[#14171f] border border-[#14171f]/12 shrink-0">
                  {TIERS.find((t) => t.id === effectiveTier)?.label}
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    👑 Quản trị viên
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6e7587] mt-0.5 font-mono truncate">
                {displayEmail} {user ? '' : '• ĐACN STU 2026'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#484e5e] mt-1">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Định danh CCCD / VNeID Mức 2 (Luật Căn cước 2023)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Thanh Tab chuyển đổi phân hệ */}
        <div className="px-6 sm:px-7 pt-4 pb-2 shrink-0">
          <div className="relative isolate select-none flex items-center justify-center bg-white border border-[#14171f]/10 shadow-[0_4px_20px_rgba(20,24,32,0.06)] rounded-full p-1.5 gap-1">
            {[
              {
                id: 'tiers' as const,
                label: 'Hạng & Ưu đãi cọc',
                icon: <Award size={14} className="shrink-0" />,
              },
              {
                id: 'orders' as const,
                label: 'Đơn thuê của tôi',
                icon: <Package size={14} className="shrink-0" />,
              },
              {
                id: 'profile' as const,
                label: 'Hồ sơ & Bảo mật',
                icon: <UserIcon size={14} className="shrink-0" />,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer flex-1 ${
                    isActive ? 'text-[#14171f] font-semibold' : 'text-[#6e7587] hover:text-[#14171f]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeAccountTabIndicator"
                      className="absolute inset-0 bg-[#14171f]/[0.08] border border-[#14171f]/15 rounded-full shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Nội dung từng phân hệ */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 sm:px-7 py-3 relative scrollbar-thin">
          <AnimatePresence mode="popLayout" custom={tabDirection} initial={false}>
            <motion.div
              key={activeTab}
              custom={tabDirection}
              variants={appleTabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full min-h-full flex flex-col justify-between"
            >
              {activeTab === 'tiers' && (
                <MembershipTiersTab
                  tiers={TIERS}
                  effectiveTier={effectiveTier}
                  completedRentals={completedRentals}
                  isAdmin={isAdmin}
                  tierNotice={tierNotice}
                  setTierNotice={setTierNotice}
                  onChangeTier={onChangeTier}
                  onApplyVoucher={onApplyVoucher}
                />
              )}

              {activeTab === 'orders' && <RentalOrdersTab isOpen={isOpen} onClose={onClose} />}

              {activeTab === 'profile' && (
                <UserProfileTab
                  displayName={displayName}
                  displayEmail={displayEmail}
                  isAdmin={isAdmin}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 4. Chân Modal */}
        <div className="px-6 sm:px-7 py-4 border-t border-[#14171f]/10 bg-white/95 backdrop-blur-md shrink-0 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 font-mono hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Tài khoản đồng bộ thời gian thực</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer ml-auto"
          >
            Hoàn tất &amp; Lưu hồ sơ
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AccountModal;
