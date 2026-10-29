import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModel } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';

interface FeaturedCameraProps {
  cameras: CameraModel[];
  onSelectCamera: (cam: CameraModel) => void;
}

export const FeaturedCamera: React.FC<FeaturedCameraProps> = ({ cameras, onSelectCamera }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeCam = cameras[currentIndex] || cameras[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cameras.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cameras.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="cameras" className="relative w-full max-w-6xl mx-auto px-6 sm:px-8 py-16 lg:py-20 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Offset 1px Frame Camera Showcase */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[360px] sm:max-w-[400px]">
            {/* Offset 1px White Frame from Figma */}
            <div className="absolute -top-4 -left-4 w-full h-full border border-white/40 pointer-events-none z-0 transition-transform duration-500 hover:translate-x-1 hover:translate-y-1" />

            {/* Inner Card & Photo with Rytox Spring Crossfade */}
            <div className="relative z-10 rounded-sm overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.8)] bg-[#121722] border border-white/10 aspect-[4/3] flex items-center justify-center">
              {/* Badge */}
              <div className="absolute top-3 left-3 z-20 liquid-glass px-3 py-1.5 rounded text-[10px] font-semibold text-white tracking-wide shadow-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 radar-pulse-green" />
                <span>{activeCam.highlightBadge || 'Được thuê nhiều nhất'}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeCam.id}
                  src={activeCam.image} 
                  alt={activeCam.name} 
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="max-h-full max-w-full object-contain p-4 hover:scale-105 transition-transform duration-500"
                />
              </AnimatePresence>
            </div>

            {/* Carousel Controls `< ••• >` */}
            <div className="flex items-center justify-center gap-3 mt-5 z-10 relative">
              <div className="flex items-center gap-2 mr-3">
                {cameras.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`transition-all rounded-full cursor-pointer ${
                      idx === currentIndex ? 'w-2.5 h-2.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button 
                onClick={handlePrev}
                className="glass-button w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                aria-label="Previous camera"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNext}
                className="glass-button w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                aria-label="Next camera"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Typography & System Specs with Rytox Entrance */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCam.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {/* Badge */}
              <span className="inline-block liquid-glass px-3.5 py-1.5 rounded text-[11px] font-semibold tracking-[0.16em] uppercase text-white/90 mb-4 shadow-sm">
                Thiết Bị Xu Hướng
              </span>

              {/* Title */}
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] text-white mb-4">
                {activeCam.name}{' '}
                <span className="italic font-light text-white/80">
                  {activeCam.tagline}
                </span>
              </h2>

              {/* Thin Divider Line from Figma */}
              <div className="w-full h-[1px] bg-white/20 mb-5" />

              {/* Description */}
              <p className="text-sm sm:text-base leading-relaxed text-white/70 font-light mb-6 max-w-xl">
                {activeCam.description}
              </p>

              {/* System Specs & Availability Callout */}
              <div className="w-full liquid-glass border-l-4 border-l-white/60 p-4 sm:p-5 rounded-r-xl mb-6 text-xs sm:text-sm text-white/85 shadow-lg rytox-hover-lift">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-2">
                  <span><strong>Giá thuê:</strong> {activeCam.dailyRate.toLocaleString('vi-VN')}₫ / ngày</span>
                  <span className="text-white/30">•</span>
                  <span><strong>Cọc tiêu chuẩn:</strong> {activeCam.depositRate.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 size={15} />
                  <span>
                    {activeCam.availableCount === 1 
                      ? 'Chỉ còn 1 máy cuối (Sẵn sàng nhận trực tiếp tại cửa hàng)' 
                      : 'Thiết bị sẵn sàng bàn giao trực tiếp tại cửa hàng'}
                  </span>
                </div>
              </div>

              {/* Action Link with Spring Hover */}
              <button 
                onClick={() => onSelectCamera(activeCam)}
                className="group inline-flex items-center gap-2 text-sm sm:text-base font-medium text-white hover:text-white/80 underline underline-offset-8 tracking-wide transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Đặt lịch giữ máy</span>
                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-200" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
