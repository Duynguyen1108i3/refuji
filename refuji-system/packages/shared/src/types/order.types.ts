import { OrderStatus } from '../enums/order-status.enum.ts';
import { ProductModelEntity, ProductItemEntity } from './catalog.types.ts';

export interface RentalOrderDetailEntity {
  id: number;
  orderId: number;
  productModelId: number;
  productItemId?: number | null;
  unitRentalPrice: number;
  unitDepositAmount: number;
  model?: ProductModelEntity;
  item?: ProductItemEntity;
}

export interface RentalOrderEntity {
  id: number;
  orderCode: string;
  userId: number;
  status: OrderStatus;
  rentalStartDate: string; // ISO 8601
  rentalEndDate: string; // ISO 8601
  totalRentAmount: number;
  totalDepositAmount: number;
  depositDiscountAmount: number;
  finalAmount: number; // rent + (deposit - discount)
  createdAt: string;
  updatedAt: string;
  details: RentalOrderDetailEntity[];
}
