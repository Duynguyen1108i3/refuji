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

  // Danh sách các tháng ở cột bên trái
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
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const totalDays = calculateDays();

  // Chuyển ngày YYYY-MM-DD thành hiển thị DD/MM
  const formatShortDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length < 3) return '';
    return `${parts[2]}/${parts[1]}`;
  };

  // Chuỗi hiển thị khoảng ngày (VD: 29/10 — 31/10 (3 ngày))
  const getRangeDisplayText = () => {
    if (!startDateStr) return 'Chọn ngày nhận máy';
    if (!endDateStr) return `${formatShortDate(startDateStr)} (1 ngày)`;
    return `${formatShortDate(startDateStr)} — ${formatShortDate(endDateStr)} (${totalDays} ngày)`;
  };

  const handleClear = () => {
    setStartDateStr('');
    setEndDateStr('');
  };

  const handleApply = () => {
    if (!startDateStr) return;
    const rangeText = getRangeDisplayText();
    onApplyDates(rangeText, totalDays);
    onClose();
  };

  // Format hiển thị cho 2 ô Ngày nhận / Ngày trả
  const formatInputDisplay = (dStr: string) => {
    if (!dStr) return 'Chưa chọn';
    const [y, m, d] = dStr.split('-');
    return `${d} Th${m}, ${y}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#14171f]/40 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white border border-[#14171f]/10 rounded-3xl p-5 sm:p-7 shadow-[0_24px_70px_rgba(20,24,32,0.18)] text-[#14171f] flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* NÚT ĐÓNG (X) DẠNG TRÒN */}
        <button
          onClick={onClose}
          aria-label="Đóng popup lịch"
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-[#14171f]/[0.05] hover:bg-[#14171f]/[0.1] border border-[#14171f]/10 text-[#14171f] flex items-center justify-center transition-all cursor-pointer active:scale-90"
        >
          <X size={18} />
        </button>

        {/* HEADER: Tiêu đề Chọn ngày thuê */}
        <div className="pb-4 border-b border-[#14171f]/10 pr-12">
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-[#14171f]" />
            <h3 className="font-serif text-xl sm:text-2xl text-[#14171f] font-medium">
              Chọn Thời Gian Thuê Thiết Bị
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-[#6e7587] mt-0.5">
            Chọn ngày nhận và ngày trả máy để hệ thống kiểm tra thiết bị sẵn sàng cho bạn.
          </p>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="overflow-y-auto py-4 flex-1">
          {/* 1. HAI Ô HIỂN THỊ NGÀY NHẬN & NGÀY TRẢ */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div
              className={`p-3 rounded-2xl border transition-all ${
                !endDateStr
                  ? 'border-[#14171f] bg-[#14171f]/[0.05] text-[#14171f] shadow-sm'
                  : 'border-[#14171f]/12 bg-[#f7f8fa] text-[#444a59]'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#747b8c] mb-1">
                Ngày nhận máy
              </div>
              <div className="text-sm sm:text-base font-bold text-[#14171f] flex items-center justify-between">
                <span>{formatInputDisplay(startDateStr)}</span>
                <Clock size={14} className="text-[#6e7587]" />
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border transition-all ${
                endDateStr
                  ? 'border-[#14171f] bg-[#14171f]/[0.05] text-[#14171f] shadow-sm'
                  : 'border-[#14171f]/12 bg-[#f7f8fa] text-[#444a59]'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#747b8c] mb-1">
                Ngày trả máy dự kiến
              </div>
              <div className="text-sm sm:text-base font-bold text-[#14171f] flex items-center justify-between">
                <span>{formatInputDisplay(endDateStr)}</span>
                <Clock size={14} className="text-[#6e7587]" />
              </div>
            </div>
          </div>

          {/* 2. BỐ CỤC CHÍNH 2 CỘT: CỘT THÁNG BÊN TRÁI & LƯỚI LỊCH BÊN PHẢI */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 border border-[#14171f]/10 rounded-2xl p-4 bg-[#f7f8fa]">
            
            {/* Cột trái (4 cols): Danh sách tháng */}
            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#14171f]/10 pb-3 md:pb-0 md:pr-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
              <div className="hidden md:block text-[10px] uppercase font-bold tracking-wider text-[#747b8c] mb-2">
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
                        ? 'bg-[#14171f] text-white font-bold shadow-sm scale-[1.02]'
                        : 'text-[#525868] hover:text-[#14171f] hover:bg-[#14171f]/[0.05]'
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
                <span className="font-serif text-lg font-semibold text-[#14171f]">
                  {monthNamesVi[currentMonth]} {currentYear}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Tháng trước"
                    className="w-7 h-7 rounded-full bg-white border border-[#14171f]/10 hover:bg-[#14171f]/[0.06] flex items-center justify-center text-[#525868] hover:text-[#14171f] cursor-pointer shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Tháng sau"
                    className="w-7 h-7 rounded-full bg-white border border-[#14171f]/10 hover:bg-[#14171f]/[0.06] flex items-center justify-center text-[#525868] hover:text-[#14171f] cursor-pointer shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Header Thứ trong tuần */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#747b8c] mb-2 pb-1 border-b border-[#14171f]/10">
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
                        isInRange ? 'bg-[#14171f]/10' : ''
                      } ${isStart && endDateStr ? 'rounded-l-full bg-[#14171f]/10' : ''} ${
                        isEnd && startDateStr ? 'rounded-r-full bg-[#14171f]/10' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDateClick(day)}
                        className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative z-10 ${
                          isStart || isEnd
                            ? 'bg-[#14171f] text-white font-bold shadow-md scale-105'
                            : isInRange
                            ? 'text-[#14171f] font-semibold hover:bg-[#14171f]/15'
                            : 'text-[#2d3342] hover:bg-[#14171f]/[0.08] hover:text-[#14171f]'
                        }`}
                      >
                        <span>{day}</span>
                        {isToday && !isStart && !isEnd && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#14171f]" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        </div>

        {/* FOOTER THANH DƯỚI */}
        <div className="pt-4 border-t border-[#14171f]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Hiển thị số ngày thuê */}
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-serif font-bold text-[#14171f] tracking-wide">
              {totalDays} ngày thuê
            </span>
            <span className="text-[#14171f]/20">•</span>
            <span className="text-[#6e7587] text-[11px]">
              Giờ giao nhận tiêu chuẩn: 08:00 – 20:00 hàng ngày
            </span>
          </div>

          {/* Hai nút: Clear dates và Áp dụng */}
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-full border border-[#14171f]/15 bg-white hover:bg-[#14171f]/[0.05] text-[#444a59] hover:text-[#14171f] transition-all font-medium cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw size={13} />
              <span>Xóa ngày</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!startDateStr}
              className="px-6 py-2 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
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
