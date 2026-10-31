export const DamageLevel = {
  NONE: 'NONE',
  LIGHT_SCRATCH: 'LIGHT_SCRATCH',
  MINOR: 'MINOR',
  MODERATE: 'MODERATE',
  SEVERE: 'SEVERE',
  LOST: 'LOST'
} as const;

export type DamageLevel = (typeof DamageLevel)[keyof typeof DamageLevel];

export const DAMAGE_LEVEL_LABELS: Record<DamageLevel, { label: string; feePercent: number }> = {
  [DamageLevel.NONE]: { label: 'Nguyên vẹn', feePercent: 0 },
  [DamageLevel.LIGHT_SCRATCH]: { label: 'Xước nhẹ ngoài vỏ (< 2cm)', feePercent: 5 },
  [DamageLevel.MINOR]: { label: 'Trầy xước rõ / Cấn viền nhẹ', feePercent: 15 },
  [DamageLevel.MODERATE]: { label: 'Hỏng chi tiết ngoài / Ố kính nhẹ', feePercent: 35 },
  [DamageLevel.SEVERE]: { label: 'Móp méo / Lỗi cơ quang / Hỏng cảm biến', feePercent: 70 },
  [DamageLevel.LOST]: { label: 'Mất thiết bị / Không thể sửa chữa', feePercent: 100 }
};
