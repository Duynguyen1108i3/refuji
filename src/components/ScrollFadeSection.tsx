import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollFadeSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export const ScrollFadeSection: React.FC<ScrollFadeSectionProps> = ({ id, className = '', children }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Hiệu ứng cuộn lên / xuống mờ dần và co dãn tinh tế theo chuẩn RytoxGroup:
  // - Khi bắt đầu cuộn vào khung nhìn (0 -> 0.18): Mờ dần hiện rõ (opacity: 0 -> 1, y: 36px -> 0, scale: 0.97 -> 1)
  // - Ở giữa màn hình (0.18 -> 0.82): Hiển thị rõ ràng 100% (opacity: 1, scale: 1)
  // - Khi sắp hết section cuộn ra khỏi màn hình (0.82 -> 1.0): Mờ dần (opacity: 1 -> 0.08, y: 0 -> -36px, scale: 1 -> 0.97)
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0.08]);
  const y = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [36, 0, 0, -36]);
  const scale = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0.98, 1, 1, 0.98]);

  return (
    <motion.div
      id={id}
      ref={sectionRef}
      style={{ opacity, y, scale }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
};
