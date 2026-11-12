import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Award,
  LogOut,
  ChevronDown,
  ExternalLink,
  Clock,
  Package,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MembershipTierType } from '../../services/authApi';

interface UserNavButtonProps {
  onOpenAccountModal?: () => void;
  onOpenOrdersTab?: () => void;
  onOpenReservationModal?: () => void;
  onOpenDashboard?: () => void;
  hasActiveReservation?: boolean;
}

export const UserNavButton: React.FC<UserNavButtonProps> = ({
  onOpenAccountModal,
  onOpenOrdersTab,
  onOpenReservationModal,
  onOpenDashboard,
  hasActiveReservation,
}) => {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper for tier badge styling
  const getTierInfo = (tier: MembershipTierType = 'BRONZE') => {
    switch (tier) {
      case 'PLATINUM':
        return {
          label: 'Bạch Kim',
          discountText: '-15% cọc',
          badgeStyle: {
            backgroundColor: 'var(--refuji-badge-platinum-bg)',
            color: 'var(--refuji-badge-platinum-text)',
            border: '1px solid var(--refuji-badge-platinum-border)',
          },
        };
      case 'GOLD':
        return {
          label: 'Hạng Vàng',
          discountText: '-10% cọc',
          badgeStyle: {
            backgroundColor: 'var(--refuji-badge-gold-bg)',
            color: 'var(--refuji-badge-gold-text)',
            border: '1px solid var(--refuji-badge-gold-border)',
          },
        };
      case 'SILVER':
        return {
          label: 'Hạng Bạc',
          discountText: '-5% cọc',
          badgeStyle: {
            backgroundColor: 'var(--refuji-badge-silver-bg)',
            color: 'var(--refuji-badge-silver-text)',
            border: '1px solid var(--refuji-badge-silver-border)',
          },
        };
      case 'BRONZE':
      default:
        return {
          label: 'Hạng Đồng',
          discountText: '0% cọc',
          badgeStyle: {
            backgroundColor: 'var(--refuji-badge-bronze-bg)',
            color: 'var(--refuji-badge-bronze-text)',
            border: '1px solid var(--refuji-badge-bronze-border)',
          },
        };
    }
  };

  // Tính năng: Thu gọn nhãn nút tài khoản ở tablet/laptop hẹp để thanh trang chủ luôn cân chính giữa tuyệt đối
  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={() => openAuthModal('login')}
        className="bg-white hover:bg-neutral-50 refuji-hover-lift h-11 w-auto px-4 md:w-11 md:px-0 lg:w-auto lg:px-4 xl:px-5 rounded-full flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm text-[#14171f] hover:text-[#0a0c10] cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all whitespace-nowrap shrink-0"
        aria-label="Đăng nhập hoặc Đăng ký"
        title="Đăng nhập / Đăng ký"
      >
        <User size={16} className="text-[#14171f] shrink-0" />
        <span className="inline md:hidden lg:inline">
          Đăng nhập<span className="hidden sm:inline md:hidden xl:inline"> / Đăng ký</span>
        </span>
      </button>
    );
  }

  const tierInfo = getTierInfo(user.membership_tier);
  const initials = user.full_name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-white hover:bg-neutral-50 refuji-hover-lift h-11 px-2.5 lg:pl-2.5 lg:pr-3.5 rounded-full flex items-center gap-2 lg:gap-2.5 font-medium text-xs sm:text-sm text-[#14171f] cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all shrink-0"
        aria-label="Thông tin tài khoản thành viên"
      >
        {/* Avatar Circle with Initials */}
        <div className="relative w-7 h-7 aspect-square rounded-full bg-[#14171f] text-white flex items-center justify-center font-bold text-[11px] shadow-sm shrink-0">
          {initials || 'U'}
          {hasActiveReservation && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 radar-pulse-white ring-2 ring-white" />
          )}
        </div>

        {/* User Name */}
        <span className="hidden lg:inline font-semibold text-xs text-[#14171f] max-w-[100px] xl:max-w-[160px] truncate">
          {user.full_name}
        </span>

        <ChevronDown
          size={14}
          className={`hidden lg:block text-[#14171f]/60 transition-transform duration-200 shrink-0 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Tính năng: Đồng bộ font chữ dự án & bo tròn menu/button chuẩn pill */}
      {/* Dropdown Menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-[0_20px_50px_rgba(20,24,32,0.14)] border border-[#14171f]/10 p-3 z-50 overflow-hidden"
          >
            {/* User Profile Card */}
            <div className="p-3 bg-neutral-50 rounded-2xl mb-2 border border-neutral-100">
              <div className="mb-1">
                <p className="font-semibold text-xs text-[#14171f] truncate">
                  {user.full_name}
                </p>
                <p className="text-[11px] text-neutral-500 font-sans num truncate mt-0.5">
                  {user.email}
                </p>
              </div>

              {/* Hạng thành viên (Đã di chuyển xuống thay thế Điểm uy tín) */}
              <div className="mt-2.5 pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
                <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                  <Award size={13} className="text-[#14171f]/70" />
                  <span>Hạng thành viên:</span>
                </span>
                <span
                  className="text-[10px] font-sans num font-bold px-2.5 py-0.5 rounded-full"
                  style={tierInfo.badgeStyle}
                >
                  {tierInfo.label} ({tierInfo.discountText})
                </span>
              </div>
            </div>

            {/* Mục xem đơn chờ thanh toán nếu có đơn giữ chỗ */}
            {hasActiveReservation && (
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onOpenReservationModal) onOpenReservationModal();
                }}
                className="w-full mb-2 px-3.5 py-2.5 rounded-full bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-amber-950 flex items-center justify-between text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-700 animate-pulse" />
                  <span>Đơn chờ thanh toán (15p)</span>
                </span>
                <span className="text-[10px] font-bold bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-full font-sans">
                  Mở xem
                </span>
              </button>
            )}

            {/* Tính năng: Lối tắt mở thẳng Dashboard "Đơn thuê & Tra cứu đơn" cùng chuẩn bo tròn pill */}
            {/* Menu Items */}
            <div className="space-y-1 text-xs">
              {onOpenDashboard && (user.role === 'ADMIN' || user.role === 'STAFF') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenDashboard();
                  }}
                  className="w-full px-3.5 py-2 text-left rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white flex items-center justify-between font-semibold transition-colors cursor-pointer mb-1.5 shadow-xs"
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard size={15} />
                    <span>Bảng điều khiển Studio</span>
                  </span>
                  <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-white/15 tracking-wider uppercase">
                    POS
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onOpenOrdersTab) onOpenOrdersTab();
                  else if (onOpenAccountModal) onOpenAccountModal();
                }}
                className="w-full px-3.5 py-2 text-left rounded-full hover:bg-neutral-100/80 flex items-center justify-between font-medium text-[#14171f] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Package size={15} className="text-[#14171f]/70" />
                  <span>Đơn thuê &amp; Tra cứu đơn</span>
                </span>
                <ExternalLink size={13} className="text-neutral-400" />
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onOpenAccountModal) onOpenAccountModal();
                }}
                className="w-full px-3.5 py-2 text-left rounded-full hover:bg-neutral-100/80 flex items-center justify-between font-medium text-[#14171f] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Award size={15} className="text-[#14171f]/70" />
                  <span>Quyền lợi Hạng thành viên</span>
                </span>
                <ExternalLink size={13} className="text-neutral-400" />
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  logout();
                }}
                className="w-full px-3.5 py-2 text-left rounded-full hover:bg-rose-50 flex items-center gap-2 font-medium text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
