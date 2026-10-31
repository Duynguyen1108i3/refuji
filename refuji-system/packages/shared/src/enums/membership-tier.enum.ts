export const MembershipTier = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM'
} as const;

export type MembershipTier = (typeof MembershipTier)[keyof typeof MembershipTier];

export interface TierBenefit {
  tier: MembershipTier;
  name: string;
  discountRate: number; // e.g. 0.10 for 10%
  discountPercent: number; // e.g. 10
  minRentals: number;
  minScore: number;
  badgeColor: string;
  borderColor: string;
  description: string;
}

export const MEMBERSHIP_TIER_CONFIG: Record<MembershipTier, TierBenefit> = {
  [MembershipTier.BRONZE]: {
    tier: MembershipTier.BRONZE,
    name: 'Hạng Đồng',
    discountRate: 0.0,
    discountPercent: 0,
    minRentals: 0,
    minScore: 0,
    badgeColor: 'text-amber-600 bg-amber-500/10',
    borderColor: 'border-amber-600/30',
    description: 'Hạng mặc định cho tài khoản mới'
  },
  [MembershipTier.SILVER]: {
    tier: MembershipTier.SILVER,
    name: 'Hạng Bạc',
    discountRate: 0.05,
    discountPercent: 5,
    minRentals: 5,
    minScore: 80,
    badgeColor: 'text-slate-300 bg-slate-300/10',
    borderColor: 'border-slate-300/30',
    description: 'Giảm 5% cọc, kiểm tra nhanh'
  },
  [MembershipTier.GOLD]: {
    tier: MembershipTier.GOLD,
    name: 'Hạng Vàng',
    discountRate: 0.10,
    discountPercent: 10,
    minRentals: 15,
    minScore: 90,
    badgeColor: 'text-amber-400 bg-amber-400/10',
    borderColor: 'border-amber-400/30',
    description: 'Giảm 10% cọc, ưu tiên duyệt đơn'
  },
  [MembershipTier.PLATINUM]: {
    tier: MembershipTier.PLATINUM,
    name: 'Hạng Bạch Kim',
    discountRate: 0.15,
    discountPercent: 15,
    minRentals: 30,
    minScore: 95,
    badgeColor: 'text-emerald-400 bg-emerald-400/10',
    borderColor: 'border-emerald-400/30',
    description: 'Giảm 15% cọc, làn ưu tiên Fast-track nhận máy'
  }
};
