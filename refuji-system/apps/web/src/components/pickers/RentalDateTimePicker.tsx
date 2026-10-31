import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { getDefaultRentalDates } from '@refuji/shared';

interface RentalDateTimePickerProps {
  initialStart?: Date;
  initialEnd?: Date;
  onChange: (dates: { startDate: Date; endDate: Date; durationDays: number }) => void;
  className?: string;
}

export const RentalDateTimePicker: React.FC<RentalDateTimePickerProps> = ({
  initialStart,
  initialEnd,
  onChange,
  className = ''
}) => {
  const [startDateTime, setStartDateTime] = useState<string>(() => {
    const dates = initialStart ? { startDate: initialStart, endDate: initialEnd || initialStart } : getDefaultRentalDates();
    return formatForInput(dates.startDate);
  });

  const [endDateTime, setEndDateTime] = useState<string>(() => {
    const dates = initialStart ? { startDate: initialStart, endDate: initialEnd || initialStart } : getDefaultRentalDates();
    return formatForInput(dates.endDate);
  });

  const [error, setError] = useState<string | null>(null);

  // Format local date for input[type="datetime-local"] (YYYY-MM-DDTHH:mm)
  function formatForInput(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  // Minimum selectable date is now (rounded to current hour)
  const minDateString = formatForInput(new Date());

  useEffect(() => {
    validateAndEmit(startDateTime, endDateTime);
  }, [startDateTime, endDateTime]);

  const validateAndEmit = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const now = new Date();

    if (start < new Date(now.getTime() - 10 * 60 * 1000)) {
      setError('Thời gian nhận máy không được ở quá khứ');
      return;
    }

    if (end <= start) {
      setError('Thời gian trả máy phải sau thời gian nhận');
      return;
    }

    const startH = start.getHours();
    const endH = end.getHours();

    if (startH < 8 || startH >= 20) {
      setError('Giờ nhận máy phải trong khung hoạt động 08:00 — 20:00');
      return;
    }

    if (endH < 8 || endH >= 20) {
      setError('Giờ trả máy phải trong khung hoạt động 08:00 — 20:00');
      return;
    }

    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const durationDays = Math.max(1, Math.ceil(diffHours / 24));

    setError(null);
    onChange({ startDate: start, endDate: end, durationDays });
  };

  return (
    <div className={`p-4 rounded-2xl liquid-glass border border-white/15 ${className}`}>
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-emerald-400">
        <Clock className="w-4 h-4" />
        <span>Khung giờ giao nhận tại Showroom: 08:00 — 20:00 hàng ngày</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nhận máy */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Ngày & Giờ nhận máy</span>
          </label>
          <input
            type="datetime-local"
            min={minDateString}
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/20 text-zinc-100 text-sm focus:border-emerald-500 focus:outline-none num"
          />
        </div>

        {/* Trả máy */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Ngày & Giờ trả máy</span>
          </label>
          <input
            type="datetime-local"
            min={startDateTime}
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/20 text-zinc-100 text-sm focus:border-emerald-500 focus:outline-none num"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 px-3 py-2 rounded-lg border border-rose-900/40">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
