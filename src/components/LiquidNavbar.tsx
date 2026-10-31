import React from 'react';
import { NavigationScrubber, NavScrubberItem } from './NavigationScrubber';
import { GlassSearchBar, SearchFilterParams } from './GlassSearchBar';
import { Home, Camera, Aperture, Calendar, ShieldCheck, ShoppingBag, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiquidNavbarProps {
  isVisible: boolean;
  activeSection: string;
  onOpenAuth?: () => void;
  onOpenCart: () => void;
  cartCount?: number;
  onNavigate: (sectionId: string) => void;
  // Props cho chế độ Search Bar thay thế Navbar (Image 3 thay thế Image 2)
  isSearchMode?: boolean;
  onCloseSearchMode?: () => void;
  searchFilterParams?: SearchFilterParams;
  onSearchChange?: (params: SearchFilterParams) => void;
  onOpenCalendar?: () => void;
  isPhotoViewOnly?: boolean;
}

export const LiquidNavbar: React.FC<LiquidNavbarProps> = ({
  isVisible,
  activeSection,
  onOpenAuth,
  onOpenCart,
  cartCount = 0,
  onNavigate,
  isSearchMode = false,
  onCloseSearchMode,
  searchFilterParams,
  onSearchChange,
  onOpenCalendar,
  isPhotoViewOnly = false,
}) => {
  const navItems: NavScrubberItem[] = [
    { id: 'hero', label: 'Trang chủ', shortLabel: 'Home', icon: <Home size={16} /> },
    { id: 'explore', label: 'Tra cứu lịch', shortLabel: 'Lịch', icon: <Calendar size={16} /> },
    { id: 'cameras', label: 'Máy ảnh Hot', shortLabel: 'Máy ảnh', icon: <Camera size={16} /> },
    { id: 'lenses', label: 'Ống kính', shortLabel: 'Lens', icon: <Aperture size={16} /> },
    { id: 'policies', label: 'Chính sách cọc', shortLabel: 'Cọc', icon: <ShieldCheck size={16} /> },
  ];

  const showNavbar = true; // Luôn hiển thị thanh điều hướng trên toàn bộ các trang để chuyển tab tức thì

  return (
    <>
      {/* 1. DESKTOP / TABLET HEADER (Cao 84px, chuẩn phong cách RytoxGroup & iOS/macOS) */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex h-[84px] items-center justify-between px-6 sm:px-10 lg:px-14 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showNavbar && !isPhotoViewOnly ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Chỉ hiện thanh taskbar ở chính giữa, không có lớp nền trải dài từ Refuji tới tài khoản */}
        {/* LOGO BÊN TRÁI: Độc lập, cỡ chữ lớn sang trọng */}
        <div className="flex items-center z-10 pointer-events-auto">
          <button
            onClick={() => {
              if (isSearchMode && onCloseSearchMode) {
                onCloseSearchMode();
              }
              onNavigate('hero');
            }}
            className="font-serif text-2xl sm:text-3xl tracking-[0.16em] font-medium text-[#14171f] hover:text-[#2c3242] transition-colors drop-shadow-[0_2px_8px_rgba(20,24,32,0.08)] focus:outline-none cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            REFUJI
          </button>
        </div>

        {/* 
          THANH TASKBAR Ở CHÍNH GIỮA: 
          - Bình thường: NavigationScrubber (Thanh home ảnh 2)
          - Khi mở toàn bộ thiết bị: Thay thế mượt mà bằng GlassSearchBar (Thanh ảnh 3)
          - Sử dụng animation chuyển cảnh Apple iOS / macOS spring physics
        */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-20 items-center justify-center pointer-events-auto w-full max-w-4xl px-4">
          <AnimatePresence mode="wait">
            {!isSearchMode ? (
              <motion.div
                key="navbar-scrubber"
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                  mass: 0.8,
                }}
                className="flex items-center justify-center"
              >
                <NavigationScrubber
                  activeId={activeSection}
                  onChange={onNavigate}
                  items={navItems}
                  variant="header"
                />
              </motion.div>
            ) : (
              <motion.div
                key="navbar-search-bar"
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                  mass: 0.8,
                }}
                className="w-full flex items-center justify-center"
              >
                <GlassSearchBar
                  variant="compact-header"
                  onSearch={(params) => {
                    if (onSearchChange) onSearchChange(params);
                  }}
                  selectedDates={searchFilterParams?.dates}
                  onOpenCalendar={onOpenCalendar}
                  initialCategory={searchFilterParams?.category}
                  initialMount={searchFilterParams?.mount}
                  initialSeries={searchFilterParams?.series}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BÊN PHẢI: Nút Đóng (khi ở chế độ tìm kiếm), Nút Giỏ Hàng Thuê và Nút Tài Khoản */}
        <div className="flex items-center gap-2 sm:gap-2.5 z-10 pointer-events-auto">
          {isSearchMode && onCloseSearchMode && (
            <button
              onClick={onCloseSearchMode}
              className="bg-white hover:bg-neutral-50 rytox-hover-lift h-11 px-5 rounded-full flex items-center gap-2 font-semibold text-xs sm:text-sm text-[#14171f] hover:text-[#0a0c10] cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all"
            >
              <X size={15} />
              <span>Đóng</span>
            </button>
          )}

          {/* Nút Giỏ hàng (chỉ giữ lại logo, bỏ văn bản theo yêu cầu) */}
          <button
            onClick={onOpenCart}
            className="bg-white hover:bg-neutral-50 rytox-hover-lift w-11 h-11 rounded-full flex items-center justify-center text-[#14171f] hover:text-[#0a0c10] cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all relative group"
            aria-label="Giỏ hàng"
            title="Giỏ hàng"
          >
            <ShoppingBag size={18} className="text-[#14171f] group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#14171f] text-white text-[10px] font-mono min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-sm animate-in fade-in zoom-in duration-200">
                {cartCount}
              </span>
            )}
          </button>

          {/* Nút Tài khoản: chỉ hiện ở ngoài, ẩn đi khi vào trang toàn bộ thiết bị (#thiet-bi) */}
          {!isSearchMode && onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="bg-white hover:bg-neutral-50 rytox-hover-lift h-11 px-4 sm:px-5 rounded-full flex items-center gap-2 font-semibold text-xs sm:text-sm text-[#14171f] hover:text-[#0a0c10] cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all"
              aria-label="Tài khoản thành viên"
            >
              <User size={16} className="text-[#14171f]" />
              <span className="hidden sm:inline">Tài khoản</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MOBILE BOTTOM FLOATING DOCK (Tự ẩn khi mở Popup Tìm kiếm Toàn Bộ hoặc Xem ảnh) */}
      <div
        className={`md:hidden fixed bottom-5 inset-x-0 z-50 mx-auto w-[94%] max-w-[440px] transition-all duration-300 pointer-events-auto ${
          showNavbar && !isSearchMode && !isPhotoViewOnly
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
        style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <NavigationScrubber
          activeId={activeSection}
          onChange={onNavigate}
          items={navItems}
          variant="mobile-dock"
        />
      </div>
    </>
  );
};
