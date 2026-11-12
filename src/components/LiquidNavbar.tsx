import React from 'react';
import { NavigationScrubber, NavScrubberItem } from './NavigationScrubber';
import { GlassSearchBar, SearchFilterParams } from './GlassSearchBar';
import { Home, Camera, Aperture, Calendar, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserNavButton } from './auth/UserNavButton';

interface LiquidNavbarProps {
  activeSection: string;
  onOpenAuth?: () => void;
  onOpenOrdersTab?: () => void;
  onOpenDashboard?: () => void;
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
  onOpenReservation?: () => void;
  hasActiveReservation?: boolean;
}

export const LiquidNavbar: React.FC<LiquidNavbarProps> = ({
  activeSection,
  onOpenAuth,
  onOpenOrdersTab,
  onOpenDashboard,
  onOpenCart,
  cartCount = 0,
  onNavigate,
  isSearchMode = false,
  onCloseSearchMode,
  searchFilterParams,
  onSearchChange,
  onOpenCalendar,
  isPhotoViewOnly = false,
  onOpenReservation,
  hasActiveReservation = false,
}) => {
  const navItems: NavScrubberItem[] = [
    { id: 'hero', label: 'Trang chủ', shortLabel: 'Home', icon: <Home size={16} /> },
    { id: 'explore', label: 'Tra cứu lịch', shortLabel: 'Lịch', icon: <Calendar size={16} /> },
    { id: 'cameras', label: 'Máy ảnh Hot', shortLabel: 'Máy ảnh', icon: <Camera size={16} /> },
    { id: 'lenses', label: 'Ống kính', shortLabel: 'Lens', icon: <Aperture size={16} /> },
    { id: 'policies', label: 'Chính sách cọc', shortLabel: 'Cọc', icon: <ShieldCheck size={16} /> },
  ];

  // Tự động ẩn hoàn toàn thanh điều hướng khi ở Trang chủ (hero) để giữ trọn vẹn màn hình 100vh tối giản
  // Chỉ hiển thị khi cuộn xuống các phân hệ khác (activeSection !== 'hero') hoặc khi mở chế độ tìm kiếm thiết bị (isSearchMode)
  const showNavbar = isSearchMode || activeSection !== 'hero';

  return (
    <>
      {/* Chức năng: Dùng Grid đối xứng 1fr-auto-1fr căn giữa tuyệt đối thanh trang chủ & thanh dock mobile */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex justify-between md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] h-[84px] items-center gap-2 md:gap-3 lg:gap-4 px-4 sm:px-6 lg:px-10 xl:px-14 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showNavbar && !isPhotoViewOnly ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* LOGO BÊN TRÁI */}
        <div className="justify-self-start flex items-center z-10 shrink-0 pointer-events-auto">
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
          THANH TASKBAR Ở CHÍNH GIỮA TUYỆT ĐỐI (Cân đối 2 track minmax(0,1fr) trái-phải)
        */}
        <div className="hidden md:flex justify-self-center min-w-0 z-20 items-center justify-center pointer-events-auto">
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
                className="flex items-center justify-center max-w-full"
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
                className="w-[min(780px,calc(100vw-340px))] xl:w-[780px] flex items-center justify-center"
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
                  initialPriceRange={searchFilterParams?.priceRange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tính năng: Gỡ nút Tra cứu đơn rời khỏi navbar (chuyển vào Dashboard/Popup Tài khoản) để thanh điều hướng gọn cân đối */}
        {/* BÊN PHẢI: Nút Đóng, Giỏ Hàng & Tài Khoản */}
        <div className="justify-self-end flex items-center justify-end gap-2 shrink-0 z-10 pointer-events-auto">
          {isSearchMode && onCloseSearchMode && (
            <button
              onClick={onCloseSearchMode}
              className="bg-white hover:bg-neutral-50 refuji-hover-lift h-11 px-4 lg:px-5 rounded-full flex items-center gap-2 font-semibold text-xs sm:text-sm text-[#14171f] hover:text-[#0a0c10] whitespace-nowrap cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all"
            >
              <X size={15} />
              <span>Đóng</span>
            </button>
          )}

          {/* Nút Giỏ hàng */}
          <button
            onClick={onOpenCart}
            className="bg-white hover:bg-neutral-50 refuji-hover-lift w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-[#14171f] hover:text-[#0a0c10] cursor-pointer shadow-[0_4px_16px_rgba(20,24,32,0.06)] border border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-95 transition-all relative group"
            aria-label="Giỏ hàng"
            title="Giỏ hàng"
          >
            <ShoppingBag size={18} className="text-[#14171f] group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#14171f] text-white text-[10px] num min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold shadow-sm animate-in fade-in zoom-in duration-200">
                {cartCount}
              </span>
            )}
          </button>

          {/* Nút Tài khoản / Đăng nhập: Tự động hiển thị Tên, Avatar, Badge Hạng thành viên */}
          {!isSearchMode && (
            <UserNavButton
              onOpenAccountModal={onOpenAuth}
              onOpenOrdersTab={onOpenOrdersTab}
              onOpenReservationModal={onOpenReservation}
              onOpenDashboard={onOpenDashboard}
              hasActiveReservation={hasActiveReservation}
            />
          )}
        </div>
      </header>

      {/* 2. MOBILE BOTTOM FLOATING DOCK (Tự ẩn khi mở Popup Tìm kiếm Toàn Bộ hoặc Xem ảnh) */}
      <div
        className={`md:hidden fixed bottom-5 inset-x-0 z-50 mx-auto w-[94%] max-w-[440px] flex justify-center transition-all duration-300 pointer-events-auto ${
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
