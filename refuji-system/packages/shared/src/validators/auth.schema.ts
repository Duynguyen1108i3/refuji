import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự')
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự').max(150),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(03|05|07|08|09)\d{8}$/, 'Số điện thoại Việt Nam không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  confirmPassword: z.string().min(8),
  // Mandatory privacy consent under Law on Protection of Personal Data 2025
  privacyConsent: z.boolean().refine(val => val === true, {
    message: 'Bạn bắt buộc phải đồng ý với Điều khoản xử lý dữ liệu cá nhân theo Nghị định BVDLCN 2025'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không trùng khớp',
  path: ['confirmPassword']
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không đúng định dạng')
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
