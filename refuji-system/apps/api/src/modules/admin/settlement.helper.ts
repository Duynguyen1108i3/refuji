// Tính năng: Bộ công thức nghiệp vụ Check-in Quyết toán, Phí trễ hạn (ân hạn 2h, trần 2x cọc), Hư hỏng & Điểm uy tín

export type DamageLevelType =
  | 'NONE'
  | 'LIGHT_SCRATCH'
  | 'MINOR'
  | 'MODERATE'
  | 'SEVERE'
  | 'LOST';

export interface DamageLevelRule {
  label: string;
  feePercent: number;
  defaultNextStatus: 'AVAILABLE' | 'MAINTENANCE' | 'LOST';
  description: string;
}

export const DAMAGE_LEVEL_RULES: Record<DamageLevelType, DamageLevelRule> = {
  NONE: {
    label: 'Nguyên vẹn',
    feePercent: 0,
    defaultNextStatus: 'AVAILABLE',
    description: 'Trả máy nguyên trạng như biên bản Check-out',
  },
  LIGHT_SCRATCH: {
    label: 'Xước nhẹ ngoài vỏ (< 2cm)',
    feePercent: 5,
    defaultNextStatus: 'AVAILABLE',
    description: 'Không ảnh hưởng quang học/chức năng — thu 5% tiền cọc',
  },
  MINOR: {
    label: 'Trầy xước / Cấn viền nhẹ',
    feePercent: 15,
    defaultNextStatus: 'AVAILABLE',
    description: 'Bong cao su grip, mất nắp body/lens cap — thu 15% tiền cọc',
  },
  MODERATE: {
    label: 'Hỏng nhẹ / Bụi nặng cảm biến',
    feePercent: 35,
    defaultNextStatus: 'MAINTENANCE',
    description: 'Cần gửi xưởng vệ sinh / bảo dưỡng — thu 35% tiền cọc',
  },
  SEVERE: {
    label: 'Xước cảm biến / Gãy ngàm / Vào nước',
    feePercent: 70,
    defaultNextStatus: 'MAINTENANCE',
    description: 'Hư hỏng nặng phần cứng — thu 70%–100% tiền cọc',
  },
  LOST: {
    label: 'Mất thiết bị / Hỏng hoàn toàn',
    feePercent: 100,
    defaultNextStatus: 'LOST',
    description: 'Thu 100% tiền cọc + Đền bù chênh lệch tài sản',
  },
};

export interface ItemInspectionInput {
  serial_number: string;
  model_name?: string;
  unit_deposit: number;
  condition_after: number;
  shutter_count_after: number;
  damage_level: DamageLevelType;
  damage_description?: string;
  custom_damage_fee?: number | null;
  accessories_returned?: Record<string, boolean | number>;
  missing_accessories_fee?: number;
  next_item_status?: 'AVAILABLE' | 'MAINTENANCE' | 'LOST';
}

export interface SettlementCalculationInput {
  expectedReturnDateStr: string;
  actualReturnDateIso: string;
  dailyRentSum: number;
  depositHeld: number;
  otherFee?: number;
  itemInspections: ItemInspectionInput[];
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

/**
 * Chuẩn hóa giờ hẹn trả tiêu chuẩn 20:00 (Asia/Ho_Chi_Minh UTC+7) nếu DB chỉ lưu YYYY-MM-DD
 */
export function buildExpectedDeadlineDate(expectedReturnDateStr: string): Date {
  const clean = String(expectedReturnDateStr || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return new Date(`${clean}T20:00:00+07:00`);
  }
  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function calculateCheckinSettlement(input: SettlementCalculationInput): SettlementCalculationResult {
  const expectedDeadline = buildExpectedDeadlineDate(input.expectedReturnDateStr);
  const actualDate = input.actualReturnDateIso ? new Date(input.actualReturnDateIso) : new Date();
  const safeActual = isNaN(actualDate.getTime()) ? new Date() : actualDate;

  // 1. Công thức Phí trễ hạn (Mục 4.2): Ân hạn 2 giờ; quá 2h -> LateDays = ceil((Δt - 2h)/24h), K=1.5, Trần = 2 * TotalDeposit
  const diffMs = safeActual.getTime() - expectedDeadline.getTime();
  const diffHours = Math.max(0, Number((diffMs / 3600000).toFixed(2)));
  const withinGracePeriod = diffHours <= 2;

  let lateDays = 0;
  let lateFeeBeforeCap = 0;
  let totalLateFee = 0;
  let lateFeeCapped = false;

  if (!withinGracePeriod) {
    lateDays = Math.max(1, Math.ceil((diffHours - 2) / 24));
    lateFeeBeforeCap = Math.round(lateDays * 1.5 * Math.max(0, input.dailyRentSum));
    const cap = Math.round(2 * Math.max(0, input.depositHeld));
    totalLateFee = Math.min(cap, lateFeeBeforeCap);
    lateFeeCapped = lateFeeBeforeCap > cap;
  }

  // 2. Tính phí hư hỏng & mất phụ kiện từng thiết bị
  let totalDamageFee = 0;
  let totalMissingAccFee = 0;
  let worstDamageRank = 0;
  const damageRankMap: Record<DamageLevelType, number> = {
    NONE: 0,
    LIGHT_SCRATCH: 1,
    MINOR: 2,
    MODERATE: 3,
    SEVERE: 4,
    LOST: 5,
  };

  const computedItems = input.itemInspections.map((it) => {
    const dmgLvl: DamageLevelType = DAMAGE_LEVEL_RULES[it.damage_level] ? it.damage_level : 'NONE';
    const rule = DAMAGE_LEVEL_RULES[dmgLvl];
    const autoDamageFee = Math.round(Math.max(0, it.unit_deposit) * (rule.feePercent / 100));
    const damageFee =
      typeof it.custom_damage_fee === 'number' && !isNaN(it.custom_damage_fee) && it.custom_damage_fee >= 0
        ? Math.round(it.custom_damage_fee)
        : autoDamageFee;
    const missingAccFee = Math.max(0, Math.round(Number(it.missing_accessories_fee) || 0));

    totalDamageFee += damageFee;
    totalMissingAccFee += missingAccFee;
    worstDamageRank = Math.max(worstDamageRank, damageRankMap[dmgLvl]);

    return {
      serial_number: it.serial_number,
      model_name: it.model_name || 'Thiết bị Fujifilm',
      condition_after: Math.min(100, Math.max(0, Math.round(Number(it.condition_after) || 95))),
      shutter_count_after: Math.max(0, Math.round(Number(it.shutter_count_after) || 0)),
      damage_level: dmgLvl,
      damage_description: (it.damage_description || '').trim(),
      damage_fee: damageFee,
      missing_accessories_fee: missingAccFee,
      next_item_status: it.next_item_status || rule.defaultNextStatus,
      accessories_returned: it.accessories_returned || {},
    };
  });

  const otherFee = Math.max(0, Math.round(Number(input.otherFee) || 0));
  const totalPenalty = totalLateFee + totalDamageFee + totalMissingAccFee + otherFee;
  const depositHeld = Math.max(0, Math.round(input.depositHeld));
  const netSettlement = depositHeld - totalPenalty;
  const refundAmount = Math.max(0, netSettlement);
  const additionalChargeAmount = Math.max(0, -netSettlement);
  const resultingPaymentStatus = totalPenalty === 0 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

  // 3. Điểm uy tín theo Mục 4.6
  let reputationDelta = 0;
  if (worstDamageRank === 5) {
    reputationDelta = -50;
  } else {
    if (lateDays === 0 && worstDamageRank === 0 && totalMissingAccFee === 0) {
      reputationDelta = 2;
    } else {
      if (lateDays >= 1 && lateDays <= 3) reputationDelta -= 5;
      else if (lateDays > 3) reputationDelta -= 15;
      if (worstDamageRank >= 2) reputationDelta -= 10;
    }
  }

  return {
    actualReturnDateIso: safeActual.toISOString(),
    expectedDeadlineIso: expectedDeadline.toISOString(),
    diffHours,
    withinGracePeriod,
    lateDays,
    lateFeeBeforeCap,
    totalLateFee,
    lateFeeCapped,
    totalDamageFee,
    totalMissingAccFee,
    otherFee,
    totalPenalty,
    depositHeld,
    netSettlement,
    refundAmount,
    additionalChargeAmount,
    resultingPaymentStatus,
    reputationDelta,
    computedItems,
  };
}
