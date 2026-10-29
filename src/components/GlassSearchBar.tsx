import React, { useState, useRef } from 'react';
import { Calendar, ChevronDown, Filter, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassSearchBarProps {
  onSearch: (params: { category: string; mount: string; series: string; dates: string }) => void;
  selectedDates?: string;
  onOpenCalendar?: () => void;
}

export const GlassSearchBar: React.FC<GlassSearchBarProps> = ({ 
  onSearch, 
  selectedDates,
  onOpenCalendar 
}) => {
  const [category, setCategory] = useState('Thân máy (Body)');
  const [dates, setDates] = useState(selectedDates || '29/10 — 31/10 (3 ngày)');
  const [mount, setMount] = useState('Hệ ngàm X (APS-C)');
  const [series, setSeries] = useState('Tất cả dòng máy');

  // Cập nhật khi selectedDates từ ngoài thay đổi (ví dụ từ CalendarModal)
  React.useEffect(() => {
    if (selectedDates && selectedDates !== dates) {
      setDates(selectedDates);
    }
  }, [selectedDates]);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Xử lý rê chuột tự động mở menu (kèm chống rung/flicker)
  const handleMouseEnter = (name: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 120);
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleSelectCategory = (opt: string) => {
    setCategory(opt);
    setActiveDropdown(null);
    onSearch({ category: opt, mount, series, dates });
  };

  const handleSelectDates = (opt: string) => {
    if (opt === 'Tùy chỉnh lịch' || opt.includes('Tùy chỉnh')) {
      setActiveDropdown(null);
      if (onOpenCalendar) onOpenCalendar();
      return;
    }
    setDates(opt);
    setActiveDropdown(null);
    onSearch({ category, mount, series, dates: opt });
  };

  const handleSelectMount = (opt: string) => {
    setMount(opt);
    setActiveDropdown(null);
    onSearch({ category, mount: opt, series, dates });
  };

  const handleSelectSeries = (opt: string) => {
    setSeries(opt);
    setActiveDropdown(null);
    onSearch({ category, mount, series: opt, dates });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ category, mount, series, dates });
    setActiveDropdown(null);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto my-14 px-4 sm:px-8 z-40">
      {/* 
        THANH TÌM KIẾM LIQUID GLASS CONCENTRIC CORNERS:
        - Khung ngoài: H = 68px, R = 34px (rounded-full), Padding = 8px (p-2).
        - Chiều cao khả dụng: 52px (h-[52px]) cho tất cả các ô và nút tìm kiếm.
        - Rê chuột tự động hiện menu dropdown mượt mà (có hover bridge chống nháy).
        - Khi click hoặc hover, ô chọn giữ trạng thái active đồng bộ.
        - Menu Dropdown: Bo góc lồng nhau chuẩn 16px -> 10px kèm icon Checkmark cho item đang chọn.
      */}
      <form 
        onSubmit={handleSearchSubmit}
        className="liquid-glass rounded-[28px] md:rounded-full p-2.5 md:p-2 flex flex-col md:flex-row md:items-center shadow-[0_16px_40px_rgba(0,0,0,0.6)] border border-white/20 transition-all md:h-[68px]"
      >
        {/* SEGMENT 1: PHÂN LOẠI (Bo tròn hoàn hảo pill rounded-full) */}
        <div 
          className={`relative flex-1 h-[52px] px-5 sm:px-6 flex flex-col justify-center rounded-full transition-all duration-200 cursor-pointer select-none ${
            activeDropdown === 'category'
              ? 'bg-white/15 text-white border border-white/25 shadow-sm'
              : 'hover:bg-white/10 active:bg-white/15 border border-transparent'
          }`}
          onClick={() => toggleDropdown('category')}
          onMouseEnter={() => handleMouseEnter('category')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-0.5 leading-none">
            Phân loại
          </div>
          <div className="text-xs sm:text-[13px] font-semibold text-white flex items-center justify-between gap-1 leading-tight">
            <span className="truncate">{category}</span>
            <ChevronDown 
              size={14} 
              className={`text-white/70 shrink-0 transition-transform duration-200 ${
                activeDropdown === 'category' ? 'rotate-180 text-white' : ''
              }`} 
            />
          </div>

          {/* Menu Dropdown Phân Loại (Liquid Glass Trung Tính Không Ám Màu) */}
          <AnimatePresence>
            {activeDropdown === 'category' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+8px)] left-0 min-w-[240px] liquid-glass-menu rounded-2xl p-1.5 z-50 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                onClick={(e) => e.stopPropagation()}
              >
                {['Tất cả thiết bị', 'Thân máy (Body)', 'Ống kính (Lens)', 'Phụ kiện & Pin'].map((opt) => {
                  const isSelected = category === opt;
                  return (
                    <div 
                      key={opt}
                      onClick={() => handleSelectCategory(opt)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-white/20 text-white font-semibold shadow-sm border border-white/15' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider 1: Tự mờ khi một trong hai ô liền kề mở menu */}
        <div 
          className={`hidden md:block w-[1px] h-6 bg-white/20 mx-0.5 transition-opacity duration-200 shrink-0 ${
            activeDropdown === 'category' || activeDropdown === 'dates' ? 'opacity-0' : 'opacity-100'
          }`} 
        />

        {/* SEGMENT 2: THỜI GIAN THUÊ (Bo tròn hoàn hảo pill rounded-full) */}
        <div 
          className={`relative flex-1 h-[52px] px-5 sm:px-6 flex flex-col justify-center rounded-full transition-all duration-200 cursor-pointer select-none ${
            activeDropdown === 'dates'
              ? 'bg-white/15 text-white border border-white/25 shadow-sm'
              : 'hover:bg-white/10 active:bg-white/15 border border-transparent'
          }`}
          onClick={() => toggleDropdown('dates')}
          onMouseEnter={() => handleMouseEnter('dates')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-0.5 leading-none">
            Thời gian thuê
          </div>
          <div className="text-xs sm:text-[13px] font-semibold text-white flex items-center justify-between gap-1 leading-tight">
            <span className="truncate">{dates}</span>
            <Calendar size={14} className={`shrink-0 transition-colors ${activeDropdown === 'dates' ? 'text-white' : 'text-white/70'}`} />
          </div>

          {/* Menu Dropdown Thời Gian (Liquid Glass Trung Tính Không Ám Màu) */}
          <AnimatePresence>
            {activeDropdown === 'dates' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+8px)] left-0 min-w-[270px] liquid-glass-menu rounded-2xl p-2 z-50 text-xs before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] uppercase font-semibold text-white/50 px-3 py-1 mb-1 tracking-wider">
                  Gói thời gian tiêu chuẩn
                </div>
                {['Hôm nay — Ngày mai (24h)', 'Cuối tuần (Thứ 6 — Chủ Nhật)', 'Gói 7 ngày du lịch', 'Tùy chỉnh lịch'].map((opt) => {
                  const isSelected = dates === opt;
                  return (
                    <div 
                      key={opt}
                      onClick={() => handleSelectDates(opt)}
                      className={`py-2.5 px-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-white/20 text-white font-semibold shadow-sm border border-white/15' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider 2 */}
        <div 
          className={`hidden md:block w-[1px] h-6 bg-white/20 mx-0.5 transition-opacity duration-200 shrink-0 ${
            activeDropdown === 'dates' || activeDropdown === 'mount' ? 'opacity-0' : 'opacity-100'
          }`} 
        />

        {/* SEGMENT 3: HỆ NGÀM (Bo tròn hoàn hảo pill rounded-full) */}
        <div 
          className={`relative flex-1 h-[52px] px-5 sm:px-6 flex flex-col justify-center rounded-full transition-all duration-200 cursor-pointer select-none ${
            activeDropdown === 'mount'
              ? 'bg-white/15 text-white border border-white/25 shadow-sm'
              : 'hover:bg-white/10 active:bg-white/15 border border-transparent'
          }`}
          onClick={() => toggleDropdown('mount')}
          onMouseEnter={() => handleMouseEnter('mount')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-0.5 leading-none">
            Hệ ngàm
          </div>
          <div className="text-xs sm:text-[13px] font-semibold text-white flex items-center justify-between gap-1 leading-tight">
            <span className="truncate">{mount}</span>
            <ChevronDown 
              size={14} 
              className={`text-white/70 shrink-0 transition-transform duration-200 ${
                activeDropdown === 'mount' ? 'rotate-180 text-white' : ''
              }`} 
            />
          </div>

          {/* Menu Dropdown Hệ Ngàm (Liquid Glass Trung Tính Không Ám Màu) */}
          <AnimatePresence>
            {activeDropdown === 'mount' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+8px)] left-0 min-w-[250px] liquid-glass-menu rounded-2xl p-1.5 z-50 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                onClick={(e) => e.stopPropagation()}
              >
                {['Tất cả hệ ngàm', 'Hệ ngàm X (APS-C)', 'Hệ ngàm G (Medium Format)'].map((opt) => {
                  const isSelected = mount === opt;
                  return (
                    <div 
                      key={opt}
                      onClick={() => handleSelectMount(opt)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-white/20 text-white font-semibold shadow-sm border border-white/15' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider 3 */}
        <div 
          className={`hidden md:block w-[1px] h-6 bg-white/20 mx-0.5 transition-opacity duration-200 shrink-0 ${
            activeDropdown === 'mount' || activeDropdown === 'series' ? 'opacity-0' : 'opacity-100'
          }`} 
        />

        {/* SEGMENT 4: DÒNG MÁY (Bo tròn hoàn hảo pill rounded-full) */}
        <div 
          className={`relative flex-1 h-[52px] px-5 sm:px-6 flex flex-col justify-center rounded-full transition-all duration-200 cursor-pointer select-none mr-1 ${
            activeDropdown === 'series'
              ? 'bg-white/15 text-white border border-white/25 shadow-sm'
              : 'hover:bg-white/10 active:bg-white/15 border border-transparent'
          }`}
          onClick={() => toggleDropdown('series')}
          onMouseEnter={() => handleMouseEnter('series')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-0.5 leading-none">
            Dòng máy
          </div>
          <div className="text-xs sm:text-[13px] font-semibold text-white flex items-center justify-between gap-1 leading-tight">
            <span className="truncate">{series}</span>
            <Filter size={14} className={`shrink-0 transition-colors ${activeDropdown === 'series' ? 'text-white' : 'text-white/70'}`} />
          </div>

          {/* Menu Dropdown Dòng Máy (Liquid Glass Trung Tính Không Ám Màu) */}
          <AnimatePresence>
            {activeDropdown === 'series' && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[calc(100%+8px)] right-0 min-w-[260px] liquid-glass-menu rounded-2xl p-1.5 z-50 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                onClick={(e) => e.stopPropagation()}
              >
                {['Tất cả dòng máy', 'Fujifilm X100 Series', 'Fujifilm X-T Series', 'Fujifilm X-H Series', 'Fujifilm GFX Series'].map((opt) => {
                  const isSelected = series === opt;
                  return (
                    <div 
                      key={opt}
                      onClick={() => handleSelectSeries(opt)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-white/20 text-white font-semibold shadow-sm border border-white/15' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NÚT TÌM MÁY TRỐNG (Đồng tâm hoàn hảo 52px / R=26px với Rytox Spring Physics) */}
        <button
          type="submit"
          className="h-[52px] px-8 rounded-full bg-white hover:bg-white/95 active:bg-white/80 text-[#0B0F17] font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(255,255,255,0.25)] shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.96]"
        >
          <Search size={16} className="text-[#0B0F17]" />
          <span>Tìm máy trống</span>
        </button>
      </form>
    </div>
  );
};
