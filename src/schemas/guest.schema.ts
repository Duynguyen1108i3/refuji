// Tính năng: Kiểm tra hợp lệ thông tin khách vãng lai (Bước 2 đặt nhanh không cần tài khoản & Luật BVDLCN 2025) và form tra cứu đơn
import { z } from 'zod';

const RFC_5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export const guestInfoSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Vui lòng nhập họ và tên người nhận máy')
    .transform((val) => val.trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(2, 'Họ và tên tối thiểu 2 ký tự')
        .max(100, 'Họ và tên không vượt quá 100 ký tự')
    ),
  phone: z
    .string()
    .min(1, 'Vui lòng nhập số điện thoại liên hệ')
    .transform((val) => val.replace(/[\s.-]/g, '').trim())
    .refine((val) => VN_PHONE_REGEX.test(val), {
      message: 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09)',
    }),
  email: z
    .string()
    .min(1, 'Vui lòng nhập email nhận mã đơn hàng')
    .transform((val) => val.trim())
    .refine((val) => RFC_5322_EMAIL_REGEX.test(val), {
      message: 'Email không đúng định dạng (VD: tenban@domain.vn)',
    }),
  note: z
    .string()
    .max(500, 'Ghi chú tối đa 500 ký tự')
    .optional()
    .default(''),
  privacy_consent: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Bạn cần đồng ý chính sách xử lý & bảo vệ dữ liệu cá nhân của ReFuji để tiếp tục',
    }),
});

export type GuestInfoFormData = z.infer<typeof guestInfoSchema>;

export const guestLookupSchema = z.object({
  orderCode: z
    .string()
    .min(1, 'Vui lòng nhập mã đơn hàng (VD: ORD-123456)')
    .transform((val) => val.replace(/^#/, '').trim().toUpperCase()),
  phone: z
    .string()
    .min(1, 'Vui lòng nhập số điện thoại đã đặt đơn')
    .transform((val) => val.replace(/[\s.-]/g, '').trim())
    .refine((val) => VN_PHONE_REGEX.test(val), {
      message: 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 03/05/07/08/09)',
    }),
});

export type GuestLookupFormData = z.infer<typeof guestLookupSchema>;
