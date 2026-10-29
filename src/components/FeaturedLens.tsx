import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LensModel } from '../types';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface FeaturedLensProps {
  lenses: LensModel[];
  onSelectLens: (lens: LensModel) => void;
}

export const FeaturedLens: React.FC<FeaturedLensProps> = ({ lenses, onSelectLens }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeLens = lenses[currentIndex] || lenses[0];

  return (
    <section id="lenses" className="relative w-full max-w-6xl mx-auto px-6 sm:px-8 py-16 lg:py-20 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column (Content & Action) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left order-2 lg:order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeLens.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {/* Badge */}
              <span className="inline-block liquid-glass px-3.5 py-1.5 rounded text-[11px] font-semibold tracking-[0.16em] uppercase text-white/90 mb-4 shadow-sm">
                {activeLens.highlightBadge || 'Ống Kính Được Yêu Thích'}
              </span>

              {/* Title */}
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] text-white mb-4">
                {activeLens.name}
              </h2>

              {/* Thin Divider Line from Figma */}
              <div className="w-full h-[1px] bg-white/20 mb-5" />

              {/* Description */}
              <p className="text-sm sm:text-base leading-relaxed text-white/70 font-light mb-6 max-w-xl">
                {activeLens.description}
              </p>

              {/* Specs & Pricing */}
              <div className="w-full liquid-glass border-l-4 border-l-white/60 p-4 sm:p-5 rounded-r-xl mb-6 text-xs sm:text-sm text-white/85 shadow-lg rytox-hover-lift">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-2">
                  <span><strong>Giá thuê:</strong> {activeLens.dailyRate.toLocaleString('vi-VN')}₫ / ngày</span>
                  <span className="text-white/30">•</span>
                  <span><strong>Cọc tiêu chuẩn:</strong> {activeLens.depositRate.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 size={15} />
                  <span>
                    {activeLens.availableCount === 1 
                      ? 'Chỉ còn 1 ống kính cuối (Sẵn sàng giao ngay)' 
                      : 'Ống kính sẵn sàng bàn giao trực tiếp tại cửa hàng'}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Lens Selector Pills */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {lenses.map((lens, idx) => (
              <button
                key={lens.id}
                onClick={() => setCurrentIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-medium transition-all cursor-pointer ${
                  idx === currentIndex 
                    ? 'liquid-glass border-white/50 text-white shadow-md font-bold scale-[1.03]' 
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 active:scale-95'
                }`}
              >
                {lens.focalLength.split(' ')[0]} {lens.aperture.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Solid White Button from Figma with Rytox Click Feel */}
          <button 
            onClick={() => onSelectLens(activeLens)}
            className="bg-white hover:bg-white/90 text-[#0B0F17] font-semibold text-xs sm:text-sm px-8 py-3.5 sm:py-4 rounded-xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Xem thông số &amp; Lịch trống
          </button>
        </div>

        {/* Right Column: Offset 1px Frame Lens Photo */}
        <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2">
          <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
            {/* Offset 1px White Frame from Figma */}
            <div className="absolute -top-4 -right-4 w-full h-full border border-white/40 pointer-events-none z-0 transition-transform duration-500 hover:-translate-x-1 hover:translate-y-1" />

            {/* Inner Card & Photo with Rytox Crossfade */}
            <div className="relative z-10 rounded-sm overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.8)] bg-[#121722] border border-white/10 aspect-[4/3] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeLens.id}
                  src={activeLens.image} 
                  alt={activeLens.name} 
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="max-h-full max-w-full object-contain p-4 hover:scale-105 transition-transform duration-500"
                />
              </AnimatePresence>
            </div>

            {/* Sparkle Icon Accent from Figma */}
            <div className="absolute -bottom-5 -right-5 z-20 text-white/50 animate-pulse">
              <Sparkles size={20} />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
