import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface HeroProps {
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  const containerRef = useRef<HTMLElement>(null);

  // Theo dõi tiến trình cuộn của màn hình đầu tiên (Hero 100vh)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Khi cuộn xuống sắp hết trang chủ:
  // - Từ 0 đến 0.35: Hiển thị rõ 100%
  // - Từ 0.35 đến 0.82: Mờ dần về 0 (opacity: 1 -> 0) kèm trượt nhẹ lên trên (-50px)
  const contentOpacity = useTransform(scrollYProgress, [0, 0.35, 0.82], [1, 0.85, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.82], [0, -50]);
  const contentScale = useTransform(scrollYProgress, [0, 0.82], [1, 0.94]);

  // Nền ảnh sương mù mờ dần vào nền tối của phần tra cứu lịch
  const bgOpacity = useTransform(scrollYProgress, [0, 0.85], [0.6, 0.05]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);

  // Nút cuộn xuống khám phá mờ sớm hơn khi người dùng bắt đầu lăn chuột
  const scrollCueOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-screen min-h-[720px] flex flex-col justify-between items-center text-center px-6 overflow-hidden select-none"
    >
      {/* Background with clean mist forest & deep charcoal gradient & Rytox Ken Burns Motion */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-top bg-no-repeat z-0 hero-ken-burns"
        style={{ 
          backgroundImage: `url('/assets/forest-clean.jpg')`,
          opacity: bgOpacity,
          scale: bgScale
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07070a]/40 via-[#07070a]/70 to-[#07070a] z-0 pointer-events-none" />

      {/* Top spacing - 100vh Ultra Minimalist, Absolutely NO navbar at top */}
      <div className="h-20 w-full relative z-10" />

      {/* Exact Typography from Figma with Grand Editorial Scale & Scroll Fade & Smooth Rytox Entrance */}
      <motion.div 
        initial={{ opacity: 0, y: 35, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ opacity: contentOpacity, y: contentY, scale: contentScale }}
        className="relative z-10 flex flex-col items-center max-w-5xl mx-auto px-4 my-auto will-change-transform"
      >
        <motion.span 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-sm uppercase font-semibold tracking-[0.36em] text-white/80 mb-6 drop-shadow-sm"
        >
          Máy ảnh cho những câu chuyện thật
        </motion.span>

        <motion.h1 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-normal leading-[1.06] tracking-tight text-[#F8FAFC] uppercase mb-7 drop-shadow-[0_12px_36px_rgba(0,0,0,0.8)]"
        >
          Lưu Giữ Mọi<br />Khoảnh Khắc
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-sm md:text-base font-light uppercase tracking-[0.26em] text-white/75 max-w-3xl leading-relaxed"
        >
          Hệ thống cho thuê máy ảnh &amp; ống kính Fujifilm chuyên nghiệp
        </motion.p>
      </motion.div>

      {/* Bottom Scroll Cue with Breathing Animation (Fades early on scroll) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{ opacity: scrollCueOpacity }}
        onClick={onExploreClick}
        className="relative z-10 flex flex-col items-center gap-2.5 pb-14 cursor-pointer group"
      >
        <span className="text-[10px] sm:text-[11px] uppercase font-medium tracking-[0.26em] text-white/50 group-hover:text-white/90 transition-colors">
          Cuộn xuống để khám phá
        </span>
        <div className="flex flex-col items-center animate-breathing group-hover:translate-y-1.5 transition-transform duration-300">
          <svg 
            width="14" 
            height="44" 
            viewBox="0 0 14 44" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-white/70 group-hover:text-white transition-colors"
          >
            <defs>
              <linearGradient id="hero-scroll-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                <stop offset="65%" stopColor="currentColor" stopOpacity="0.85" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
              </linearGradient>
            </defs>
            <line 
              x1="7" 
              y1="0" 
              x2="7" 
              y2="38.5" 
              stroke="url(#hero-scroll-gradient)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
            />
            <path 
              d="M2 33L7 38.5L12 33" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        </div>
      </motion.div>
    </section>
  );
};
