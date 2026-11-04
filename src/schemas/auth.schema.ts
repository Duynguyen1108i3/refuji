import { z } from 'zod';

// RFC 5322 compliant email regex
const RFC_5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Vietnam Phone Number Regex: exactly 10 digits starting with 03, 05, 07, 08, 09
const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

/**
 * Schema Validation: Đăng nhập (Login)
 * Khớp chuẩn POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .refine((val) => RFC_5322_EMAIL_REGEX.test(val), {
      message: 'Email không đúng chuẩn định dạng (VD: yourname@domain.vn)',
    }),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(8, 'Mật khẩu phải có tối thiểu 8 ký tự'),
  remember_me: z.boolean().default(false).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema Validation: Đăng ký (Register)
 * Khớp cấu trúc bảng Users (ReFuji Spec) & Luật Bảo vệ Dữ liệu Cá nhân 2025
 */
export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'Vui lòng nhập họ và tên của bạn')
      .transform((val) => val.trim().replace(/\s+/g, ' '))
      .pipe(
        z
          .string()
          .min(2, 'Họ và tên tối thiểu 2 ký tự')
          .max(100, 'Họ và tên không được vượt quá 100 ký tự')
      ),
    email: z
      .string()
      .min(1, 'Vui lòng nhập địa chỉ email')
      .refine((val) => RFC_5322_EMAIL_REGEX.test(val), {
        message: 'Email không đúng định dạng chuẩn RFC 5322',
      }),
    phone: z
      .string()
      .min(1, 'Vui lòng nhập số điện thoại')
      .transform((val) => val.replace(/[\s.-]/g, ''))
      .refine((val) => VN_PHONE_REGEX.test(val), {
        message: 'Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09)',
      }),
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu')
      .min(8, 'Mật khẩu phải có tối thiểu 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ cái in hoa (A-Z)')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ cái thường (a-z)')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số (0-9)')
      .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)'),
    confirm_password: z
      .string()
      .min(1, 'Vui lòng nhập lại mật khẩu xác nhận'),
    // Bắt buộc tuân thủ Luật Bảo vệ Dữ liệu Cá nhân 2025
    privacy_consent: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Bạn bắt buộc phải đồng ý với Chính sách xử lý & Bảo vệ Dữ liệu Cá nhân của ReFuji',
      }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp 100% với mật khẩu đã nhập',
    path: ['confirm_password'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema Validation: Quên mật khẩu (Forgot Password)
 * Khớp chuẩn POST /api/auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email đã đăng ký')
    .refine((val) => RFC_5322_EMAIL_REGEX.test(val), {
      message: 'Email không đúng định dạng chuẩn RFC 5322',
    }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
