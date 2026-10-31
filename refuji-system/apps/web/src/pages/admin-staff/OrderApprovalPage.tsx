import React, { useState } from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Check, X, ShieldAlert } from 'lucide-react';
import { formatVND } from '@refuji/shared';

export const OrderApprovalPage: React.FC = () => {
  const [queue, setQueue] = useState([
    {
      orderCode: 'RFJ-20261030-9841',
      customer: 'Nguyễn Hoàng Long',
      phone: '0912345678',
      reputationScore: 94,
      tier: 'GOLD',
      items: ['Fujifilm X-T5 Silver', 'XF 35mm f/1.4'],
      time: '30/10 14:00 → 01/11 18:00',
      totalAmount: 6760000
    },
    {
      orderCode: 'RFJ-20261030-9855',
      customer: 'Lê Quốc Bảo',
      phone: '0987654321',
      reputationScore: 78,
      tier: 'BRONZE',
      items: ['Fujifilm X100VI Silver'],
      time: '31/10 09:00 → 02/11 19:00',
      totalAmount: 6500000
    }
  ]);

  const handleApprove = (code: string) => {
    alert(`Đã duyệt đơn #${code} thành CONFIRMED. Khách hàng nhận được email thông báo.`);
    setQueue(queue.filter((q) => q.orderCode !== code));
  };

  return (
    <StaffPosLayout activeKey="approval">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">HÀNG ĐỢI DUYỆT ĐƠN THUÊ</h1>
        <p className="text-xs text-zinc-400 mb-8">Thẩm định hồ sơ khách hàng, điểm uy tín và xác nhận giữ Serial máy</p>

        <div className="flex flex-col gap-4">
          {queue.map((item) => (
            <div key={item.orderCode} className="liquid-glass rounded-2xl p-5 border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-white">#{item.orderCode}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    Chờ nhân viên duyệt
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {item.customer} ({item.phone}) • Hạng: <strong className="text-amber-400">{item.tier}</strong>
                </p>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="text-zinc-400">Điểm uy tín:</span>
                  <span className={`font-bold num ${item.reputationScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {item.reputationScore}/100
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-2">{item.items.join(' + ')}</p>
                <p className="text-xs text-zinc-400 num">Lịch hẹn: {item.time}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right mr-2">
                  <span className="text-[11px] text-zinc-400 block">Đã cọc VNPAY</span>
                  <span className="text-sm font-bold text-emerald-400 num">{formatVND(item.totalAmount)}</span>
                </div>
                <Button variant="primary" size="sm" onClick={() => handleApprove(item.orderCode)}>
                  <Check className="w-4 h-4 mr-1" />
                  <span>Duyệt đơn</span>
                </Button>
                <Button variant="danger" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StaffPosLayout>
  );
};
