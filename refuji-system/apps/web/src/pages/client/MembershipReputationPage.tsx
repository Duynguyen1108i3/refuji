import React from 'react';
import { MembershipTierBadge } from '../../components/badges/MembershipTierBadge.tsx';
import { MEMBERSHIP_TIER_CONFIG, MembershipTier } from '@refuji/shared';
import { Award, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export const MembershipReputationPage: React.FC = () => {
  const user = {
    currentTier: MembershipTier.GOLD,
    completedRentals: 18,
    reputationScore: 94
  };

  const tiers = Object.values(MEMBERSHIP_TIER_CONFIG);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-1">
            HẠNG THÀNH VIÊN & ĐIỂM UY TÍN
          </h1>
          <p className="text-sm text-zinc-400">
            Hệ thống điểm uy tín ghi nhận qua từng lượt hoàn trả đúng hạn và giữ gìn thiết bị.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MembershipTierBadge tier={user.currentTier} showDiscount />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="liquid-glass rounded-2xl p-5 border border-white/15">
          <span className="text-xs text-zinc-400 block mb-1">Điểm uy tín hiện tại</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 num">{user.reputationScore}</span>
            <span className="text-xs text-zinc-400">/ 100 điểm</span>
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-5 border border-white/15">
          <span className="text-xs text-zinc-400 block mb-1">Lượt thuê hoàn tất</span>
          <span className="text-3xl font-bold text-white num">{user.completedRentals}</span>
        </div>

        <div className="liquid-glass rounded-2xl p-5 border border-white/15">
          <span className="text-xs text-zinc-400 block mb-1">Đặc quyền giảm cọc</span>
          <span className="text-3xl font-bold text-amber-400 num">-10%</span>
        </div>
      </div>

      {/* Tier Roadmap */}
      <h2 className="text-xl font-serif font-bold text-white mb-4">Các cấp bậc thành viên</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((t) => {
          const isCurrent = t.tier === user.currentTier;
          return (
            <div
              key={t.tier}
              className={`rounded-2xl p-5 border flex flex-col justify-between ${
                isCurrent
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                  : 'liquid-glass border-white/15'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white">{t.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase bg-emerald-500 text-black px-2 py-0.5 rounded-full">
                      Hiện tại
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-emerald-400 num mb-2">
                  {t.discountPercent > 0 ? `-${t.discountPercent}% cọc` : 'Cọc gốc'}
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">{t.description}</p>
              </div>

              <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-400 flex flex-col gap-1">
                <span>Tối thiểu: <strong className="text-white num">{t.minRentals}</strong> đơn</span>
                <span>Điểm tối thiểu: <strong className="text-white num">{t.minScore}</strong> điểm</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
