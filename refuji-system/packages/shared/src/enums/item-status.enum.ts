export const ItemStatus = {
  AVAILABLE: 'AVAILABLE',
  RENTED: 'RENTED',
  MAINTENANCE: 'MAINTENANCE',
  LOST: 'LOST'
} as const;

export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const ITEM_STATUS_LABELS: Record<ItemStatus, { label: string; color: string; bg: string }> = {
  [ItemStatus.AVAILABLE]: { label: 'Sẵn sàng giao ngay', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  [ItemStatus.RENTED]: { label: 'Đang cho thuê', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  [ItemStatus.MAINTENANCE]: { label: 'Đang bảo dưỡng', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  [ItemStatus.LOST]: { label: 'Thất lạc / Đã báo mất', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' }
};
