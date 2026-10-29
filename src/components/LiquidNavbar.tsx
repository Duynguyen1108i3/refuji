import React from 'react';
import { NavigationScrubber, NavScrubberItem } from './NavigationScrubber';
import { Home, Camera, Aperture, Calendar, ShieldCheck, User } from 'lucide-react';

interface LiquidNavbarProps {
  isVisible: boolean;
  activeSection: string;
  onOpenAuth: () => void;
  onNavigate: (sectionId: string) => void;
}

export const LiquidNavbar: React.FC<LiquidNavbarProps> = ({
  isVisible,
  activeSection,
  onOpenAuth,
  onNavigate,
}) => {
  const navItems: NavScrubberItem[] = [
    { id: 'hero', label: 'Trang chủ', shortLabel: 'Home', icon: <Home size={16} /> },
    { id: 'explore', label: 'Tra cứu lịch', shortLabel: 'Lịch', icon: <Calendar size={16} /> },
    { id: 'cameras', label: 'Thân máy Hot', shortLabel: 'Body', icon: <Camera size={16} /> },
    { id: 'lenses', label: 'Ống kính', shortLabel: 'Lens', icon: <Aperture size={16} /> },
    { id: 'policies', label: 'Chính sách cọc', shortLabel: 'Cọc', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <>
      {/* 1. DESKTOP / TABLET HEADER (Cao 84px, rộng rãi, chuẩn phong cách RytoxGroup) */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex h-[84px] items-center justify-between px-8 sm:px-12 lg:px-16 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        {/* LOGO BÊN TRÁI: Độc lập, cỡ chữ lớn sang trọng */}
        <div className="flex items-center z-10 pointer-events-auto">
          <button
            onClick={() => onNavigate('hero')}
            className="font-serif text-2xl sm:text-3xl tracking-[0.16em] font-medium text-white hover:text-white/80 transition-colors drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] focus:outline-none cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            REFUJI
          </button>
        </div>

        {/* THANH TASKBAR LIQUID GLASS Ở CHÍNH GIỮA: Kích thước rộng rãi, phom chuẩn RytoxGroup */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-20 items-center justify-center pointer-events-auto">
          <NavigationScrubber
            activeId={activeSection}
            onChange={onNavigate}
            items={navItems}
            variant="header"
          />
        </div>

        {/* BÊN PHẢI: Duy nhất nút Tài khoản dạng Glass Capsule với Rytox Lift */}
        <div className="flex items-center z-10 pointer-events-auto">
          <button
            onClick={onOpenAuth}
            className="crystal-liquid-glass rytox-hover-lift h-11 px-6 rounded-full flex items-center gap-2.5 font-semibold text-sm text-white cursor-pointer shadow-lg"
          >
            <User size={16} />
            <span>Tài khoản</span>
          </button>
        </div>
      </header>

      {/* 2. MOBILE BOTTOM FLOATING DOCK */}
      <div
        className={`md:hidden fixed bottom-5 inset-x-0 z-50 mx-auto w-[94%] max-w-[440px] transition-all duration-300 pointer-events-auto ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
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
