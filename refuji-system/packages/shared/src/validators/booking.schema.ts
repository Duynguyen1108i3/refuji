import { z } from 'zod';

export const bookingTimeSlotSchema = z.object({
  rentalStartDate: z.string().datetime({ message: 'Thời điểm bắt đầu không hợp lệ' }),
  rentalEndDate: z.string().datetime({ message: 'Thời điểm kết thúc không hợp lệ' }),
  items: z.array(z.object({
    modelId: z.number().int().positive(),
    quantity: z.number().int().min(1).default(1)
  })).min(1, 'Vui lòng chọn ít nhất 1 thiết bị')
}).refine((data) => {
  const start = new Date(data.rentalStartDate);
  const end = new Date(data.rentalEndDate);

  // Time sequence Ts < Te
  if (start >= end) return false;

  // Must be in business hours: 08:00 to 20:00 (Asia/Ho_Chi_Minh)
  const startHour = start.getHours();
  const endHour = end.getHours();

  if (startHour < 8 || startHour > 20) return false;
  if (endHour < 8 || endHour > 20) return false;

  return true;
}, {
  message: 'Thời gian nhận và trả máy phải trong khung giờ mở cửa (08:00 - 20:00) và ngày trả phải sau ngày nhận'
});

export type BookingTimeSlotInput = z.infer<typeof bookingTimeSlotSchema>;

/**
 * Generates default valid rental start and end dates according to business rules:
 * - Start time rounded up to next valid hour in 08:00 - 20:00
 * - If currently after 20:00, starts at 08:00 tomorrow
 * - Default duration: 2 days (48 hours)
 */
export function getDefaultRentalDates(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const start = new Date(now);

  const currentHour = now.getHours();

  if (currentHour < 8) {
    start.setHours(9, 0, 0, 0);
  } else if (currentHour >= 20) {
    // Tomorrow at 08:00
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
  } else {
    // Round to next hour
    start.setHours(currentHour + 1, 0, 0, 0);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 2); // 2 days rental
  end.setHours(start.getHours(), 0, 0, 0);

  return { startDate: start, endDate: end };
}
