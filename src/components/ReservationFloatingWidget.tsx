import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, ArrowUpRight } from 'lucide-react';
import { ActiveReservation } from '../types';

interface ReservationFloatingWidgetProps {
  reservation: ActiveReservation;
  onOpenModal: () => void;
  onCancelHold?: () => void;
}

export const ReservationFloatingWidget: React.FC<ReservationFloatingWidgetProps> = ({
  reservation,
  onOpenModal,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    return Math.max(0, Math.floor((reservation.expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    setRemainingSeconds(Math.max(0, Math.floor((reservation.expiresAt - Date.now()) / 1000)));

    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((reservation.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation.expiresAt]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = remainingSeconds <= 180; // Dưới 3 phút cảnh báo
  const isExpired = remainingSeconds <= 0;

  return (
    <div className="fixed bottom-6 right-6 z-[125] select-none pointer-events-auto">
      <AnimatePresence>
        <motion.button
          key="reservation-pill-btn"
          onClick={onOpenModal}
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 380 }}
          className="bg-white hover:bg-neutral-50 rytox-hover-lift h-11 pl-2.5 pr-3.5 sm:pr-4 rounded-full flex items-center gap-2.5 font-medium text-xs sm:text-sm text-[#14171f] cursor-pointer shadow-[0_8px_30px_rgba(20,24,32,0.14)] border border-[#14171f]/12 hover:border-[#14171f]/30 transition-all group"
          title="Bấm để xem lại đơn chờ thanh toán & giữ chỗ 15 phút"
          aria-label="Xem đơn chờ thanh toán"
        >
          {/* Avatar Circle với biểu tượng Đồng hồ & Radar nhấp nháy (Chuẩn thiết kế hình 2) */}
          <div className="relative w-7 h-7 aspect-square rounded-full bg-[#14171f] text-white flex items-center justify-center font-bold text-[11px] shadow-sm shrink-0">
            <Clock size={13} className="text-white" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
                isExpired ? 'bg-rose-500' : isUrgent ? 'bg-amber-400' : 'bg-emerald-400'
              } radar-pulse-white ring-2 ring-white`}
            />
          </div>

          {/* Tiêu đề & Mã đơn */}
          <span className="font-semibold text-xs text-[#14171f] whitespace-nowrap">
            Đơn chờ thanh toán
          </span>

          {/* Badge đếm ngược thời gian thực */}
          <span
            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              isExpired
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isUrgent
                ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isExpired ? 'Hết hạn' : timerDisplay}
          </span>

          {/* Mũi tên ChevronDown như hình 2 */}
          <ChevronDown
            size={14}
            className="text-[#14171f]/60 group-hover:text-[#14171f] transition-transform duration-200 shrink-0 group-hover:translate-y-0.5"
          />
        </motion.button>
      </AnimatePresence>
    </div>
  );
};
