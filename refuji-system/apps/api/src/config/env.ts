import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  TZ: z.literal('Asia/Ho_Chi_Minh'),
  FRONTEND_URL: z.string().url(),

  DATABASE_URL: z.string().startsWith('mysql://'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Bắt buộc đúng 64 ký tự Hex (32 bytes) cho thuật toán AES-256-GCM
  PII_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, {
    message: 'PII_ENCRYPTION_KEY phải là chuỗi Hex 64 ký tự (32 bytes) cho AES-256-GCM',
  }),
  PII_HMAC_SECRET: z.string().min(16),

  VNP_TMNCODE: z.string().min(1),
  VNP_HASHSECRET: z.string().min(1),
  VNP_URL: z.string().url(),
  VNP_RETURN_URL: z.string().url(),
  VNP_IPN_URL: z.string().url(),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  SIGNED_URL_EXPIRES_SECONDS: z.coerce.number().default(900),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_FROM: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Lỗi cấu hình biến môi trường (.env):', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
