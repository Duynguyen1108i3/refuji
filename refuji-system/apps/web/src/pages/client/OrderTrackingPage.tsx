import React from 'react';
import { CheckCircle2, Clock, Package, Camera, ArrowLeft } from 'lucide-react';
import { StatusBadge } from '../../components/badges/StatusBadge.tsx';
import { OrderStatus } from '@refuji/shared';

export const OrderTrackingPage: React.FC = () => {
  const order = {
    code: 'RFJ-20261030-9841',
    status: OrderStatus.DELIVERED,
    startDate: '30/10/2026 14:00',
    endDate: '01/11/2026 18:00',
    serials: [
      { name: 'Fujifilm X-T5 Body Silver', serial: '3A014582', shutterAtCheckin: 4120 },
      { name: 'Fujinon XF 35mm f/1.4 R', serial: '1DA05421', shutterAtCheckin: 0 }
    ],
    photos: [
      '/assets/catalog/fujifilm-xt5-silver.webp',
      '/assets/catalog/fujinon-xf-35mm-f14.webp'
    ]
  };

  const steps = [
    { title: 'Đặt chỗ & Cọc VNPAY', done: true, time: '30/10 13:45' },
    { title: 'Duyệt hồ sơ & Kiểm tra kho', done: true, time: '30/10 13:55' },
    { title: 'Bàn giao thiết bị tại Showroom', done: true, time: '30/10 14:05' },
    { title: 'Đang trải nghiệm máy', active: true, time: 'Hiện tại' },
    { title: 'Nghiệm thu & Hoàn cọc', done: false, time: 'Dự kiến 01/11 18:00' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <a href="/orders" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Về danh sách đơn thuê</span>
      </a>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1">
            TIẾN ĐỘ ĐƠN #{order.code}
          </h1>
          <p className="text-xs text-zinc-400">Thời gian thuê: {order.startDate} → {order.endDate}</p>
        </div>
        <StatusBadge status={order.status} type="order" />
      </div>

      {/* Timeline Steps */}
      <div className="liquid-glass rounded-2xl p-6 mb-8 border border-white/15">
        <h2 className="text-sm font-bold text-white mb-6">Lộ trình đơn hàng</h2>
        <div className="relative flex flex-col md:flex-row justify-between gap-4">
          {steps.map((st, i) => (
            <div key={i} className="flex md:flex-col items-center md:text-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  st.done
                    ? 'bg-emerald-500 text-black'
                    : st.active
                    ? 'bg-amber-400 text-black animate-pulse'
                    : 'bg-zinc-800 text-zinc-500 border border-white/10'
                }`}
              >
                {st.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <div>
                <p className={`text-xs font-semibold ${st.active ? 'text-amber-400' : st.done ? 'text-white' : 'text-zinc-500'}`}>
                  {st.title}
                </p>
                <span className="text-[11px] text-zinc-400 block num">{st.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Serials currently held */}
      <div className="liquid-glass rounded-2xl p-6 mb-8 border border-white/15">
        <h2 className="text-sm font-bold text-white mb-4">Thiết bị & Số Seri đang giữ</h2>
        <div className="flex flex-col gap-3">
          {order.serials.map((s, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{s.name}</p>
                <p className="text-xs text-zinc-400 font-mono">Serial: {s.serial}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-400 block">Số shot khi nhận</span>
                <span className="text-xs font-semibold text-emerald-400 num">
                  {s.shutterAtCheckin > 0 ? `${s.shutterAtCheckin} shots` : 'Ống kính'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspection Photos */}
      <div className="liquid-glass rounded-2xl p-6 border border-white/15">
        <h2 className="text-sm font-bold text-white mb-4">Ảnh đối chứng khi Check-out</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {order.photos.map((url, i) => (
            <div key={i} className="aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/15 p-2 flex items-center justify-center">
              <img src={url} alt={`Đối chứng ${i + 1}`} className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
