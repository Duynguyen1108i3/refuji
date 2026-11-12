// Tính năng: Thanh tìm kiếm Liquid Glass 4 cột bổ sung bộ lọc Mức giá/ngày, đồng bộ bo tròn pill & font chữ
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Filter, Check, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CAMERA_SERIES_DROPDOWN_OPTIONS,
  getCameraSeriesMeta,
} from '../utils/cameraSeries';

export const PRICE_RANGE_OPTIONS = [
  'Tất cả mức giá',
  'Dưới 200.000đ',
  '200.000đ – 400.000đ',
  '400.000đ – 700.000đ',
  'Trên 700.000đ',
] as const;

export interface SearchFilterParams {
  category: string;
  mount: string;
  series: string;
  dates: string;
  priceRange?: string;
}

interface GlassSearchBarProps {
  onSearch: (params: SearchFilterParams) => void;
  selectedDates?: string;
  onOpenCalendar?: () => void;
  initialCategory?: string;
  initialMount?: string;
  initialSeries?: string;
  initialPriceRange?: string;
  variant?: 'standalone' | 'header' | 'compact-header';
  className?: string;
}

export const GlassSearchBar: React.FC<GlassSearchBarProps> = ({ 
  onSearch, 
  selectedDates,
  onOpenCalendar,
  initialCategory = 'Tất cả thiết bị',
  initialMount,
  initialSeries,
  initialPriceRange,
  variant = 'compact-header',
  className = ''
}) => {
  const [dates, setDates] = useState(selectedDates || '29/10 — 31/10 (3 ngày)');
  const [mount, setMount] = useState(initialMount || 'Tất cả hệ ngàm');
  const [series, setSeries] = useState(initialSeries || 'Tất cả dòng máy');
  const [priceRange, setPriceRange] = useState(initialPriceRange || 'Tất cả mức giá');

  // Đồng bộ props từ ngoài
  useEffect(() => {
    if (selectedDates && selectedDates !== dates) {
      setDates(selectedDates);
    }
  }, [selectedDates]);

  useEffect(() => {
    if (initialMount && initialMount !== mount) {
      setMount(initialMount);
    }
  }, [initialMount]);

  useEffect(() => {
    if (initialSeries && initialSeries !== series) {
      setSeries(initialSeries);
    }
  }, [initialSeries]);

  useEffect(() => {
    if (initialPriceRange && initialPriceRange !== priceRange) {
      setPriceRange(initialPriceRange);
    }
  }, [initialPriceRange]);

  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Segment đang có active pill (do hover hoặc do dropdown đang mở)
  const activePill = activeDropdown || hoveredSegment;

  const handleMouseEnter = (name: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredSegment(name);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSegment(null);
    }, 100);
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleSelectDates = (opt: string) => {
    if (opt === 'Tùy chỉnh lịch' || opt.includes('Tùy chỉnh')) {
      setActiveDropdown(null);
      if (onOpenCalendar) onOpenCalendar();
      return;
    }
    setDates(opt);
    setActiveDropdown(null);
    onSearch({ category: initialCategory, mount, series, dates: opt, priceRange });
  };

  const handleSelectMount = (opt: string) => {
    let nextSeries = series;
    if (opt === 'Hệ ngàm G (Medium Format)' && series !== 'Tất cả dòng máy' && series !== 'Fujifilm GFX Series') {
      nextSeries = 'Tất cả dòng máy';
    } else if (opt === 'Hệ ngàm X (APS-C)' && series === 'Fujifilm GFX Series') {
      nextSeries = 'Tất cả dòng máy';
    }
    setMount(opt);
    setSeries(nextSeries);
    setActiveDropdown(null);
    onSearch({ category: initialCategory, mount: opt, series: nextSeries, dates, priceRange });
  };

  const handleSelectSeries = (opt: string) => {
    let nextMount = mount;
    if (opt === 'Fujifilm GFX Series' && mount === 'Hệ ngàm X (APS-C)') {
      nextMount = 'Tất cả hệ ngàm';
    } else if (opt !== 'Tất cả dòng máy' && opt !== 'Fujifilm GFX Series' && mount === 'Hệ ngàm G (Medium Format)') {
      nextMount = 'Tất cả hệ ngàm';
    }
    setSeries(opt);
    setMount(nextMount);
    setActiveDropdown(null);
    onSearch({ category: initialCategory, mount: nextMount, series: opt, dates, priceRange });
  };

  const handleSelectPriceRange = (opt: string) => {
    setPriceRange(opt);
    setActiveDropdown(null);
    onSearch({ category: initialCategory, mount, series, dates, priceRange: opt });
  };

  const isHeaderMode = variant === 'header' || variant === 'compact-header';

  return (
    <div className={`relative w-full max-w-[780px] mx-auto z-40 select-none ${className}`}>
      {/* 
        THANH TÌM KIẾM 4 CỘT CÂN ĐỐI:
        - Ô 1: THỜI GIAN THUÊ
        - Ô 2: HỆ NGÀM
        - Ô 3: DÒNG MÁY
        - Ô 4: MỨC GIÁ / NGÀY
      */}
      <div 
        onMouseLeave={() => {
          setHoveredSegment(null);
          handleMouseLeave();
        }}
        className={`bg-white rounded-full flex items-center shadow-[0_8px_30px_rgba(20,24,32,0.06)] border border-[#14171f]/10 transition-all ${
          isHeaderMode ? 'h-[54px] md:h-[58px] p-1.5' : 'h-[64px] p-2'
        }`}
      >
        {/* SEGMENT 1: THỜI GIAN THUÊ */}
        <div 
          className={`relative flex-1 min-w-0 ${
            isHeaderMode ? 'h-[44px] md:h-[46px] px-3.5 lg:px-4' : 'h-[48px] px-4 sm:px-5'
          } flex flex-col justify-center rounded-full transition-colors duration-150 cursor-pointer select-none text-left`}
          onClick={() => toggleDropdown('dates')}
          onMouseEnter={() => handleMouseEnter('dates')}
          onMouseLeave={handleMouseLeave}
        >
          {/* Active Fluid Slider Pill */}
          {activePill === 'dates' && (
            <motion.div
              layoutId={`search-pill-${variant}`}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.8,
              }}
              className="absolute inset-0 rounded-full -z-10 crystal-liquid-lens"
            />
          )}

          <div className="text-[10px] uppercase font-bold tracking-wider text-[#747b8c] mb-0.5 leading-none truncate">
            Thời gian thuê
          </div>
          <div className="text-xs sm:text-[13px] font-semibold text-[#14171f] flex items-center justify-between gap-1.5 leading-tight num">
            <span className="truncate">{dates}</span>
            <Calendar size={13} className={`shrink-0 transition-colors ${activeDropdown === 'dates' ? 'text-[#14171f]' : 'text-[#6e7587]'}`} />
          </div>

          {/* Menu Dropdown Thời Gian */}
          <AnimatePresence>
            {activeDropdown === 'dates' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+8px)] left-0 min-w-[270px] liquid-glass-menu rounded-3xl p-2 z-50 text-xs before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-[''] shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] uppercase font-semibold text-[#747b8c] px-3 py-1 mb-1 tracking-wider">
                  Gói thời gian tiêu chuẩn
                </div>
                {['29/10 — 31/10 (3 ngày)', 'Hôm nay — Ngày mai (24h)', 'Cuối tuần (Thứ 6 — Chủ Nhật)', 'Gói 7 ngày du lịch', 'Tùy chỉnh lịch...'].map((opt) => {
                  const isSelected = dates === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleSelectDates(opt)}
                      className={`w-full py-2.5 px-3.5 rounded-full cursor-pointer transition-all flex items-center justify-between text-left num ${
                        isSelected 
                          ? 'bg-[#14171f]/10 text-[#14171f] font-semibold shadow-sm border border-[#14171f]/12' 
                          : 'text-[#383d4c] hover:text-[#14171f] hover:bg-[#14171f]/[0.05]'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={14} className="text-[#14171f] shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider 1 */}
        <div 
          className={`hidden md:block w-[1px] h-6 bg-[#14171f]/12 mx-0.5 transition-opacity duration-200 shrink-0 ${
            activePill === 'dates' || activePill === 'mount' ? 'opacity-0' : 'opacity-100'
          }`} 
        />

        {/* SEGMENT 2: HỆ NGÀM */}
        <div 
          className={`relative flex-1 min-w-0 ${
            isHeaderMode ? 'h-[44px] md:h-[46px] px-3.5 lg:px-4' : 'h-[48px] px-4 sm:px-5'
          } flex flex-col justify-center rounded-full transition-colors duration-150 cursor-pointer select-none text-left`}
          onClick={() => toggleDropdown('mount')}
          onMouseEnter={() => handleMouseEnter('mount')}
          onMouseLeave={handleMouseLeave}
        >
          {/* Active Fluid Slider Pill */}
          {activePill === 'mount' && (
            <motion.div
              layoutId={`search-pill-${variant}`}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.8,
              }}
              className="absolute inset-0 rounded-full -z-10 crystal-liquid-lens"
            />
          )}

          <div className="text-[10px] uppercase font-bold tracking-wider text-[#747b8c] mb-0.5 leading-none truncate">
            Hệ ngàm
          </div>
          <div className="text-xs sm:text-[13px] font-semibold text-[#14171f] flex items-center justify-between gap-1.5 leading-tight">
            <span className="truncate">{mount}</span>
            <ChevronDown 
              size={13} 
              className={`text-[#6e7587] shrink-0 transition-transform duration-200 ${
                activeDropdown === 'mount' ? 'rotate-180 text-[#14171f]' : ''
              }`} 
            />
          </div>

          {/* Menu Dropdown Hệ Ngàm */}
          <AnimatePresence>
            {activeDropdown === 'mount' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+8px)] left-0 min-w-[250px] liquid-glass-menu rounded-3xl p-2 z-50 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-[''] shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {['Tất cả hệ ngàm', 'Hệ ngàm X (APS-C)', 'Hệ ngàm G (Medium Format)'].map((opt) => {
                  const isSelected = mount === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleSelectMount(opt)}
                      className={`w-full px-3.5 py-2.5 rounded-full text-xs cursor-pointer transition-all flex items-center justify-between text-left ${
                        isSelected 
                          ? 'bg-[#14171f]/10 text-[#14171f] font-semibold shadow-sm border border-[#14171f]/12' 
                          : 'text-[#383d4c] hover:text-[#14171f] hover:bg-[#14171f]/[0.05]'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={14} className="text-[#14171f] shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider 2 */}
        <div 
          className={`hidden md:block w-[1px] h-6 bg-[#14171f]/12 mx-0.5 transition-opacity duration-200 shrink-0 ${
            activePill === 'mount' || activePill === 'series' ? 'opacity-0' : 'opacity-100'
          }`} 
        />

        {/* SEGMENT 3: DÒNG MÁY */}
        <div 
          className={`relative flex-1 min-w-0 ${
            isHeaderMode ? 'h-[44px] md:h-[46px] px-3.5 lg:px-4' : 'h-[48px] px-4 sm:px-5'
          } flex flex-col justify-center rounded-full transition-colors duration-150 cursor-pointer select-none text-left`}
          onClick={() => toggleDropdown('series')}
          onMouseEnter={() => handleMouseEnter('series')}
          onMouseLeave={handleMouseLeave}
        >
          {/* Active Fluid Slider Pill */}
          {activePill === 'series' && (
            <motion.div
              layoutId={`search-pill-${variant}`}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.8,
              }}
              className="absolute inset-0 rounded-full -z-10 crystal-liquid-lens"
            />
          )}

          <div className="text-[10px] uppercase font-bold tracking-wider text-[#747b8c] mb-0.5 leading-none truncate">
            Dòng máy
          </div>
          <div className="text-xs sm:text-[13px] font-semibold text-[#14171f] flex items-center justify-between gap-1.5 leading-tight">
            <span className="truncate">{series}</span>
            <Filter size={13} className={`shrink-0 transition-colors ${activeDropdown === 'series' ? 'text-[#14171f]' : 'text-[#6e7587]'}`} />
          </div>

          {/* Menu Dropdown Dòng Máy */}
          <AnimatePresence>
            {activeDropdown === 'series' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+8px)] left-0 min-w-[290px] max-h-[380px] overflow-y-auto liquid-glass-menu rounded-3xl p-2 z-50 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-[''] shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {CAMERA_SERIES_DROPDOWN_OPTIONS.map((opt) => {
                  const isSelected = series === opt;
                  const meta = opt !== 'Tất cả dòng máy' ? getCameraSeriesMeta(opt) : undefined;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleSelectSeries(opt)}
                      className={`w-full px-3.5 py-2 rounded-2xl text-xs cursor-pointer transition-all flex items-center justify-between text-left ${
                        isSelected 
                          ? 'bg-[#14171f]/10 text-[#14171f] font-semibold shadow-sm border border-[#14171f]/12' 
                          : 'text-[#383d4c] hover:text-[#14171f] hover:bg-[#14171f]/[0.05]'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="leading-snug truncate">
                          {meta && meta.rank <= 7 ? `${meta.rank}. ${opt}` : opt}
                        </span>
                        {meta && (
                          <span className="text-[10px] text-[#747b8c] font-normal truncate">
                            {meta.featureSummary}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={14} className="text-[#14171f] shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider 3 */}
        <div 
          className={`hidden md:block w-[1px] h-6 bg-[#14171f]/12 mx-0.5 transition-opacity duration-200 shrink-0 ${
            activePill === 'series' || activePill === 'price' ? 'opacity-0' : 'opacity-100'
          }`} 
        />

        {/* SEGMENT 4: MỨC GIÁ / NGÀY */}
        <div 
          className={`relative flex-1 min-w-0 ${
            isHeaderMode ? 'h-[44px] md:h-[46px] px-3.5 lg:px-4' : 'h-[48px] px-4 sm:px-5'
          } flex flex-col justify-center rounded-full transition-colors duration-150 cursor-pointer select-none text-left`}
          onClick={() => toggleDropdown('price')}
          onMouseEnter={() => handleMouseEnter('price')}
          onMouseLeave={handleMouseLeave}
        >
          {/* Active Fluid Slider Pill */}
          {activePill === 'price' && (
            <motion.div
              layoutId={`search-pill-${variant}`}
              transition={{
                type: 'spring',
                stiffness: 450,
                damping: 32,
                mass: 0.8,
              }}
              className="absolute inset-0 rounded-full -z-10 crystal-liquid-lens"
            />
          )}

          <div className="text-[10px] uppercase font-bold tracking-wider text-[#747b8c] mb-0.5 leading-none truncate">
            Mức giá
          </div>
          <div className="text-xs sm:text-[13px] font-semibold text-[#14171f] flex items-center justify-between gap-1.5 leading-tight num">
            <span className="truncate">{priceRange}</span>
            <Banknote size={13} className={`shrink-0 transition-colors ${activeDropdown === 'price' ? 'text-[#14171f]' : 'text-[#6e7587]'}`} />
          </div>

          {/* Menu Dropdown Mức Giá */}
          <AnimatePresence>
            {activeDropdown === 'price' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+8px)] right-0 min-w-[240px] liquid-glass-menu rounded-3xl p-2 z-50 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-[''] shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] uppercase font-semibold text-[#747b8c] px-3 py-1 mb-1 tracking-wider">
                  Giá thuê theo ngày
                </div>
                {PRICE_RANGE_OPTIONS.map((opt) => {
                  const isSelected = priceRange === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleSelectPriceRange(opt)}
                      className={`w-full px-3.5 py-2.5 rounded-full text-xs cursor-pointer transition-all flex items-center justify-between text-left num ${
                        isSelected 
                          ? 'bg-[#14171f]/10 text-[#14171f] font-semibold shadow-sm border border-[#14171f]/12' 
                          : 'text-[#383d4c] hover:text-[#14171f] hover:bg-[#14171f]/[0.05]'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={14} className="text-[#14171f] shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
