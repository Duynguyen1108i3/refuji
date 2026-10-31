import React, { useState } from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { DamageLevel, DAMAGE_LEVEL_LABELS, formatVND } from '@refuji/shared';
import { Printer, CheckCircle2 } from 'lucide-react';

export const CheckinSettlementPage: React.FC = () => {
  const [orderCode, setOrderCode] = useState('RFJ-20261030-9841');
  const [baseDeposit] = useState(5310000); // 10% Gold discount from 5.9m
  const [lateHours, setLateHours] = useState(0);
  const [damageLevel, setDamageLevel] = useState<DamageLevel>(DamageLevel.NONE);
  const [isSettled, setIsSettled] = useState(false);

  const lateFee = lateHours * 50000;
  const damageFee = Math.round(baseDeposit * (DAMAGE_LEVEL_LABELS[damageLevel].feePercent / 100));
  const refundAmount = Math.max(0, baseDeposit - lateFee - damageFee);

  return (
    <StaffPosLayout activeKey="checkin">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">THU HỒI & QUYẾT TOÁN HOÀN CỌC (CHECK-IN)</h1>
        <p className="text-xs text-zinc-400 mb-8">Nghiệm thu tình trạng thiết bị, tính toán phí phát sinh và lập phiếu hoàn cọc</p>

        {isSettled ? (
          <div className="liquid-glass rounded-2xl p-8 border border-emerald-500/30 text-center flex flex-col items-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">QUYẾT TOÁN THÀNH CÔNG</h2>
            <p className="text-sm text-zinc-300">
              Đơn hàng <strong>#{orderCode}</strong> đã thu hồi. Tiền cọc hoàn trả khách: <strong className="text-emerald-400 num">{formatVND(refundAmount)}</strong>.
            </p>
            <Button variant="primary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              <span>In Phiếu quyết toán & Hoàn cọc</span>
            </Button>
          </div>
        ) : (
          <div className="liquid-glass rounded-2xl p-6 border border-white/15 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Mã đơn hàng" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} />
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Số giờ trả trễ (Late Hours)</label>
                <input
                  type="number"
                  min="0"
                  value={lateHours}
                  onChange={(e) => setLateHours(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none num"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">Thẩm định mức độ hao mòn / hư hại</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(DAMAGE_LEVEL_LABELS).map(([lvl, config]) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDamageLevel(lvl as DamageLevel)}
                    className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                      damageLevel === lvl
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-bold block">{config.label}</span>
                    <span className="text-zinc-400 text-[11px] block mt-1 num">
                      {config.feePercent > 0 ? `Khấu trừ ${config.feePercent}% cọc` : 'Không khấu trừ'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settlement Calculation Summary */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Tiền cọc ban đầu nhận:</span>
                <span className="font-bold text-white num">{formatVND(baseDeposit)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Phí trả trễ ({lateHours}h x 50k):</span>
                <span className="font-bold num">-{formatVND(lateFee)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Phí bồi hoàn hao mòn:</span>
                <span className="font-bold num">-{formatVND(damageFee)}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-emerald-400">
                <span>TIỀN CỌC HOÀN TRẢ KHÁCH:</span>
                <span className="text-base num">{formatVND(refundAmount)}</span>
              </div>
            </div>

            <Button variant="primary" size="lg" className="w-full font-bold" onClick={() => setIsSettled(true)}>
              Hoàn tất thu hồi & Hoàn cọc cho khách
            </Button>
          </div>
        )}
      </div>
    </StaffPosLayout>
  );
};
