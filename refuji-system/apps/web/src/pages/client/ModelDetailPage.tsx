import React, { useState } from 'react';
import { ShieldCheck, Calendar, Clock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';
import { RentalDateTimePicker } from '../../components/pickers/RentalDateTimePicker.tsx';
import { PRODUCT_FIXTURES } from '../../services/catalog-fixtures.ts';
import { formatVND, calcDeposit, MembershipTier, ProductModelEntity } from '@refuji/shared';

interface ModelDetailPageProps {
  model?: ProductModelEntity;
  userTier?: MembershipTier | null;
}

export const ModelDetailPage: React.FC<ModelDetailPageProps> = ({
  model = PRODUCT_FIXTURES[0],
  userTier = null
}) => {
  const [selectedDurationDays, setSelectedDurationDays] = useState(2);
  const effectiveDeposit = calcDeposit(model.depositAmount, userTier);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <a href="/catalog" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh mục</span>
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Product Images & Specs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="aspect-[4/3] rounded-2xl liquid-glass border border-white/20 p-6 flex items-center justify-center bg-zinc-950/60">
            <img src={model.imageUrl} alt={model.modelName} className="max-h-full object-contain" />
          </div>

          <div className="liquid-glass rounded-2xl p-6 border border-white/15">
            <h2 className="text-base font-bold text-white mb-3">Thông số kỹ thuật chi tiết</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {model.specsJson && Object.entries(model.specsJson).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-zinc-400 capitalize block mb-0.5">{k}</span>
                  <span className="text-white font-medium num">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Booking Panel & Availability */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="liquid-glass rounded-2xl p-6 border border-white/15">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold mb-1 block">
              {model.brand} • {model.mount === 'FIXED' ? 'Fixed Lens' : `Ngàm ${model.mount}`}
            </span>
            <h1 className="text-2xl font-bold font-serif text-white mb-2">{model.modelName}</h1>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">{model.description}</p>

            {/* Price calculation block */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Giá thuê mỗi ngày:</span>
                <span className="font-bold text-emerald-400 num">{formatVND(model.baseRentalPricePerDay)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Tiền cọc quy định:</span>
                <div className="text-right">
                  {effectiveDeposit < model.depositAmount && (
                    <span className="text-xs text-zinc-500 line-through mr-2 num">{formatVND(model.depositAmount)}</span>
                  )}
                  <span className="font-semibold text-white num">{formatVND(effectiveDeposit)}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center font-bold text-white">
                <span>Ước tính ({selectedDurationDays} ngày):</span>
                <span className="text-emerald-400 num">
                  {formatVND(model.baseRentalPricePerDay * selectedDurationDays + effectiveDeposit)}
                </span>
              </div>
            </div>

            {/* Date time picker */}
            <div className="mb-6">
              <RentalDateTimePicker
                onChange={({ durationDays }) => setSelectedDurationDays(durationDays)}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-xl shadow-emerald-950/50"
              onClick={() => {
                window.location.href = `/checkout?modelId=${model.id}&days=${selectedDurationDays}`;
              }}
            >
              Tiến hành giữ chỗ 15 phút
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
