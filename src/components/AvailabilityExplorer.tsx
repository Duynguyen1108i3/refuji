import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassSearchBar } from './GlassSearchBar';
import { CalendarModal } from './CalendarModal';
import { CAMERAS, LENSES, ACCESSORIES } from '../data/mockData';
import { CameraModel, LensModel, AccessoryModel } from '../types';
import { 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Layers, 
  Heart, 
  ArrowUpRight 
} from 'lucide-react';

interface AvailabilityExplorerProps {
  onSearch: (params: { category: string; mount: string; series: string; dates: string }) => void;
  onSelectItem: (item: CameraModel | LensModel | AccessoryModel) => void;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export const AvailabilityExplorer: React.FC<AvailabilityExplorerProps> = ({
  onSearch,
  onSelectItem,
  membershipTier = 'BRONZE',
}) => {
  // Bộ lọc đồng bộ từ thanh GlassSearchBar (Single Source of Truth)
  const [filterParams, setFilterParams] = useState({
    category: 'Thân máy (Body)',
    mount: 'Hệ ngàm X (APS-C)',
    series: 'Tất cả dòng máy',
    dates: '29/10 — 31/10 (3 ngày)',
  });
  
  // Trạng thái mở xem chi tiết lịch và bộ lọc theo loại trong lịch
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  // Tỷ lệ giảm cọc theo MembershipTiers v1.1
  const tierDiscountMap: Record<string, { label: string; discount: number; badge: string }> = {
    BRONZE: { label: 'Hạng Đồng', discount: 0, badge: 'Mặc định' },
    SILVER: { label: 'Hạng Bạc', discount: 0.05, badge: 'Giảm 5% cọc' },
    GOLD: { label: 'Hạng Vàng', discount: 0.10, badge: 'Giảm 10% cọc + Ưu tiên' },
    PLATINUM: { label: 'Bạch Kim', discount: 0.15, badge: 'Giảm 15% cọc + Fast-track' }
  };

  const currentTier = tierDiscountMap[membershipTier];

  // Danh sách toàn bộ cá thể thiết bị
  const allEquipment = [
    ...CAMERAS.map((c) => ({ ...c, type: 'BODY' as const })),
    ...LENSES.map((l) => ({ ...l, type: 'LENS' as const })),
    ...ACCESSORIES.map((a) => ({ ...a, type: 'ACCESSORY' as const })),
  ];

  // Lọc chính xác theo nghiệp vụ đã chọn từ thanh tìm kiếm
  const filteredItems = allEquipment.filter((item) => {
    // 1. Lọc theo Phân loại
    if (filterParams.category === 'Thân máy (Body)' && item.type !== 'BODY') return false;
    if (filterParams.category === 'Ống kính (Lens)' && item.type !== 'LENS') return false;
    if (filterParams.category === 'Phụ kiện & Pin' && item.type !== 'ACCESSORY') return false;

    // 2. Lọc theo Hệ ngàm
    if (filterParams.mount === 'Hệ ngàm X (APS-C)') {
      if (item.type === 'BODY' && (item as CameraModel).series === 'GFX') return false;
      if (item.type === 'LENS' && (item as LensModel).mount === 'GF') return false;
    }
    if (filterParams.mount === 'Hệ ngàm G (Medium Format)') {
      if (item.type === 'BODY' && (item as CameraModel).series !== 'GFX') return false;
      if (item.type === 'LENS' && (item as LensModel).mount !== 'GF') return false;
      if (item.type === 'ACCESSORY') return false;
    }

    // 3. Lọc theo Dòng máy
    if (filterParams.series !== 'Tất cả dòng máy' && item.type === 'BODY') {
      const cam = item as CameraModel;
      if (filterParams.series === 'Fujifilm X100 Series' && cam.series !== 'X100') return false;
      if (filterParams.series === 'Fujifilm X-T Series' && cam.series !== 'X-T') return false;
      if (filterParams.series === 'Fujifilm X-H Series' && cam.series !== 'X-H') return false;
      if (filterParams.series === 'Fujifilm GFX Series' && cam.series !== 'GFX') return false;
    }

    return true;
  });

  const handleFilterChange = (params: { category: string; mount: string; series: string; dates: string }) => {
    setFilterParams(params);
    onSearch(params);
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 select-none">
      
      {/* 1. SECTION HEADER (Chuẩn phong cách Editorial Luxury) */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white uppercase tracking-tight mb-3">
          Kiểm Tra Lịch &amp; Dự Toán Chi Phí
        </h2>
        
        <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed">
          Thuật toán kiểm tra khả dụng đa khung giờ theo thời gian thực (Time-Slot Availability Engine v1.1),
          tự động tách dòng thiết bị và bảo toàn quyền giữ chỗ 15 phút chống đặt trùng.
        </p>
      </div>

      {/* 2. THANH TÌM KIẾM LIQUID GLASS (Bộ lọc trung tâm duy nhất) */}
      <GlassSearchBar 
        onSearch={handleFilterChange} 
        selectedDates={filterParams.dates}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
      />

      {/* 3. THANH THÔNG TIN BỘ LỌC HIỆN TẠI (TINH GỌN, ĐÃ CHUYỂN HẠNG THÀNH VIÊN VÀO TÀI KHOẢN) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-8 mb-6 z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 radar-pulse-green shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-white/90">
            Tìm thấy <strong className="text-white font-bold">{filteredItems.length}</strong> thiết bị khả dụng
          </span>
          <span className="text-xs text-white/40 hidden md:inline">•</span>
          <span className="text-xs text-white/60 hidden md:inline truncate">
            {filterParams.category} • {filterParams.mount} • {filterParams.dates}
          </span>
        </div>

        {currentTier.discount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-[11px] text-amber-300">
            <Sparkles size={12} className="text-amber-400" />
            <span>Tự động áp dụng đặc quyền <strong>{currentTier.label}</strong> (Giảm {currentTier.discount * 100}% cọc)</span>
          </div>
        )}
      </div>

      {/* 4. PHÂN HỆ XEM LỊCH & CHỌN NGÀY DẠNG POPUP (THEO STYLE ẢNH 2 & THIẾT KẾ ẢNH 3) */}
      <div className="mb-10">
        
        {/* Nút bấm mở Popup Lịch nổi bật */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(true)}
            className="crystal-liquid-glass px-7 py-3 rounded-full text-xs sm:text-sm font-semibold text-white/95 hover:text-white flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg group border border-white/20 hover:border-white/40"
          >
            <Calendar size={16} className="text-amber-400" />
            <span>Chọn ngày nhận &amp; trả máy</span>
            <ArrowUpRight size={15} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* POPUP MODAL NỔI (THEO ĐÚNG STYLE ẢNH 2 & THIẾT KẾ ẢNH 3) */}
        <AnimatePresence>
          {isCalendarModalOpen && (
            <CalendarModal
              isOpen={isCalendarModalOpen}
              onClose={() => setIsCalendarModalOpen(false)}
              initialStartDate="2026-10-29"
              initialEndDate="2026-10-31"
              onApplyDates={(rangeText) => {
                const newParams = { ...filterParams, dates: rangeText };
                setFilterParams(newParams);
                onSearch(newParams);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 5. LƯỚI THIẾT BỊ KHẢ DỤNG CHI TIẾT (LIVE INVENTORY CARDS GRID WITH RYTOX HOVER SPRING) */}
      <div className="mb-14">
        {filteredItems.length === 0 ? (
          <div className="liquid-glass rounded-2xl p-10 text-center border border-white/10 my-8">
            <div className="text-base text-white/80 font-medium mb-1">
              Không tìm thấy thiết bị phù hợp với bộ lọc hiện tại
            </div>
            <p className="text-xs text-white/50">
              Vui lòng thử chọn lại phân loại, hệ ngàm hoặc dòng máy khác trên thanh tìm kiếm.
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => {
              const discountedDeposit = Math.round(item.depositRate * (1 - currentTier.discount));
              const isLowStock = item.availableCount === 1;
              const isFav = favorites.has(item.id);

              return (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.38, delay: Math.min(idx * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
                  className="relative liquid-glass-card rounded-[28px] p-6 border border-white/12 hover:border-white/30 flex flex-col justify-between transition-all duration-300 group cursor-pointer shadow-[0_16px_40px_rgba(0,0,0,0.45)] hover:shadow-[0_24px_55px_rgba(0,0,0,0.65)]"
                  onClick={() => onSelectItem(item as any)}
                >
                  <div>
                    {/* Top Row: Badge on Left, Heart Wishlist on Right (chuẩn style ảnh 2) */}
                    <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="px-3 py-1 rounded-lg bg-black/90 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold shadow-md tracking-wide">
                          {item.highlightBadge || item.type}
                        </span>
                      </div>

                      {/* Nút yêu thích Heart tròn (theo style ảnh 2) */}
                      <button
                        type="button"
                        aria-label="Thêm vào yêu thích"
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isFav 
                            ? 'text-rose-500 bg-rose-500/10' 
                            : 'text-white/60 hover:text-white hover:bg-white/10 active:scale-90'
                        }`}
                      >
                        <Heart size={19} className={isFav ? 'fill-rose-500' : ''} />
                      </button>
                    </div>

                    {/* Product Image: Thoáng đạt, nổi khối 3D không bị đóng khung tối (theo style ảnh 2) */}
                    <div className="relative h-48 sm:h-52 w-full flex items-center justify-center py-2 my-2 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="max-h-full max-w-[88%] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)] group-hover:scale-108 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                      />
                    </div>

                    {/* Product Name */}
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-1.5 group-hover:text-amber-300 transition-colors line-clamp-1">
                      {item.name}
                    </h4>

                    {/* Trạng thái sẵn sàng cho Khách hàng */}
                    <div className="flex items-center gap-1.5 text-xs mb-4">
                      <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-amber-400 radar-pulse-amber' : 'bg-emerald-400 radar-pulse-green'}`} />
                      <span className={isLowStock ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                        {isLowStock ? 'Chỉ còn 1 thiết bị cuối' : 'Sẵn sàng giao ngay'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Giá bên trái, Nút mũi tên có chữ "Đặt chỗ" bên phải (theo đúng yêu cầu ảnh 2) */}
                  <div className="pt-3 border-t border-white/10 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {item.dailyRate.toLocaleString('vi-VN')} ₫
                        <span className="text-xs font-normal text-white/50 ml-1">/ ngày</span>
                      </div>
                      <div className="text-xs text-white/60 mt-0.5">
                        Cọc:{' '}
                        {currentTier.discount > 0 ? (
                          <>
                            <span className="line-through text-white/40 mr-1.5">
                              {item.depositRate.toLocaleString('vi-VN')} ₫
                            </span>
                            <span className="text-amber-400 font-semibold">
                              {discountedDeposit.toLocaleString('vi-VN')} ₫
                            </span>
                          </>
                        ) : (
                          <span>{item.depositRate.toLocaleString('vi-VN')} ₫</span>
                        )}
                      </div>
                    </div>

                    {/* Nút mũi tên có thêm văn bản "Đặt chỗ" */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(item as any);
                      }}
                      className="h-11 px-4 sm:px-5 rounded-full bg-white hover:bg-neutral-100 text-[#090A0F] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_4px_16px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <span>Đặt chỗ</span>
                      <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* 6. KHUNG QUY TẮC NGHIỆP VỤ & PHÁP LÝ (THEO BẢN ĐẶC TẢ v1.1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 liquid-glass rounded-3xl p-6 sm:p-7 border border-white/15 text-xs text-white/80 shadow-2xl">
        
        <div className="flex items-start gap-3">
          <Clock size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-white mb-1">Khóa giữ chỗ 15 phút (Hold)</div>
            <div className="text-white/60 leading-relaxed text-[11.5px]">
              Đơn hàng được khóa chỗ độc quyền 15 phút chống Race Condition. Bạn có thể thanh toán cọc qua VNPAY hoặc chọn nhận máy tại quầy.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-white mb-1">Tuân thủ Luật Căn cước 2023</div>
            <div className="text-white/60 leading-relaxed text-[11.5px]">
              Cửa hàng chỉ đối chiếu Thẻ căn cước/VNeID trực tiếp khi bàn giao máy, cam kết <strong>KHÔNG giữ thẻ gốc</strong> của khách hàng.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Layers size={20} className="text-sky-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-white mb-1">Kiểm tra Serial &amp; Biên bản 2 chiều</div>
            <div className="text-white/60 leading-relaxed text-[11.5px]">
              Mỗi thiết bị được gán đúng số Serial Number, chụp ảnh ngoại hình đối chứng lúc Check-out và hoàn cọc tức thì khi Check-in.
            </div>
          </div>
        </div>

      </div>

    </section>
  );
};
