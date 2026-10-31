import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  X, 
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
  const [isPaused, setIsPaused] = useState(false); // Mặc định tự động di chuyển
  const [isViewPhotoOnly, setIsViewPhotoOnly] = useState(false); // Chế độ "Xem ảnh" ẩn toàn bộ popup
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const animIdRef = useRef<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Giữ lại đúng 4 máy hot nhất
  const hotCameras = (cameras || []).slice(0, 4);
  const activeCam = hotCameras[currentIndex] || hotCameras[0];
  const comboGuide = activeCam ? findRecommendedComboForCamera(activeCam.name) : { recommendedLensNames: [] };
  const galleryImages = activeCam ? getCameraGallery(activeCam.name) : [];

  // Reset khi chuyển đổi camera
  useEffect(() => {
    setActivePhotoIndex(0);
    posRef.current = 0;
    if (trackRef.current) {
      trackRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
    setIsPaused(false); // Bắt đầu chạy lại khi đổi máy
  }, [currentIndex, activeCam?.id]);

  // Vòng lặp RequestAnimationFrame: Di chuyển chậm và mượt mà, mặc định tự động trượt
  useEffect(() => {
    if (isPaused) {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      return;
    }

    let lastTime = performance.now();
    const speed = 20; // 20px mỗi giây: tốc độ chậm rãi, êm ái và sang trọng

    const step = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      posRef.current += speed * delta;

      if (trackRef.current) {
        // Vòng lặp vô tận tại 1/3 tổng chiều dài track (track lặp 3 chu kỳ)
        const oneSetWidth = trackRef.current.scrollWidth / 3;
        if (oneSetWidth > 0 && posRef.current >= oneSetWidth) {
          posRef.current -= oneSetWidth;
        }
        trackRef.current.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
      }

      animIdRef.current = requestAnimationFrame(step);
    };

    animIdRef.current = requestAnimationFrame(step);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [isPaused, galleryImages]);

  // Chọn ảnh cụ thể: Căn giữa ảnh đó và tự động ĐỨNG YÊN cho người xem
  const handleSelectPhoto = useCallback((idx: number) => {
    setActivePhotoIndex(idx);
    setIsPaused(true); // Tự đứng yên cho người xem theo yêu cầu

    const el = itemRefs.current[idx];
    if (el && trackRef.current) {
      const elLeft = el.offsetLeft;
      const centerOffset = (window.innerWidth - el.offsetWidth) / 2;
      const targetPos = Math.max(0, elLeft - Math.max(0, centerOffset));
      posRef.current = targetPos;
      trackRef.current.style.transform = `translate3d(-${targetPos}px, 0, 0)`;
    }
  }, []);

  // Chuyển ảnh kế tiếp hoặc quay lại (giữ trạng thái đứng yên)
  const handlePrevPhoto = () => {
    const prevIdx = (activePhotoIndex === 0 ? galleryImages.length - 1 : activePhotoIndex - 1);
    handleSelectPhoto(prevIdx);
  };

  const handleNextPhoto = () => {
    const nextIdx = (activePhotoIndex === galleryImages.length - 1 ? 0 : activePhotoIndex + 1);
    handleSelectPhoto(nextIdx);
  };

  // Nút Chạy tiếp (tiếp tục cuộn tự động)
  const handleResumeSlide = () => {
    setIsPaused(false);
  };

  const handlePrevCamera = () => {
    setCurrentIndex((prev) => (prev === 0 ? hotCameras.length - 1 : prev - 1));
  };

  const handleNextCamera = () => {
    setCurrentIndex((prev) => (prev === hotCameras.length - 1 ? 0 : prev + 1));
  };

  if (!cameras || cameras.length === 0 || !activeCam) return null;

  return (
    <section 
      id="cameras" 
      className="relative w-full min-h-[calc(100vh-84px)] scroll-mt-[84px] select-none flex flex-col justify-center items-center py-6 sm:py-8 lg:py-10 overflow-hidden"
    >
      {/* 
        ========================================================================
        1. BACKGROUND: FUJIFILM OFFICIAL LOOP SLIDER
        - Cuộn ngang chậm rãi ở phía đằng sau
        - Khi bấm "Xem ảnh": Lớp màng mờ bị ẩn đi hoàn toàn, ảnh sắc nét 100%
        ========================================================================
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto bg-[#14171f]">
        <div className="w-full h-full overflow-hidden flex items-center">
          <div 
            ref={trackRef}
            className="fuji-bg-loop-slider__track"
          >
            {/* 3 lần lặp để đảm bảo trượt mượt mà vô tận không giật */}
            {[0, 1, 2].map((loopIndex) => (
              <React.Fragment key={`loop-${loopIndex}`}>
                {galleryImages.map((img, idx) => (
                  <div 
                    key={`slide-${loopIndex}-${img.id}-${idx}`}
                    ref={(el) => {
                      if (loopIndex === 0) itemRefs.current[idx] = el;
                    }}
                    className={`fuji-bg-loop-slider__item group relative cursor-pointer transition-all duration-300 ${
                      activePhotoIndex === idx && isPaused ? 'ring-2 ring-white/50' : ''
                    }`}
                    onClick={() => handleSelectPhoto(idx)}
                  >
                    <img 
                      src={img.url} 
                      alt={img.alt} 
                      className="h-full w-auto min-w-[280px] sm:min-w-[340px] md:min-w-[420px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      loading={loopIndex === 0 ? 'eager' : 'lazy'}
                    />
                    {/* Caption góc ảnh khi hover */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <span className="liquid-glass px-3 py-1.5 rounded-full text-[11px] font-medium text-[#14171f] shadow-md inline-block">
                        {img.caption || img.alt}
                      </span>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 
          Lớp màng Frosted Veil: 
          - Bình thường: Giữ màu nền thanh lịch và tương phản cho chữ ở foreground
          - Khi "Xem ảnh": Ẩn hoàn toàn (opacity-0), ảnh rõ nét 100% nguyên bản
        */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
            isViewPhotoOnly 
              ? 'opacity-0' 
              : 'opacity-100 bg-gradient-to-r from-white/95 via-white/88 to-white/75 backdrop-blur-[1.5px]'
          }`} 
        />

        {/* Nút "Xem ảnh" ở góc trên bên phải (Thay văn bản thành Xem ảnh theo yêu cầu) */}
        <div className="absolute top-4 right-6 z-40 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsViewPhotoOnly(!isViewPhotoOnly)}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer ${
              isViewPhotoOnly 
                ? 'bg-[#14171f] text-white hover:bg-[#282e3c] border border-white/20' 
                : 'liquid-glass text-[#14171f] hover:bg-neutral-50 border border-[#14171f]/15'
            }`}
            title={isViewPhotoOnly ? 'Đóng chế độ xem ảnh để hiện lại thông tin' : 'Xem rõ bộ ảnh nền Fujifilm và ẩn popup'}
          >
            {isViewPhotoOnly ? <X size={14} /> : <Eye size={14} />}
            <span>{isViewPhotoOnly ? 'Đóng xem ảnh' : 'Xem ảnh'}</span>
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        2. FOREGROUND THƯỜNG (ẨN ĐI KHI BẤM "XEM ẢNH")
        ========================================================================
      */}
      <div className={`relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 transition-all duration-400 ${
        isViewPhotoOnly ? 'opacity-0 pointer-events-none translate-y-6 hidden lg:hidden' : 'opacity-100'
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
          
          {/* Cột trái: Thân máy ảnh trên bục kính */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
              {/* Khung viền lệch 1px than tre */}
              <div className="absolute -top-3.5 -left-3.5 w-full h-full border border-[#14171f]/20 pointer-events-none z-0 transition-transform duration-500 hover:translate-x-1 hover:translate-y-1 rounded-2xl" />

              {/* Bục chụp ảnh sản phẩm nền trắng tinh khôi */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(20,24,32,0.1)] bg-white border border-[#14171f]/10 aspect-[4/3] flex items-center justify-center">
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

              {/* 
                THANH CHỌN ẢNH THUMBNAIL (ẢNH 3):
                - Bấm vào từng ảnh: Tự đứng yên cho người xem
                - Thêm nút "Chạy tiếp" khi đang đứng yên để tiếp tục tự động cuộn
              */}
              <div className="flex items-center justify-between gap-2 mt-4 z-10 relative">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                  {galleryImages.map((gImg, gIdx) => {
                    const isSelected = activePhotoIndex === gIdx && isPaused;
                    return (
                      <button
                        key={gImg.id}
                        onClick={() => handleSelectPhoto(gIdx)}
                        className={`relative w-11 h-11 rounded-lg overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                          isSelected 
                            ? 'border-[#14171f] ring-2 ring-[#14171f] scale-105 shadow-md' 
                            : 'border-transparent opacity-75 hover:opacity-100 hover:scale-102'
                        }`}
                        title={gImg.caption || `Xem ảnh ${gIdx + 1}`}
                      >
                        <img src={gImg.url} alt={gImg.alt} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>

                {/* Các nút điều khiển: Lùi/Tiến ảnh & Nút Chạy tiếp khi đứng yên */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={handleResumeSlide}
                      className="h-8 px-2.5 rounded-full bg-[#14171f] text-white hover:bg-[#282e3c] text-[11px] font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                      title="Tiếp tục tự động cuộn ảnh"
                    >
                      <Play size={11} fill="currentColor" />
                      <span>Chạy tiếp</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPaused(true)}
                      className="glass-button w-8 h-8 rounded-full flex items-center justify-center text-[#14171f] active:scale-90"
                      title="Tạm dừng cuộn ảnh"
                    >
                      <Pause size={13} />
                    </button>
                  )}

                  <button 
                    onClick={handlePrevPhoto}
                    className="glass-button w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                    aria-label="Ảnh trước"
                    title="Ảnh trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextPhoto}
                    className="glass-button w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                    aria-label="Ảnh tiếp theo"
                    title="Ảnh tiếp theo"
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

      {/* 
        ========================================================================
        3. DOCK CHỌN ẢNH NỔI DÀNH RIÊNG CHO CHẾ ĐỘ "XEM ẢNH":
        - Hiện khi bấm "Xem ảnh": Vẫn giữ thanh chọn ảnh như ảnh 3
        - Kèm nút "Chạy tiếp", nút chuyển dòng máy, và các thumbnail ảnh
        ========================================================================
      */}
      <AnimatePresence>
        {isViewPhotoOnly && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] liquid-glass p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-[#14171f]/15 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          >
            {/* 4 Nút đổi nhanh dòng máy */}
            <div className="flex items-center gap-1">
              {hotCameras.map((cam, idx) => (
                <button
                  key={cam.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                    idx === currentIndex 
                      ? 'bg-[#14171f] text-white shadow-xs' 
                      : 'text-[#525868] hover:text-[#14171f] hover:bg-[#14171f]/5'
                  }`}
                >
                  {cam.name.replace('FUJIFILM ', '')}
                </button>
              ))}
            </div>

            <div className="hidden sm:block w-[1px] h-6 bg-[#14171f]/15" />

            {/* Thanh thumbnail ảnh (Ảnh 3) */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
              {galleryImages.map((gImg, gIdx) => {
                const isSelected = activePhotoIndex === gIdx && isPaused;
                return (
                  <button
                    key={gImg.id}
                    onClick={() => handleSelectPhoto(gIdx)}
                    className={`relative w-10 h-10 rounded-lg overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                      isSelected 
                        ? 'border-[#14171f] ring-2 ring-[#14171f] scale-105 shadow-md' 
                        : 'border-transparent opacity-75 hover:opacity-100 hover:scale-102'
                    }`}
                    title={gImg.caption || `Xem ảnh ${gIdx + 1}`}
                  >
                    <img src={gImg.url} alt={gImg.alt} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:block w-[1px] h-6 bg-[#14171f]/15" />

            {/* Các nút điều khiển: Chạy tiếp, Lùi / Tiến */}
            <div className="flex items-center gap-1.5">
              {isPaused ? (
                <button
                  type="button"
                  onClick={handleResumeSlide}
                  className="h-8 px-3 rounded-full bg-[#14171f] text-white hover:bg-[#282e3c] text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Chạy tiếp</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPaused(true)}
                  className="h-8 px-3 rounded-full bg-white hover:bg-neutral-50 text-[#14171f] border border-[#14171f]/15 text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Pause size={12} />
                  <span>Tạm dừng</span>
                </button>
              )}

              <button 
                onClick={handlePrevPhoto}
                className="glass-button w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                aria-label="Ảnh trước"
                title="Ảnh trước"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextPhoto}
                className="glass-button w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                aria-label="Ảnh tiếp theo"
                title="Ảnh tiếp theo"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Caption ảnh nhỏ gọn */}
            {galleryImages[activePhotoIndex]?.caption && (
              <span className="hidden md:inline-block px-3 py-1 rounded-full bg-[#14171f]/[0.04] text-[11px] font-medium text-[#383e4e]">
                {galleryImages[activePhotoIndex].caption}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};
