import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModel, LensModel, AccessoryModel, EquipmentItem } from '../types';
import { X, Heart, ArrowUpRight, Sparkles, Filter, RotateCcw, Search, ShoppingBag } from 'lucide-react';

interface AllEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: EquipmentItem) => void;
  filterParams: {
    category: string;
    mount: string;
    series: string;
    dates: string;
  };
  onFilterChange: (params: {
    category: string;
    mount: string;
    series: string;
    dates: string;
  }) => void;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
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

export const AllEquipmentModal: React.FC<AllEquipmentModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
  filterParams,
  onFilterChange,
  membershipTier = 'BRONZE',
  cameras = [],
  lenses = [],
  accessories = [],
  onAddToCart,
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const getSearchPlaceholder = () => {
    switch (filterParams.category) {
      case 'Thân máy (Body)':
      case 'Máy ảnh':
        return 'Tìm máy ảnh (X-T5, X-H2S, GFX...)...';
      case 'Ống kính (Lens)':
      case 'Ống kính':
        return 'Tìm ống kính (16-55mm, 56mm, F1.4...)...';
      case 'Phụ kiện & Pin':
      case 'Phụ kiện':
        return 'Tìm phụ kiện (W235, flash, grip...)...';
      default:
        return 'Tìm trong tất cả 126 thiết bị & phụ kiện...';
    }
  };

  // Lock body scroll while popup is open without layout shifts or background jumping
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll';

    return () => {
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;

      // Đảm bảo khi đóng modal luôn đứng vững ở vị trí tra cứu lịch (#explore)
      const exploreElem = document.getElementById('explore');
      if (exploreElem) {
        const headerHeight = 84;
        const targetY = Math.max(0, exploreElem.getBoundingClientRect().top + window.pageYOffset - headerHeight);
        window.scrollTo({ top: targetY, behavior: 'instant' });
      } else {
        window.scrollTo(0, scrollY > 0 ? scrollY : 0);
      }
    };
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tierDiscountMap: Record<string, { label: string; discount: number }> = {
    BRONZE: { label: 'Hạng Đồng', discount: 0 },
    SILVER: { label: 'Hạng Bạc', discount: 0.05 },
    GOLD: { label: 'Hạng Vàng', discount: 0.10 },
    PLATINUM: { label: 'Bạch Kim', discount: 0.15 }
  };
  const currentTier = tierDiscountMap[membershipTier] || tierDiscountMap.BRONZE;

  // Toàn bộ thiết bị (Thân máy, Ống kính, Phụ kiện)
  const allEquipment: (EquipmentItem & { type: 'BODY' | 'LENS' | 'ACCESSORY' })[] = [
    ...cameras.map((c) => ({ ...c, type: 'BODY' as const })),
    ...lenses.map((l) => ({ ...l, type: 'LENS' as const })),
    ...accessories.map((a) => ({ ...a, type: 'ACCESSORY' as const })),
  ];

  // Counts by category
  const countAll = allEquipment.length;
  const countBody = allEquipment.filter((i) => i.type === 'BODY').length;
  const countLens = allEquipment.filter((i) => i.type === 'LENS').length;
  const countAcc = allEquipment.filter((i) => i.type === 'ACCESSORY').length;

  // Lọc theo thông số filterParams từ search bar
  const filteredItems = allEquipment.filter((item) => {
    // 1. Lọc theo Phân loại
    if ((filterParams.category === 'Thân máy (Body)' || filterParams.category === 'Máy ảnh') && item.type !== 'BODY') return false;
    if ((filterParams.category === 'Ống kính (Lens)' || filterParams.category === 'Ống kính') && item.type !== 'LENS') return false;
    if ((filterParams.category === 'Phụ kiện & Pin' || filterParams.category === 'Phụ kiện') && item.type !== 'ACCESSORY') return false;

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

    // 4. Lọc theo Ô Tìm Kiếm theo ngữ cảnh tab (không trộn lẫn khi ở tab chuyên biệt)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const normalize = (str: string) => 
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
      const cleanAlphanumeric = (str: string) => normalize(str).replace(/[^a-z0-9]/g, '');

      const normQ = normalize(q);
      const cleanQ = cleanAlphanumeric(q);

      const normName = normalize(item.name);
      const cleanName = cleanAlphanumeric(item.name);

      const matchName = normName.includes(normQ) || (cleanQ.length >= 2 && cleanName.includes(cleanQ));
      const matchBrand = (item.brand || '').toLowerCase().includes(q);

      let matchDetail = false;
      if (item.type === 'BODY') {
        const cam = item as CameraModel;
        const normSeries = normalize(cam.series || '');
        const normSensor = normalize(cam.sensor || '');
        const normDesc = normalize(cam.description || '');
        matchDetail = normSeries.includes(normQ) || normSensor.includes(normQ) || normDesc.includes(normQ);
      } else if (item.type === 'LENS') {
        const lens = item as LensModel;
        const normMount = normalize(lens.mount || '');
        const normFocal = normalize(lens.focalLength || '');
        const normAperture = normalize(lens.aperture || '');
        const normDesc = normalize(lens.description || '');
        matchDetail = normMount.includes(normQ) || normFocal.includes(normQ) || normAperture.includes(normQ) || normDesc.includes(normQ);
      } else if (item.type === 'ACCESSORY') {
        const acc = item as AccessoryModel;
        const normDesc = normalize(acc.description || '');
        const normSpecs = (acc.specs || []).map((s) => normalize(s)).join(' ');
        matchDetail = normDesc.includes(normQ) || normSpecs.includes(normQ);
      }

      if (!matchName && !matchBrand && !matchDetail) {
        return false;
      }
    }

    return true;
  });

  const handleQuickCategory = (cat: string) => {
    onFilterChange({
      ...filterParams,
      category: cat,
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    onFilterChange({
      category: 'Tất cả thiết bị',
      mount: 'Tất cả hệ ngàm',
      series: 'Tất cả dòng máy',
      dates: filterParams.dates,
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-40 bg-[#f7f8fa]/94 backdrop-blur-2xl overflow-y-auto selection:bg-[#14171f]/10 text-[#14171f]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >

      {/* Vùng nội dung danh mục thiết bị (Cách mép trên 128px để chừa không gian thoáng cho Search Bar ở Top Bar) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 16 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="w-full max-w-6xl mx-auto px-4 sm:px-8 pt-32 sm:pt-36 pb-24"
      >
        {/* Header Thông Tin Popup */}
        <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#14171f]/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
              <span>Kho Thiết Bị Toàn Diện REFUJI</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#14171f] tracking-tight">
              Toàn Bộ Thân Máy, Ống Kính &amp; Phụ Kiện
            </h2>
            <p className="text-xs sm:text-sm text-[#525868] font-light mt-1.5">
              Tìm thấy <strong className="text-[#14171f] font-semibold">{filteredItems.length}</strong> thiết bị khả dụng theo bộ lọc hiện tại.
              Khóa giữ chỗ độc quyền 15 phút.
            </p>
          </div>

          {/* Nút đặt lại bộ lọc nếu đang áp dụng lọc */}
          {(filterParams.category !== 'Tất cả thiết bị' || 
            filterParams.mount !== 'Tất cả hệ ngàm' || 
            filterParams.series !== 'Tất cả dòng máy' ||
            searchQuery.trim() !== '') && (
            <button
              onClick={handleResetFilters}
              className="crystal-liquid-glass rytox-hover-lift inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-[#2c3240] hover:text-[#0b0d12] border border-[#14171f]/15 hover:border-[#14171f]/30 active:scale-95 transition-all self-center sm:self-auto cursor-pointer shadow-sm group"
            >
              <RotateCcw size={13} className="text-[#3c4252] group-hover:text-[#14171f] group-hover:-rotate-45 transition-all duration-300" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Thanh Phân Loại Nhanh (Category Quick Filter Tabs) & Ô Tìm Kiếm Bên Phải */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          {/* Nhóm Tabs Phân Loại */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'Tất cả thiết bị', label: 'Tất cả', count: countAll },
              { id: 'Thân máy (Body)', label: 'Máy ảnh', count: countBody },
              { id: 'Ống kính (Lens)', label: 'Ống kính', count: countLens },
              { id: 'Phụ kiện & Pin', label: 'Phụ kiện', count: countAcc },
            ].map((tab) => {
              const isTabActive = filterParams.category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleQuickCategory(tab.id)}
                  className={`relative px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                    isTabActive
                      ? 'text-[#14171f]'
                      : 'text-[#62687a] hover:text-[#14171f] hover:bg-[#14171f]/[0.04]'
                  }`}
                >
                  {isTabActive && (
                    <motion.div
                      layoutId="modal-category-chip-active"
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32,
                        mass: 0.8,
                      }}
                      className="absolute inset-0 rounded-full -z-10 crystal-liquid-lens"
                    />
                  )}
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isTabActive ? 'bg-[#14171f]/12 text-[#14171f] font-bold' : 'bg-[#14171f]/[0.05] text-[#62687a]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ô Tìm Kiếm Bên Phải (Trong suốt đồng bộ như thanh tab Tất cả, Thân máy) */}
          <div className="relative w-full md:w-80 flex-shrink-0">
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-3.5 text-[#424858] pointer-events-none stroke-[2]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getSearchPlaceholder()}
                className="w-full pl-9 pr-8 py-2 rounded-full crystal-liquid-lens text-xs font-medium text-[#14171f] placeholder:text-[#62687a]/80 focus:outline-none transition-all cursor-text"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2.5 p-1 rounded-full text-[#424858] hover:text-[#14171f] hover:bg-[#14171f]/10 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lưới Toàn Bộ Thiết Bị */}
        {filteredItems.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-12 text-center border border-[#14171f]/10 my-8 shadow-sm">
            <Filter size={36} className="text-[#8e95a6] mx-auto mb-3" />
            <h3 className="text-base sm:text-lg text-[#14171f] font-medium mb-1">
              Không có thiết bị phù hợp với bộ lọc
            </h3>
            <p className="text-xs text-[#525868] max-w-md mx-auto mb-5">
              {searchQuery.trim() ? (
                <>
                  Không có thiết bị nào khớp với từ khóa <strong className="text-[#14171f]">&quot;{searchQuery}&quot;</strong> trong mục <strong className="text-[#14171f]">{filterParams.category}</strong>.
                </>
              ) : (
                'Vui lòng thử chọn phân loại, hệ ngàm hoặc dòng máy khác trên thanh tìm kiếm phía trên.'
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-full bg-white border border-[#14171f]/15 text-[#14171f] font-semibold text-xs hover:bg-[#14171f]/5 transition-all cursor-pointer shadow-sm"
                >
                  Xóa từ khóa &quot;{searchQuery}&quot;
                </button>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-full bg-[#14171f] text-white font-semibold text-xs hover:bg-[#252a37] transition-all cursor-pointer shadow-md"
              >
                Hiện tất cả thiết bị ({countAll})
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => {
              const discountedDeposit = Math.round(item.depositRate * (1 - currentTier.discount));
              const isLowStock = item.availableCount === 1;
              const isFav = favorites.has(item.id);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(idx * 0.02, 0.25), ease: [0.16, 1, 0.3, 1] }}
                  className="relative liquid-glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 group cursor-pointer"
                  onClick={() => {
                    onSelectItem(item);
                  }}
                >
                  <div>
                    {/* Badge & Wishlist Heart */}
                    <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                      <span className="px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/[0.08] backdrop-blur-md text-[10.5px] font-medium tracking-wider text-[#3c4252] uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/70" />
                        {item.highlightBadge || (item.type === 'BODY' ? 'Máy ảnh' : item.type === 'LENS' ? 'Ống kính' : 'Phụ kiện')}
                      </span>

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
                    <h4 className="text-base sm:text-[17px] font-semibold text-[#14171f] tracking-tight mb-2 line-clamp-1 group-hover:text-[#2d3342] transition-colors">
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
                          if (onAddToCart) onAddToCart(item);
                        }}
                        className="w-9 h-9 rounded-full bg-[#14171f]/[0.05] hover:bg-[#14171f] text-[#14171f] hover:text-white border border-[#14171f]/10 hover:border-transparent flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      >
                        <ShoppingBag size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
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
        )}
      </motion.div>
    </motion.div>
  );
};
