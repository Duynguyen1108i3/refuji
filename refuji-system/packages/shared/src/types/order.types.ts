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

// Tính năng: Mở rộng kiểu dữ liệu đơn thuê hỗ trợ khách vãng lai (userId nullable và thông tin liên hệ khách)
export interface RentalOrderEntity {
  id: number;
  orderCode: string;
  userId: number | null;
  isGuest?: boolean;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  guestNote?: string | null;
  paymentMethod?: string | null;
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
