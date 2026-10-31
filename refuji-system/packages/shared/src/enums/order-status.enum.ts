export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  DELIVERED: 'DELIVERED',
  OVERDUE: 'OVERDUE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  [OrderStatus.PENDING_PAYMENT]: { label: 'Chờ thanh toán', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  [OrderStatus.PENDING]: { label: 'Chờ duyệt', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  [OrderStatus.CONFIRMED]: { label: 'Đã xác nhận', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  [OrderStatus.DELIVERED]: { label: 'Đang thuê', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
  [OrderStatus.OVERDUE]: { label: 'Quá hạn', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  [OrderStatus.COMPLETED]: { label: 'Hoàn thành', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  [OrderStatus.CANCELLED]: { label: 'Đã hủy', color: 'text-zinc-400', bg: 'bg-zinc-800/40 border-zinc-700/30' },
  [OrderStatus.REFUNDED]: { label: 'Đã hoàn tiền', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' }
};
