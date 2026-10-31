import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraModel, LensModel, AccessoryModel, EquipmentItem } from '../types';
import { 
  Calendar, 
  Sparkles, 
  Heart, 
  ArrowUpRight,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

interface AvailabilityExplorerProps {
  onSearch: (params: { category: string; mount: string; series: string; dates: string }) => void;
  onSelectItem: (item: CameraModel | LensModel | AccessoryModel) => void;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  onOpenAllEquipment: () => void;
  filterParams: { category: string; mount: string; series: string; dates: string };
  onOpenCalendar: () => void;
  cameras?: CameraModel[];
  lenses?: LensModel[];
  accessories?: AccessoryModel[];
  onAddToCart?: (item: EquipmentItem) => void;
}

// Helper nhận diện ảnh thumbnail có viền trắng lớn để scale đều kích thước
const isSmallThumbnailImage = (item: { name: string; image: string }) => {
  return (
    item.image.includes('thum') ||
    item.image.includes('small') ||
    item.image.includes('product-list_gfx100rf') ||
    item.name.includes('GFX')
  );
};

export const AvailabilityExplorer: React.FC<AvailabilityExplorerProps> = ({
  onSearch: _onSearch,
  onSelectItem,
  membershipTier = 'BRONZE',
  onOpenAllEquipment,
  filterParams,
  onOpenCalendar,
  cameras = [],
  lenses = [],
  accessories = [],
  onAddToCart,
}) => {
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
  
  // Tỷ lệ giảm cọc theo MembershipTiers
  const tierDiscountMap: Record<string, { label: string; discount: number; badge: string }> = {
    BRONZE: { label: 'Hạng Đồng', discount: 0, badge: 'Mặc định' },
    SILVER: { label: 'Hạng Bạc', discount: 0.05, badge: 'Giảm 5% cọc' },
    GOLD: { label: 'Hạng Vàng', discount: 0.10, badge: 'Giảm 10% cọc + Ưu tiên' },
    PLATINUM: { label: 'Bạch Kim', discount: 0.15, badge: 'Giảm 15% cọc + Fast-track' }
  };

  const currentTier = tierDiscountMap[membershipTier] || tierDiscountMap.BRONZE;

  // Danh sách toàn bộ cá thể thiết bị
  const allEquipment: (EquipmentItem & { type: 'BODY' | 'LENS' | 'ACCESSORY' })[] = [
    ...cameras.map((c) => ({ ...c, type: 'BODY' as const })),
    ...lenses.map((l) => ({ ...l, type: 'LENS' as const })),
    ...accessories.map((a) => ({ ...a, type: 'ACCESSORY' as const })),
  ];

  // 6 Thiết bị tiêu biểu hiển thị trên Trang Chủ (Cố định chuẩn 2 hàng: 3 máy + 3 ống kính)
  // Giúp trang chủ ổn định 100%, không bị co giật, không tự chạy làm mờ nền khi thao tác popup
  const showcaseItems: (EquipmentItem & { type: 'BODY' | 'LENS' | 'ACCESSORY' })[] = [
    ...(cameras.slice(0, 3).map((c) => ({ ...c, type: 'BODY' as const }))),
    ...(lenses.slice(0, 3).map((l) => ({ ...l, type: 'LENS' as const }))),
  ];

  // ĐÚNG YÊU CẦU: CHỈ HIỂN THỊ ĐÚNG 2 HÀNG (3 cột x 2 hàng = 6 thiết bị) VÀ 1 NÚT XEM THÊM Ở DƯỚI
  const displayItems = showcaseItems;

  return (
    <section id="explore" className="relative w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-12 select-none">
      
      {/* 1. SECTION HEADER (Editorial Luxury Style) */}
      <div className="text-center max-w-3xl mx-auto mb-4">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#14171f] uppercase tracking-tight mb-2.5">
          Kiểm Tra Lịch &amp; Dự Toán Chi Phí
        </h2>
        
        <p className="text-xs sm:text-sm text-[#525868] font-light leading-relaxed">
          Kiểm tra tình trạng thiết bị theo thời gian thực, giữ chỗ tự động và đảm bảo sẵn sàng bàn giao đúng hẹn.
        </p>
      </div>

      {/* 2. NÚT CHỌN LỊCH NHANH DẠNG PILL GLASS */}
      <div className="flex justify-center mb-5">
        <button
          type="button"
          onClick={onOpenCalendar}
          className="crystal-liquid-glass px-7 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#14171f] hover:text-[#0b0d12] flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm group border border-[#14171f]/12 hover:border-[#14171f]/25"
        >
          <Calendar size={16} className="text-[#3c4252]" />
          <span>Chọn ngày nhận &amp; trả máy: <strong className="text-[#14171f] underline decoration-[#14171f]/30">{filterParams.dates}</strong></span>
          <ArrowUpRight size={15} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#14171f]" />
        </button>
      </div>

      {/* 3. THANH THÔNG TIN BỘ LỌC HIỆN TẠI */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#14171f]/80 radar-pulse-white shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-[#444a5a]">
            Hiển thị <strong className="text-[#14171f] font-bold">{displayItems.length}</strong> thiết bị nổi bật sẵn sàng
          </span>
          <span className="text-xs text-[#14171f]/30 hidden md:inline">•</span>
          <span className="text-xs text-[#62687a] hidden md:inline truncate">
            {filterParams.dates}
          </span>
        </div>

        {currentTier.discount > 0 && (
          <div className="crystal-liquid-glass inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#14171f]/12 text-[11px] text-[#2c3242] shadow-sm font-medium">
            <Sparkles size={12} className="text-[#484f60]" />
            <span>Đặc quyền <strong className="text-[#14171f] font-bold">{currentTier.label}</strong> (Giảm {currentTier.discount * 100}% cọc)</span>
          </div>
        )}
      </div>

      {/* 4. LƯỚI 2 HÀNG THIẾT BỊ (GRID 3 CỘT X 2 HÀNG = 6 ITEMS) KHÔNG BỊ TRỄ LAYOUT */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item, idx) => {
            const discountedDeposit = Math.round(item.depositRate * (1 - currentTier.discount));
            const isLowStock = item.availableCount === 1;
            const isFav = favorites.has(item.id);

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
                className="relative liquid-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 group cursor-pointer"
                onClick={() => onSelectItem(item as any)}
              >
                  <div>
                    {/* Top Row: Meta Badge & Wishlist Button */}
                    <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/[0.08] backdrop-blur-md text-[10.5px] font-medium tracking-wider text-[#3c4252] uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/70" />
                          {item.highlightBadge || (item.type === 'BODY' ? 'Máy ảnh' : item.type === 'LENS' ? 'Ống kính' : 'Phụ kiện')}
                        </span>
                      </div>

                      <button
                        type="button"
                        aria-label="Thêm vào yêu thích"
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border backdrop-blur-md ${
                          isFav 
                            ? 'text-rose-500 bg-rose-50 border-rose-200 shadow-sm' 
                            : 'text-[#62687a] hover:text-[#14171f] bg-white/60 hover:bg-white border-[#14171f]/10 hover:border-[#14171f]/25 active:scale-90'
                        }`}
                      >
                        <Heart size={15} className={isFav ? 'fill-rose-500' : 'stroke-[1.8]'} />
                      </button>
                    </div>

                    {/* Product Stage Image: Tự động cân bằng tỉ lệ ảnh giúp 3 máy GFX to đều đặn như hàng dưới */}
                    <div className="relative h-44 sm:h-48 w-full flex items-center justify-center my-3 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className={`max-h-full max-w-[88%] object-contain relative z-10 product-stage-img transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isSmallThumbnailImage(item)
                            ? 'scale-[1.62] group-hover:scale-[1.68] group-hover:-translate-y-1'
                            : 'group-hover:scale-[1.04] group-hover:-translate-y-1'
                        }`} 
                      />
                    </div>

                    {/* Technical Meta Tag */}
                    <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6e7587] mb-1 truncate font-medium">
                      {item.type === 'BODY' 
                        ? `Fujifilm • ${(item as CameraModel).series || 'X'} Series • ${(item as CameraModel).resolution || 'APS-C'}`
                        : item.type === 'LENS'
                        ? `Fujinon • ${(item as LensModel).mount === 'GF' ? 'G-Mount' : 'X-Mount'} • ${(item as LensModel).aperture?.split(' ')[0] || ''}`
                        : `Phụ kiện chính hãng • ${item.brand || 'Fujifilm'}`}
                    </div>

                    {/* Product Name */}
                    <h4 className="text-base sm:text-[17px] font-semibold text-[#14171f] tracking-tight mb-2.5 line-clamp-1 group-hover:text-[#2d3342] transition-colors">
                      {item.name}
                    </h4>

                    {/* Stock Status Indicator */}
                    <div className="flex items-center gap-1.5 text-xs mb-4">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isLowStock 
                          ? 'bg-[#14171f]/70 ring-2 ring-[#14171f]/15' 
                          : 'bg-emerald-500 ring-2 ring-emerald-500/20'
                      }`} />
                      <span className={`text-[11.5px] font-medium tracking-tight ${
                        isLowStock ? 'text-[#3c4252]' : 'text-emerald-700'
                      }`}>
                        {isLowStock ? 'Chỉ còn 1 thiết bị' : 'Sẵn sàng giao ngay'}
                      </span>
                      <span className="text-[#14171f]/20 mx-1">•</span>
                      <span className="text-[11px] text-[#6e7587]">Giao hỏa tốc</span>
                    </div>
                  </div>

                  {/* Bottom: Pricing & Action Button */}
                  <div className="pt-3.5 border-t border-[#14171f]/[0.08] flex items-end justify-between gap-3 mt-auto">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-bold text-[#14171f] tracking-tight font-sans">
                          {item.dailyRate.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs font-semibold text-[#14171f]/80">₫</span>
                        <span className="text-[11px] text-[#6e7587] font-light ml-0.5">/ ngày</span>
                      </div>

                      <div className="text-[11.5px] text-[#62687a] mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#7a8192]">Cọc:</span>
                        {currentTier.discount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="line-through text-[#8e95a6] text-[10.5px]">
                              {item.depositRate.toLocaleString('vi-VN')}₫
                            </span>
                            <span className="text-[#14171f] font-semibold text-[11px]">
                              {discountedDeposit.toLocaleString('vi-VN')}₫
                            </span>
                          </span>
                        ) : (
                          <span className="text-[#3c4252] font-medium whitespace-nowrap">
                            {item.depositRate.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        title="Thêm vào giỏ hàng"
                        aria-label="Thêm vào giỏ hàng"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAddToCart) onAddToCart(item as any);
                        }}
                        className="w-9 h-9 rounded-full bg-[#14171f]/[0.05] hover:bg-[#14171f] text-[#14171f] hover:text-white border border-[#14171f]/10 hover:border-transparent flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      >
                        <ShoppingBag size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item as any);
                        }}
                        className="h-9 px-4 sm:px-5 rounded-full bg-[#14171f] hover:bg-[#252a37] active:scale-95 text-white font-semibold text-xs tracking-wide flex items-center gap-1.5 shadow-[0_4px_14px_rgba(20,24,32,0.18)] hover:shadow-[0_6px_20px_rgba(20,24,32,0.26)] transition-all duration-200 cursor-pointer"
                      >
                        <span>Đặt chỗ</span>
                        <ArrowUpRight size={14} className="stroke-[2.2] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
      </div>

      {/* 
        5. ĐÚNG YÊU CẦU: 1 NÚT "XEM THÊM" Ở DƯỚI 2 HÀNG
        - Bấm vào sẽ mở popup cố định gồm toàn bộ máy và phụ kiện
        - Thay thế thanh home ảnh 2 thành thanh tìm kiếm ảnh 3 ở header
      */}
      <div className="flex flex-col items-center justify-center mt-10 mb-14">
        <button
          type="button"
          onClick={onOpenAllEquipment}
          className="group relative crystal-liquid-glass rytox-hover-lift px-8 sm:px-10 py-4 rounded-full flex items-center gap-3.5 text-sm sm:text-base font-semibold text-[#14171f] hover:text-[#0b0d12] cursor-pointer shadow-md border border-[#14171f]/15 hover:border-[#14171f]/30 active:scale-95 transition-all"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
          <span>Xem thêm toàn bộ máy &amp; phụ kiện</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.06] text-xs font-mono text-[#2c3242] border border-[#14171f]/10">
            {allEquipment.length}+ thiết bị
          </span>
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-1 duration-200 text-[#14171f]/80" />
        </button>
        <span className="text-[12px] text-[#6e7587] mt-2.5 text-center">
          Mở toàn bộ kho máy &amp; phụ kiện kèm thanh tìm kiếm thời gian thực
        </span>
      </div>

    </section>
  );
};
