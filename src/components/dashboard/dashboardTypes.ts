// Kiểu dữ liệu & Hằng số nghiệp vụ tách riêng cho Phân hệ Dashboard Quản trị / POS ReFuji

export type DashboardTabId =
  | 'overview'
  | 'orders'
  | 'inventory'
  | 'catalog'
  | 'customers'
  | 'finance'
  | 'audit';

export type OrderStatusType =
  | 'GUEST_INQUIRY'
  | 'PENDING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'DELIVERED'
  | 'OVERDUE'
  | 'OVERDUE_CRITICAL'
  | 'RETURNED'
  | 'CANCELLED';

export type PaymentStatusType =
  | 'UNPAID'
  | 'DEPOSITED'
  | 'PAID_FULL'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type ItemStatusType = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'LOST';

export type DamageLevelType =
  | 'NONE'
  | 'LIGHT_SCRATCH'
  | 'MINOR'
  | 'MODERATE'
  | 'SEVERE'
  | 'LOST';

export const DAMAGE_LEVEL_OPTIONS: Array<{
  value: DamageLevelType;
  label: string;
  feePercent: number;
  defaultNextStatus: 'AVAILABLE' | 'MAINTENANCE' | 'LOST';
  description: string;
}> = [
  {
    value: 'NONE',
    label: 'Nguyên vẹn (0%)',
    feePercent: 0,
    defaultNextStatus: 'AVAILABLE',
    description: 'Trả máy nguyên trạng như biên bản Check-out',
  },
  {
    value: 'LIGHT_SCRATCH',
    label: 'Xước nhẹ ngoài vỏ (5% cọc)',
    feePercent: 5,
    defaultNextStatus: 'AVAILABLE',
    description: 'Vết xước < 2cm, không ảnh hưởng quang học hay chức năng',
  },
  {
    value: 'MINOR',
    label: 'Trầy xước / Cấn / Mất nắp (15% cọc)',
    feePercent: 15,
    defaultNextStatus: 'AVAILABLE',
    description: 'Bong cao su grip hoặc thiếu nắp body/lens cap',
  },
  {
    value: 'MODERATE',
    label: 'Hỏng nhẹ / Bụi nặng cảm biến (35% cọc)',
    feePercent: 35,
    defaultNextStatus: 'MAINTENANCE',
    description: 'Cần chuyển xưởng vệ sinh cảm biến / cân chỉnh chuyên sâu',
  },
  {
    value: 'SEVERE',
    label: 'Xước cảm biến / Gãy ngàm / Vào nước (70% cọc)',
    feePercent: 70,
    defaultNextStatus: 'MAINTENANCE',
    description: 'Hư hỏng phần cứng nghiêm trọng — tự động chuyển bảo dưỡng',
  },
  {
    value: 'LOST',
    label: 'Mất thiết bị / Hỏng hoàn toàn (100% cọc)',
    feePercent: 100,
    defaultNextStatus: 'LOST',
    description: 'Khấu trừ 100% tiền cọc & tính đền bù chênh lệch tài sản',
  },
];

export const ACCESSORY_CHECKLIST_ITEMS: Array<{ key: string; label: string }> = [
  { key: 'battery', label: 'Pin NP-W chính hãng' },
  { key: 'charger_cable', label: 'Sạc / Cáp USB-C PD' },
  { key: 'strap', label: 'Dây đeo máy' },
  { key: 'caps', label: 'Nắp Body / Nắp Lens' },
  { key: 'sd_card', label: 'Thẻ nhớ SD tốc độ cao' },
  { key: 'bag', label: 'Túi chống sốc ReFuji' },
];

export const ORDER_STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  GUEST_INQUIRY: {
    label: 'Đặt tại quầy (Chưa khóa)',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  PENDING_PAYMENT: {
    label: 'Giữ chỗ 15p',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  PENDING: {
    label: 'Chờ duyệt POS',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  DELIVERED: {
    label: 'Đang giao khách',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  OVERDUE: {
    label: 'Quá hạn trả',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  OVERDUE_CRITICAL: {
    label: 'Quá hạn >7 ngày',
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    border: 'border-rose-300',
    dot: 'bg-rose-600',
  },
  RETURNED: {
    label: 'Đã thu hồi & Quyết toán',
    bg: 'bg-neutral-100',
    text: 'text-[#14171f]',
    border: 'border-neutral-200',
    dot: 'bg-[#14171f]',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-neutral-50',
    text: 'text-neutral-500',
    border: 'border-neutral-200',
    dot: 'bg-neutral-400',
  },
};

export const PAYMENT_STATUS_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  UNPAID: { label: 'Chưa thanh toán', badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  DEPOSITED: { label: 'Đã thu cọc', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  PAID_FULL: { label: 'Đã thu đủ', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REFUNDED: { label: 'Đã hoàn 100% cọc', badgeClass: 'bg-sky-50 text-sky-800 border-sky-200' },
  PARTIALLY_REFUNDED: { label: 'Hoàn cọc sau trừ phí', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export const ITEM_STATUS_META: Record<
  ItemStatusType,
  { label: string; bg: string; text: string; border: string }
> = {
  AVAILABLE: { label: 'Sẵn sàng', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  RENTED: { label: 'Đang cho thuê', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  MAINTENANCE: { label: 'Đang bảo dưỡng', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  LOST: { label: 'Thất lạc / Hỏng', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export interface DashboardOverviewData {
  kpis: {
    grossRevenue: number;
    netRevenue: number;
    baseRentalRevenue: number;
    penaltyRevenue: number;
    maintenanceCostTotal: number;
    activeDepositHeld: number;
    totalOrders: number;
    guestOrdersCount: number;
    memberOrdersCount: number;
    totalSerials: number;
    availableSerials: number;
    reservedSerials?: number;
    rentedSerials: number;
    maintenanceSerials: number;
    lostSerials: number;
    occupancyPercent: number;
    statusCounts: Record<string, number>;
    openMaintenanceCount: number;
  };
  trendSeries: Array<{ date: string; revenue: number; orders: number; guestOrders: number }>;
  categoryBreakdown: Array<{ category: string; orders: number; revenue: number }>;
  topModels: Array<{
    id: number;
    model_name: string;
    category: string;
    image_url: string;
    base_rental_price_per_day: number;
    unit_count: number;
    rental_count: number;
    available_count: number;
  }>;
  pickupToday: any[];
  returnToday: any[];
  maintenanceDueItems: any[];
  recentTransactions: PaymentTransactionRow[];
  recentAuditLogs: AuditLogRow[];
  updatedAt: string;
}

export interface AdminOrderRow {
  id: number;
  order_code: string;
  user_id: number | null;
  is_guest: boolean;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  guest_note: string | null;
  membership_tier: 'GUEST' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  reputation_score: number | null;
  id_card_last4: string | null;
  model_id: string;
  model_name: string;
  start_date: string;
  expected_return_date: string;
  total_rent: number;
  deposit_amount: number;
  payment_method: string;
  payment_status: PaymentStatusType;
  order_status: OrderStatusType;
  payment_deadline: string | null;
  assigned_serials: string | null;
  cancellation_reason: string | null;
  quantity: number;
  items_detail: Array<{
    model_id: number | string;
    model_name: string;
    quantity: number;
    daily_rate?: number;
    unit_deposit?: number;
    assigned_serials?: string[];
  }>;
  created_at: string;
}

export interface OrderDossierData {
  order: AdminOrderRow & {
    daily_rent_sum: number;
    paid_deposit_amount: number;
    paid_rent_amount: number;
    missing_deposit_amount: number;
    missing_rent_amount: number;
    remaining_due: number;
  };
  assigned_item_units: ProductItemRow[];
  warehouse_serials: ProductItemRow[];
  checkout_record: {
    id: number;
    staff_name: string;
    checkout_date: string;
    kyc_verification_method: string;
    kyc_document_last4: string;
    contract_signed: number;
    accessories: Record<string, boolean>;
    shutter_snapshots: Record<string, number>;
    condition_notes: string;
  } | null;
  return_record: {
    id: number;
    staff_name: string;
    actual_return_date: string;
    late_hours: number;
    late_days: number;
    total_late_fee: number;
    total_damage_fee: number;
    total_missing_acc_fee: number;
    other_fee: number;
    other_fee_description: string | null;
    deposit_held: number;
    refund_amount: number;
    additional_charge_amount: number;
    staff_inspection_notes: string | null;
  } | null;
  return_items: any[];
  inspection_photos: Array<{
    id: number;
    order_code: string;
    serial_number: string | null;
    phase: 'CHECKOUT' | 'CHECKIN';
    photo_data: string;
    caption: string | null;
    uploaded_at: string;
  }>;
  transactions: PaymentTransactionRow[];
}

export interface SettlementCalculationResult {
  actualReturnDateIso: string;
  expectedDeadlineIso: string;
  diffHours: number;
  withinGracePeriod: boolean;
  lateDays: number;
  lateFeeBeforeCap: number;
  totalLateFee: number;
  lateFeeCapped: boolean;
  totalDamageFee: number;
  totalMissingAccFee: number;
  otherFee: number;
  totalPenalty: number;
  depositHeld: number;
  netSettlement: number;
  refundAmount: number;
  additionalChargeAmount: number;
  resultingPaymentStatus: 'REFUNDED' | 'PARTIALLY_REFUNDED';
  reputationDelta: number;
  computedItems: Array<{
    serial_number: string;
    model_name: string;
    condition_after: number;
    shutter_count_after: number;
    damage_level: DamageLevelType;
    damage_description: string;
    damage_fee: number;
    missing_accessories_fee: number;
    next_item_status: 'AVAILABLE' | 'MAINTENANCE' | 'LOST';
    accessories_returned: Record<string, boolean | number>;
  }>;
}

export interface ProductModelRow {
  id: number;
  model_name: string;
  category: 'BODY' | 'LENS' | 'ACCESSORY';
  mount_type: 'X_MOUNT' | 'G_MOUNT' | 'NONE';
  brand: string;
  base_rental_price_per_day: number;
  deposit_amount: number;
  description: string;
  specs_json: Record<string, any>;
  image_url: string;
  is_active: boolean;
  total_units: number;
  available_units: number;
  rented_units: number;
  maintenance_units: number;
  reserved_units?: number;
  storefront_available_units?: number;
}

export interface ProductItemRow {
  id: number;
  model_id: number;
  model_name: string;
  category?: string;
  mount_type?: string;
  image_url?: string;
  model_deposit?: number;
  serial_number: string;
  shutter_count: number;
  condition_percent: number;
  status: ItemStatusType;
  purchase_date?: string | null;
  purchase_price?: number | null;
  total_rental_count: number;
  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;
  note?: string | null;
  active_order_code?: string | null;
  active_order_status?: string | null;
  active_start_date?: string | null;
  active_end_date?: string | null;
  active_customer_name?: string | null;
  booking_kind?: 'DELIVERED' | 'RESERVED' | null;
}

export interface MaintenanceLogRow {
  id: number;
  item_id: number;
  serial_number: string;
  model_name: string;
  category: string;
  current_item_status: ItemStatusType;
  condition_percent: number;
  maintenance_type: string;
  description: string;
  cost: number;
  performed_by_name: string;
  external_vendor: string;
  shutter_at_service: number;
  started_at: string;
  completed_at: string | null;
  next_maintenance_date: string | null;
  created_at: string;
}

export interface CustomerRow {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  membership_tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  reputation_score: number;
  total_completed_rentals: number;
  is_active: boolean;
  created_at: string;
  id_card_last4: string | null;
  kyc_consent_at?: string | null;
  total_orders: number;
  total_spend: number;
}

export interface GuestSummaryRow {
  guest_phone: string;
  guest_name: string;
  guest_email: string;
  total_orders: number;
  pending_inquiries: number;
  total_rent_value: number;
  last_order_at: string;
}

export interface PaymentTransactionRow {
  id: number;
  order_id: number;
  order_code: string;
  transaction_code: string;
  amount: number;
  payment_method: string;
  transaction_type: string;
  gateway_transaction_id?: string | null;
  status: string;
  note: string | null;
  processed_by_name: string | null;
  created_at: string;
  model_name?: string;
  customer_name?: string;
}

export interface AuditLogRow {
  id: number;
  user_id: number | null;
  actor_type: 'USER' | 'SYSTEM_CRON' | 'PAYMENT_WEBHOOK';
  actor_label: string | null;
  actor_user_name?: string | null;
  actor_user_role?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
}

export function formatVnd(amount: number | null | undefined): string {
  const n = Math.round(Number(amount) || 0);
  return `${n.toLocaleString('vi-VN')}₫`;
}

export function formatShortDate(raw?: string | null): string {
  if (!raw) return '—';
  const s = String(raw).slice(0, 10);
  const parts = s.split('-');
  if (parts.length !== 3) return raw;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatDateTime(raw?: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTimeWithSeconds(raw?: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
