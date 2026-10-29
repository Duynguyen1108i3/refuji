import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw, Check, Clock } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStartDate?: string; // Format 'YYYY-MM-DD'
  initialEndDate?: string;
  onApplyDates: (rangeText: string, daysCount: number) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  initialStartDate = '2026-10-29',
  initialEndDate = '2026-10-31',
  onApplyDates,
}) => {
  // Quản lý tháng đang hiển thị (Mặc định: Tháng 10/2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = Tháng 10

  // Ngày bắt đầu và ngày kết thúc (lưu dạng YYYY-MM-DD)
  const [startDateStr, setStartDateStr] = useState<string>(initialStartDate);
  const [endDateStr, setEndDateStr] = useState<string>(initialEndDate);

  if (!isOpen) return null;

  // Danh sách các tháng ở cột bên trái (như thiết kế ảnh 3)
  const monthList = [
    { name: 'Tháng 10', year: 2026, monthIndex: 9 },
    { name: 'Tháng 11', year: 2026, monthIndex: 10 },
    { name: 'Tháng 12', year: 2026, monthIndex: 11 },
    { name: 'Tháng 01', year: 2027, monthIndex: 0 },
    { name: 'Tháng 02', year: 2027, monthIndex: 1 },
    { name: 'Tháng 03', year: 2027, monthIndex: 2 },
  ];

  const monthNamesVi = [
    'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
    'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  // Tính số ngày trong tháng đang xem
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Ngày bắt đầu của tháng (0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7)
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Chuyển sang chuẩn Thứ 2 = 0, Chủ Nhật = 6
  const startDayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Xử lý chuyển tháng trước / sau
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Định dạng ngày sang YYYY-MM-DD
  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Xử lý khi click vào 1 ngày trên lưới lịch
  const handleDateClick = (day: number) => {
    const clickedDateStr = formatDateKey(currentYear, currentMonth, day);

    if (!startDateStr || (startDateStr && endDateStr)) {
      // Đặt lại ngày bắt đầu mới
      setStartDateStr(clickedDateStr);
      setEndDateStr('');
    } else if (startDateStr && !endDateStr) {
      if (clickedDateStr < startDateStr) {
        setStartDateStr(clickedDateStr);
      } else {
        setEndDateStr(clickedDateStr);
      }
    }
  };

  // Tính toán số ngày thuê
  const calculateDays = () => {
    if (!startDateStr || !endDateStr) return 1;
    const s = new Date(startDateStr);
    const e = new Date(endDateStr);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1; // Tính cả ngày nhận và trả
    return Math.max(1, diffDays);
  };

  const totalDays = calculateDays();

  // Format hiển thị trên 2 ô ở đầu (theo ảnh 3)
  const formatInputDisplay = (dateStr: string) => {
    if (!dateStr) return 'Chọn ngày';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parts[2];
    const month = parts[1];
    const year = parts[0];
    return `${day} Th${month} ${year}`;
  };

  // Đặt lại ngày
  const handleClear = () => {
    setStartDateStr('');
    setEndDateStr('');
  };

  // Áp dụng ngày
  const handleApply = () => {
    if (!startDateStr) return;
    const finalEnd = endDateStr || startDateStr;
    const sParts = startDateStr.split('-');
    const eParts = finalEnd.split('-');
    const rangeText = `${sParts[2]}/${sParts[1]} — ${eParts[2]}/${eParts[1]} (${totalDays} ngày)`;
    onApplyDates(rangeText, totalDays);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0c0f17] border border-white/20 rounded-3xl p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.9)] text-white flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* NÚT ĐÓNG (X) DẠNG TRÒN NỔI BẬT THEO STYLE ẢNH 2 */}
        <button
          onClick={onClose}
          aria-label="Đóng popup lịch"
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
        >
          <X size={18} />
        </button>

        {/* HEADER: Tiêu đề Chọn ngày thuê */}
        <div className="pb-4 border-b border-white/10 pr-12">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-amber-400" />
            <h3 className="font-serif text-xl sm:text-2xl text-white font-medium">
              Chọn Thời Gian Thuê Thiết Bị
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-white/60 mt-0.5">
            Chọn ngày nhận và ngày trả máy để hệ thống kiểm tra thiết bị sẵn sàng cho bạn.
          </p>
        </div>

        {/* NỘI DUNG CHÍNH (THEO THIẾT KẾ ẢNH 3) */}
        <div className="overflow-y-auto py-4 flex-1">
          {/* 1. HAI Ô HIỂN THỊ NGÀY NHẬN & NGÀY TRẢ (THEO ĐÚNG ẢNH THỨ 3) */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div
              className={`p-3 rounded-2xl border transition-all ${
                !endDateStr
                  ? 'border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                  : 'border-white/15 bg-white/5 text-white/80'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-1">
                Ngày nhận máy
              </div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center justify-between">
                <span>{formatInputDisplay(startDateStr)}</span>
                <Clock size={14} className="text-amber-400" />
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border transition-all ${
                endDateStr
                  ? 'border-white bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                  : 'border-white/15 bg-white/5 text-white/80'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-1">
                Ngày trả máy dự kiến
              </div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center justify-between">
                <span>{formatInputDisplay(endDateStr)}</span>
                <Clock size={14} className="text-amber-400" />
              </div>
            </div>
          </div>

          {/* 2. BỐ CỤC CHÍNH 2 CỘT: CỘT THÁNG BÊN TRÁI & LƯỚI LỊCH BÊN PHẢI (THEO ẢNH 3) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
            
            {/* Cột trái (4 cols): Danh sách tháng */}
            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-white/10 pb-3 md:pb-0 md:pr-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
              <div className="hidden md:block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-2">
                Chọn tháng
              </div>
              {monthList.map((m) => {
                const isSelected = m.year === currentYear && m.monthIndex === currentMonth;
                return (
                  <button
                    key={`${m.year}-${m.monthIndex}`}
                    type="button"
                    onClick={() => {
                      setCurrentYear(m.year);
                      setCurrentMonth(m.monthIndex);
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#0B0F17] font-bold shadow-md scale-[1.02]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {m.name} {m.year !== 2026 && `(${m.year})`}
                  </button>
                );
              })}
            </div>

            {/* Cột phải (8 cols): Lưới ngày của tháng được chọn */}
            <div className="md:col-span-8 md:pl-2">
              
              {/* Điều hướng Tháng & Năm */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-serif text-lg font-semibold text-white">
                  {monthNamesVi[currentMonth]} {currentYear}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Tháng trước"
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Tháng sau"
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Header Thứ trong tuần (T2 -> CN theo ảnh 3) */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-white/40 mb-2 pb-1 border-b border-white/10">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span>CN</span>
              </div>

              {/* Lưới các ô ngày */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Ô trống offset trước ngày mùng 1 */}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}

                {/* Các ngày trong tháng */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const thisDateKey = formatDateKey(currentYear, currentMonth, day);
                  const isStart = startDateStr === thisDateKey;
                  const isEnd = endDateStr === thisDateKey;
                  const isInRange =
                    startDateStr &&
                    endDateStr &&
                    thisDateKey > startDateStr &&
                    thisDateKey < endDateStr;

                  // Highlight ngày hôm nay (29/10/2026)
                  const isToday = thisDateKey === '2026-10-29';

                  return (
                    <div
                      key={`day-${day}`}
                      className={`relative h-9 flex items-center justify-center select-none ${
                        isInRange ? 'bg-white/15' : ''
                      } ${isStart && endDateStr ? 'rounded-l-full bg-white/15' : ''} ${
                        isEnd && startDateStr ? 'rounded-r-full bg-white/15' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDateClick(day)}
                        className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative z-10 ${
                          isStart || isEnd
                            ? 'bg-white text-[#0B0F17] font-bold shadow-md scale-105'
                            : isInRange
                            ? 'text-white font-medium hover:bg-white/20'
                            : 'text-white/80 hover:bg-white/15 hover:text-white'
                        }`}
                      >
                        <span>{day}</span>
                        {isToday && !isStart && !isEnd && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>

        {/* FOOTER THANH DƯỚI (THEO ĐÚNG ẢNH THỨ 3) */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Hiển thị số ngày thuê (như '16 days' ở ảnh 3) */}
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-serif font-bold text-white tracking-wide">
              {totalDays} ngày thuê
            </span>
            <span className="text-white/40">•</span>
            <span className="text-white/60 text-[11px]">
              Giờ giao nhận tiêu chuẩn: 08:00 – 20:00 hàng ngày
            </span>
          </div>

          {/* Hai nút: Clear dates và Áp dụng */}
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all font-medium cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Xóa ngày</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!startDateStr}
              className="px-6 py-2 rounded-xl bg-white hover:bg-white/90 text-[#0B0F17] font-bold transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Áp dụng lịch</span>
            </button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};
