import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShieldCheck,
  Award,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MembershipTierType } from '../../services/authApi';

interface UserNavButtonProps {
  onOpenAccountModal?: () => void;
}

export const UserNavButton: React.FC<UserNavButtonProps> = ({ onOpenAccountModal }) => {
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

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={() => openAuthModal('login')}
        className="bg-white hover:bg-neutral-50 rytox-hover-lift h-11 px-4 sm:px-5 rounded-full flex items-center gap-2 font-semibold text-xs sm:text-sm text-[#14171f] hover:text-[#0a0c10] cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all"
        aria-label="Đăng nhập hoặc Đăng ký"
      >
        <User size={16} className="text-[#14171f]" />
        <span className="hidden sm:inline">Đăng nhập / Đăng ký</span>
        <span className="sm:hidden">Đăng nhập</span>
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
        className="bg-white hover:bg-neutral-50 rytox-hover-lift h-11 pl-2.5 pr-3.5 rounded-full flex items-center gap-2.5 font-medium text-xs sm:text-sm text-[#14171f] cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all"
        aria-label="Thông tin tài khoản thành viên"
      >
        {/* Avatar Circle with Initials */}
        <div className="w-7 h-7 aspect-square rounded-full bg-[#14171f] text-white flex items-center justify-center font-bold text-[11px] shadow-sm shrink-0">
          {initials || 'U'}
        </div>

        {/* User Name */}
        <span className="font-semibold text-xs text-[#14171f] max-w-[140px] sm:max-w-[180px] truncate">
          {user.full_name}
        </span>

        <ChevronDown
          size={14}
          className={`text-[#14171f]/60 transition-transform duration-200 shrink-0 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(20,24,32,0.14)] border border-[#14171f]/10 p-3 z-50 overflow-hidden"
          >
            {/* User Profile Card */}
            <div className="p-3 bg-neutral-50 rounded-xl mb-2 border border-neutral-100">
              <div className="mb-1">
                <p className="font-semibold text-xs text-[#14171f] truncate">
                  {user.full_name}
                </p>
                <p className="text-[11px] text-neutral-500 font-mono truncate mt-0.5">
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
                  className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full"
                  style={tierInfo.badgeStyle}
                >
                  {tierInfo.label} ({tierInfo.discountText})
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1 text-xs">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onOpenAccountModal) onOpenAccountModal();
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-neutral-100/80 flex items-center justify-between font-medium text-[#14171f] transition-colors cursor-pointer"
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
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-rose-50 flex items-center gap-2 font-medium text-rose-600 transition-colors cursor-pointer"
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
