import { MembershipTier, MEMBERSHIP_TIER_CONFIG } from '../enums/membership-tier.enum.ts';

/**
 * Calculates the required deposit amount after applying membership tier discount.
 * Formula: Math.round(deposit * (1 - discountRate))
 *
 * @param deposit - Base standard deposit in VND
 * @param tier - Customer's membership tier (BRONZE, SILVER, GOLD, PLATINUM) or null for guest
 * @returns Final deposit amount in VND (rounded to whole integer)
 */
export function calcDeposit(deposit: number, tier?: MembershipTier | string | null): number {
  if (!deposit || deposit <= 0) return 0;
  if (!tier) return Math.round(deposit);

  const tierKey = (typeof tier === 'string' ? tier.toUpperCase() : tier) as MembershipTier;
  const config = MEMBERSHIP_TIER_CONFIG[tierKey];

  if (!config) return Math.round(deposit);

  const discounted = deposit * (1 - config.discountRate);
  return Math.round(discounted);
}

/**
 * Returns formatted currency string in Vietnamese Dong (VND)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}
