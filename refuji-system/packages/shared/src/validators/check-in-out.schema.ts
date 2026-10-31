import { z } from 'zod';
import { DamageLevel } from '../enums/damage-level.enum.ts';

export const checkoutRecordSchema = z.object({
  orderId: z.number().int().positive(),
  idCardLast4Input: z.string().length(4, 'Vui lòng nhập chính xác 4 số cuối CCCD/VNeID').regex(/^\d{4}$/, '4 số cuối CCCD phải là chữ số'),
  assignedSerials: z.array(z.object({
    detailId: z.number().int().positive(),
    serialNumber: z.string().min(1, 'Mã Serial không được để trống'),
    initialShutterCount: z.number().int().nonnegative()
  })).min(1, 'Phải gán ít nhất một thiết bị'),
  handoverNotes: z.string().optional(),
  customerSignatureUrl: z.string().url('Chữ ký khách hàng không hợp lệ'),
  photos: z.array(z.string().url()).min(2, 'Cần tối thiểu 2 ảnh đối chứng ngoại quan khi bàn giao')
});

export const checkinSettlementSchema = z.object({
  orderId: z.number().int().positive(),
  items: z.array(z.object({
    productItemId: z.number().int().positive(),
    finalShutterCount: z.number().int().nonnegative(),
    damageLevel: z.enum(['NONE', 'LIGHT_SCRATCH', 'MINOR', 'MODERATE', 'SEVERE', 'LOST']),
    damageDescription: z.string().optional(),
    damageFee: z.number().min(0, 'Phí hư hại không âm')
  })).min(1),
  lateHours: z.number().int().min(0).default(0),
  lateFee: z.number().min(0).default(0),
  refundDepositAmount: z.number().min(0),
  returnNotes: z.string().optional(),
  photos: z.array(z.string().url()).min(2, 'Cần ít nhất 2 ảnh đối chứng khi thu hồi')
});

export type CheckoutRecordInput = z.infer<typeof checkoutRecordSchema>;
export type CheckinSettlementInput = z.infer<typeof checkinSettlementSchema>;
