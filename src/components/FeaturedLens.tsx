import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LensModel } from '../types';
import { Sparkles, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';

interface FeaturedLensProps {
  lenses: LensModel[];
  onSelectLens: (lens: LensModel) => void;
  onAddToCart?: (lens: LensModel) => void;
}

export const FeaturedLens: React.FC<FeaturedLensProps> = ({ lenses, onSelectLens, onAddToCart }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!lenses || lenses.length === 0) return null;

  // Giữ lại đúng 4 ống kính hot nhất
  const hotLenses = lenses.slice(0, 4);
  const activeLens = hotLenses[currentIndex] || hotLenses[0];

  return (
    <section 
      id="lenses" 
      className="relative w-full min-h-[calc(100vh-84px)] scroll-mt-[84px] select-none flex flex-col justify-center items-center py-6 sm:py-8 lg:py-10 overflow-hidden bg-white"
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8">
        
        {/* Thanh chuyển đổi nhanh đúng 4 lens hot nhất */}
        <div className="flex items-center justify-center mb-6">
          <div className="liquid-glass p-1.5 rounded-full flex flex-wrap items-center justify-center gap-1.5 shadow-md max-w-full">
            {hotLenses.map((lens, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={lens.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#14171f] text-white shadow-md scale-[1.02]'
                      : 'text-[#525868] hover:text-[#14171f] hover:bg-[#14171f]/[0.05] active:scale-95'
                  }`}
                >
                  <span>{lens.name.replace('FUJINON ', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Cột trái (Thông tin chi tiết lens & Nút hành động) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLens.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full liquid-glass rounded-3xl p-6 sm:p-7 md:p-8 border border-[#14171f]/10 shadow-[0_16px_40px_rgba(20,24,32,0.06)]"
              >
                {/* Badge phân loại */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.14em] uppercase text-[#343a4a] bg-[#14171f]/[0.05] border border-[#14171f]/10">
                    {activeLens.highlightBadge || 'Ống Kính Fujinon Du Lịch • Top 4 Hot'}
                  </span>
                  <span className="text-xs text-[#525868] font-medium">
                    {currentIndex + 1} / {hotLenses.length}
                  </span>
                </div>

                {/* Tiêu đề Lens */}
                <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-normal leading-[1.14] text-[#14171f] mb-3">
                  {activeLens.name}
                </h2>

                {/* Đường phân cách */}
                <div className="w-full h-[1px] bg-[#14171f]/10 mb-4" />

                {/* Mô tả chi tiết */}
                <p className="text-xs sm:text-sm leading-relaxed text-[#525868] font-light mb-4 line-clamp-3">
                  {activeLens.description}
                </p>

                {/* Giá thuê & Thông số */}
                <div className="w-full bg-[#14171f]/[0.025] border-l-3 border-l-[#14171f] p-3.5 sm:p-4 rounded-r-xl mb-6 text-xs sm:text-sm text-[#383e4e]">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1.5">
                    <span><strong>Giá thuê:</strong> {activeLens.dailyRate.toLocaleString('vi-VN')}₫ / ngày</span>
                    <span className="text-[#14171f]/20">•</span>
                    <span><strong>Cọc tiêu chuẩn:</strong> {activeLens.depositRate.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#14171f] font-medium text-xs">
                    <CheckCircle2 size={14} className="text-[#14171f]" />
                    <span>
                      {activeLens.availableCount === 1 
                        ? 'Chỉ còn 1 ống kính cuối (Sẵn sàng giao ngay)' 
                        : 'Ống kính sẵn sàng bàn giao trực tiếp tại cửa hàng'}
                    </span>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => onSelectLens(activeLens)}
                    className="h-10 sm:h-11 px-6 rounded-full bg-[#14171f] text-white hover:bg-[#282e3c] font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_16px_rgba(20,24,32,0.18)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Đặt lịch giữ ống kính</span>
                    <ArrowRight size={15} />
                  </button>

                  {onAddToCart && (
                    <button
                      type="button"
                      onClick={() => onAddToCart(activeLens)}
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

          {/* Cột phải: Khung ảnh ống kính viền lệch than tre 1px */}
          <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2">
            <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
              {/* Khung viền lệch 1px than tre tinh tế */}
              <div className="absolute -top-3.5 -right-3.5 w-full h-full border border-[#14171f]/20 pointer-events-none z-0 transition-transform duration-500 hover:-translate-x-1 hover:translate-y-1 rounded-2xl" />

              {/* Bục ảnh ống kính nền trắng tinh khôi */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(20,24,32,0.1)] bg-white border border-[#14171f]/10 aspect-[4/3] flex items-center justify-center">
                <motion.img 
                  key={activeLens.id}
                  src={activeLens.image} 
                  alt={activeLens.name} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="max-h-full max-w-full object-contain p-4 product-stage-img hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Sparkle Icon Accent */}
              <div className="absolute -bottom-4 -right-4 z-20 text-[#14171f]/40 animate-pulse">
                <Sparkles size={20} />
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
