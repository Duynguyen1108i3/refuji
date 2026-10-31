import { DamageLevel } from '../enums/damage-level.enum.ts';
import { ItemStatus } from '../enums/item-status.enum.ts';

export interface ReturnItemDetailEntity {
  id: number;
  returnRecordId: number;
  productItemId: number;
  serialNumber?: string;
  damageLevel: DamageLevel;
  damageDescription?: string;
  damageFee: number;
  itemReturnedStatus: ItemStatus;
}

export interface CheckoutRecordEntity {
  id: number;
  orderId: number;
  orderCode: string;
  staffId: number;
  handoverTime: string;
  handoverNotes?: string;
  customerSignatureUrl?: string;
  photos: string[]; // Cloudinary signed URLs
  status: string;
}

export interface ReturnRecordEntity {
  id: number;
  orderId: number;
  orderCode: string;
  staffId: number;
  returnTime: string;
  returnNotes?: string;
  lateHours: number;
  lateFee: number;
  totalDamageFee: number;
  refundDepositAmount: number;
  customerSignatureUrl?: string;
  photos: string[];
  status: string;
  itemDetails: ReturnItemDetailEntity[];
}
