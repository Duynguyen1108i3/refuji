import React from 'react';
import { Award, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { MembershipTier, MEMBERSHIP_TIER_CONFIG } from '@refuji/shared';

interface MembershipTierBadgeProps {
  tier: MembershipTier;
  showDiscount?: boolean;
  className?: string;
}

export const MembershipTierBadge: React.FC<MembershipTierBadgeProps> = ({
  tier,
  showDiscount = false,
  className = ''
}) => {
  const config = MEMBERSHIP_TIER_CONFIG[tier] || MEMBERSHIP_TIER_CONFIG.BRONZE;

  const getTierIcon = () => {
    switch (tier) {
      case MembershipTier.PLATINUM:
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />;
      case MembershipTier.GOLD:
        return <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />;
      case MembershipTier.SILVER:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />;
      case MembershipTier.BRONZE:
      default:
        return <Award className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.borderColor} ${config.badgeColor} ${className}`}
    >
      {getTierIcon()}
      <span>{config.name}</span>
      {showDiscount && config.discountPercent > 0 && (
        <span className="ml-0.5 opacity-90 num">(-{config.discountPercent}% cọc)</span>
      )}
    </span>
  );
};
