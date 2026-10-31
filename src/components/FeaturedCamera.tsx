import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModel } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight, 
  ShoppingBag, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Play, 
  Pause 
} from 'lucide-react';
import { findRecommendedComboForCamera } from '../data/travelCombos';
import { getCameraGallery, CameraGalleryImage } from '../data/cameraGalleries';

interface FeaturedCameraProps {
  cameras: CameraModel[];
  onSelectCamera: (cam: CameraModel) => void;
  onAddToCart?: (cam: CameraModel) => void;
}

export const FeaturedCamera: React.FC<FeaturedCameraProps> = ({ cameras, onSelectCamera, onAddToCart }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Reset active photo index khi đổi camera
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [currentIndex]);

  if (!cameras || cameras.length === 0) return null;

  // Giữ lại đúng 4 máy hot nhất
  const hotCameras = cameras.slice(0, 4);
  const activeCam = hotCameras[currentIndex] || hotCameras[0];
  const comboGuide = findRecommendedComboForCamera(activeCam.name);

  // Lấy bộ ảnh trải nghiệm chính hãng Fujifilm tương ứng với máy đang chọn
  const galleryImages = getCameraGallery(activeCam.name);

  const handlePrevCamera = () => {
    setCurrentIndex((prev) => (prev === 0 ? hotCameras.length - 1 : prev - 1));
  };

  const handleNextCamera = () => {
    setCurrentIndex((prev) => (prev === hotCameras.length - 1 ? 0 : prev + 1));
  };

  // Cuộn thanh trượt background ảnh chính hãng Fujifilm
  const scrollGallery = (direction: 'left' | 'right') => {
    if (sliderTrackRef.current) {
      const scrollAmount = 420;
      sliderTrackRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section 
      id="cameras" 
      className="relative w-full min-h-[calc(100vh-84px)] scroll-mt-[84px] select-none flex flex-col justify-center items-center py-6 sm:py-8 lg:py-10 overflow-hidden"
    >
      {/* 
        ========================================================================
        1. BACKGROUND: FUJIFILM OFFICIAL LOOP SLIDER ("Ảnh cuộn sang nằm ở đằng sau")
        - Phong cách chuẩn top-device_loopSlider từ fujifilm-x.com/vi-vn/products/cameras/x100vi/
        - Các ảnh đời thực / góc máy chi tiết đặt liền kề nhau tràn toàn màn hình
        - Khi chuyển máy khác (X-T50, X-T5, X-S20), tự động chuyển sang bộ ảnh chính hãng tương ứng
        ========================================================================
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto bg-[#fafafa]">
        {/* Track trượt ảnh chính hãng có thể cuộn ngang hoặc tự động chạy mượt mà */}
        <div 
          ref={sliderTrackRef}
          className="w-full h-full overflow-x-auto scrollbar-none flex items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className={`flex items-stretch h-full w-max ${
              !isPaused ? 'fuji-slider-running' : 'fuji-slider-paused'
            }`}
          >
            {/* Vòng lặp ảnh 1 */}
            {galleryImages.map((img, idx) => (
              <div 
                key={`slide-1-${img.id}-${idx}`}
                className="fuji-bg-loop-slider__item group relative cursor-pointer"
                onClick={() => setActivePhotoIndex(idx)}
              >
                <img 
                  src={img.url} 
                  alt={img.alt} 
                  className="h-full w-auto min-w-[280px] sm:min-w-[340px] md:min-w-[380px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="eager"
                />
                {/* Caption nhỏ góc ảnh chuẩn catalog Fujifilm */}
                <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="liquid-glass px-3 py-1.5 rounded-full text-[11px] font-medium text-[#14171f] shadow-md inline-block">
                    {img.caption || img.alt}
                  </span>
                </div>
              </div>
            ))}

            {/* Vòng lặp ảnh 2 (đảm bảo vô tận không đứt đoạn) */}
            {galleryImages.map((img, idx) => (
              <div 
                key={`slide-2-${img.id}-${idx}`}
                className="fuji-bg-loop-slider__item group relative cursor-pointer"
                onClick={() => setActivePhotoIndex(idx)}
              >
                <img 
                  src={img.url} 
                  alt={img.alt} 
                  className="h-full w-auto min-w-[280px] sm:min-w-[340px] md:min-w-[380px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="liquid-glass px-3 py-1.5 rounded-full text-[11px] font-medium text-[#14171f] shadow-md inline-block">
                    {img.caption || img.alt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lớp màng mờ Frosted Veil: Tạo chiều sâu sang trọng, giữ độ tương phản cao cho chữ và thẻ */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
            showFullGallery 
              ? 'bg-white/20 backdrop-blur-[0.5px]' 
              : 'bg-gradient-to-r from-white/95 via-white/88 to-white/75 backdrop-blur-[1.5px]'
          }`} 
        />

        {/* Nút điều khiển thanh trượt ảnh background ở góc trên bên phải */}
        <div className="absolute top-4 right-6 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowFullGallery(!showFullGallery)}
            className="liquid-glass px-3 py-1.5 rounded-full text-xs font-semibold text-[#14171f] flex items-center gap-1.5 hover:bg-neutral-50 active:scale-95 transition-all shadow-sm cursor-pointer"
            title={showFullGallery ? 'Hiện thông tin chi tiết' : 'Xem rõ bộ ảnh nền Fujifilm'}
          >
            {showFullGallery ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showFullGallery ? 'Hiện thông tin' : 'Chiêm ngưỡng ảnh nền'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-[#14171f] hover:bg-neutral-50 active:scale-90 transition-all shadow-sm cursor-pointer"
            title={isPaused ? 'Tiếp tục cuộn' : 'Tạm dừng cuộn'}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>

          <button
            type="button"
            onClick={() => scrollGallery('left')}
            className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-[#14171f] hover:bg-neutral-50 active:scale-90 transition-all shadow-sm cursor-pointer"
            aria-label="Cuộn ảnh sang trái"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            onClick={() => scrollGallery('right')}
            className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-[#14171f] hover:bg-neutral-50 active:scale-90 transition-all shadow-sm cursor-pointer"
            aria-label="Cuộn ảnh sang phải"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        2. FOREGROUND: THANH CHỌN 4 MÁY HOT NHẤT & NỘI DUNG CHÍNH (NẰM PHÍA TRƯỚC)
        ========================================================================
      */}
      <div className={`relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 transition-opacity duration-300 ${
        showFullGallery ? 'opacity-20 pointer-events-none' : 'opacity-100'
      }`}>

        {/* Thanh chuyển đổi nhanh đúng 4 máy hot nhất */}
        <div className="flex items-center justify-center mb-6">
          <div className="liquid-glass p-1.5 rounded-full flex flex-wrap items-center justify-center gap-1.5 shadow-md max-w-full">
            {hotCameras.map((cam, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={cam.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#14171f] text-white shadow-md scale-[1.02]'
                      : 'text-[#525868] hover:text-[#14171f] hover:bg-[#14171f]/[0.05] active:scale-95'
                  }`}
                >
                  <span>{cam.name.replace('FUJIFILM ', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung nội dung 2 cột: Ảnh thân máy & Thông số chi tiết */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Cột trái: Thân máy ảnh trên bục kính và khung viền than tre 1px */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
              {/* Khung viền lệch 1px than tre tinh tế */}
              <div className="absolute -top-3.5 -left-3.5 w-full h-full border border-[#14171f]/20 pointer-events-none z-0 transition-transform duration-500 hover:translate-x-1 hover:translate-y-1 rounded-2xl" />

              {/* Bục chụp ảnh sản phẩm nền trắng tinh khôi */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(20,24,32,0.1)] bg-white border border-[#14171f]/10 aspect-[4/3] flex items-center justify-center">
                {/* Badge góc trên */}
                <div className="absolute top-3 left-3 z-20 liquid-glass px-3 py-1.5 rounded-full text-[10px] font-semibold text-[#14171f] tracking-wide shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
                  <span>{activeCam.highlightBadge || 'Được thuê nhiều nhất'}</span>
                </div>

                <motion.img 
                  key={activeCam.id}
                  src={activeCam.image} 
                  alt={activeCam.name} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="max-h-full max-w-full object-contain p-4 product-stage-img hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Dải ảnh thumbnail nhỏ từ bộ ảnh chính hãng Fujifilm phía sau */}
              <div className="flex items-center justify-between gap-2 mt-4 z-10 relative">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {galleryImages.slice(0, 5).map((gImg, gIdx) => (
                    <button
                      key={gImg.id}
                      onClick={() => setActivePhotoIndex(gIdx)}
                      className={`relative w-10 h-10 rounded-lg overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                        activePhotoIndex === gIdx 
                          ? 'border-[#14171f] ring-2 ring-[#14171f]/20 scale-105' 
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={gImg.caption}
                    >
                      <img src={gImg.url} alt={gImg.alt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Nút lùi/tiến 4 máy Hot */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button 
                    onClick={handlePrevCamera}
                    className="glass-button w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                    aria-label="Máy ảnh trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextCamera}
                    className="glass-button w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                    aria-label="Máy ảnh tiếp theo"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin biên tập, giá thuê, combo lens khuyên dùng & Đặt lịch */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCam.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full liquid-glass rounded-3xl p-6 sm:p-7 md:p-8 border border-[#14171f]/10 shadow-[0_16px_40px_rgba(20,24,32,0.06)]"
              >
                {/* Badge phân loại */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.14em] uppercase text-[#343a4a] bg-[#14171f]/[0.05] border border-[#14171f]/10">
                    Thiết Bị Xu Hướng • Top 4 Hot
                  </span>
                  <span className="text-xs text-[#525868] font-medium">
                    {currentIndex + 1} / {hotCameras.length}
                  </span>
                </div>

                {/* Tiêu đề & Tagline */}
                <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-normal leading-[1.14] text-[#14171f] mb-3">
                  {activeCam.name}{' '}
                  <span className="italic font-light text-[#525868] text-xl sm:text-2xl lg:text-3xl block sm:inline">
                    {activeCam.tagline}
                  </span>
                </h2>

                {/* Đường phân cách */}
                <div className="w-full h-[1px] bg-[#14171f]/10 mb-4" />

                {/* Mô tả chi tiết từ hãng */}
                <p className="text-xs sm:text-sm leading-relaxed text-[#525868] font-light mb-4 line-clamp-3">
                  {activeCam.description}
                </p>

                {/* Giá thuê & Tình trạng thiết bị */}
                <div className="w-full bg-[#14171f]/[0.025] border-l-3 border-l-[#14171f] p-3.5 sm:p-4 rounded-r-xl mb-4 text-xs sm:text-sm text-[#383e4e]">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1.5">
                    <span><strong>Giá thuê:</strong> {activeCam.dailyRate.toLocaleString('vi-VN')}₫ / ngày</span>
                    <span className="text-[#14171f]/20">•</span>
                    <span><strong>Cọc tiêu chuẩn:</strong> {activeCam.depositRate.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#14171f] font-medium text-xs">
                    <CheckCircle2 size={14} className="text-[#14171f]" />
                    <span>
                      {activeCam.availableCount === 1 
                        ? 'Chỉ còn 1 máy cuối (Sẵn sàng nhận ngay tại cửa hàng)' 
                        : 'Sẵn sàng bàn giao trực tiếp tại cửa hàng'}
                    </span>
                  </div>
                </div>

                {/* Gợi ý combo lens du lịch đi kèm cho dòng máy này */}
                {comboGuide.recommendedLensNames.length > 0 && (
                  <div className="mb-5 p-3 rounded-xl bg-white border border-[#14171f]/10">
                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-[#14171f]">
                      <Sparkles size={13} className="text-amber-600" />
                      <span>Combo Lens Du Lịch Khuyên Dùng Cho Dòng Máy Này:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {comboGuide.recommendedLensNames.map((lensName, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.04] text-[11px] font-medium text-[#383e4e]"
                        >
                          {lensName.replace('FUJINON ', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nút hành động */}
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => onSelectCamera(activeCam)}
                    className="h-10 sm:h-11 px-6 rounded-full bg-[#14171f] text-white hover:bg-[#282e3c] font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_16px_rgba(20,24,32,0.18)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Đặt lịch giữ máy</span>
                    <ArrowRight size={15} />
                  </button>

                  {onAddToCart && (
                    <button
                      type="button"
                      onClick={() => onAddToCart(activeCam)}
                      className="h-10 sm:h-11 px-5 rounded-full bg-white hover:bg-neutral-50 text-[#14171f] border border-[#14171f]/15 hover:border-[#14171f]/30 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs"
                    >
                      <ShoppingBag size={15} />
                      <span>Thêm vào giỏ</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
};
