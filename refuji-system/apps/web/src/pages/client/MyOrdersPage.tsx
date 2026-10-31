import React, { useState } from 'react';
import { StatusBadge } from '../../components/badges/StatusBadge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { OrderStatus, formatVND } from '@refuji/shared';

export const MyOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  const orders = [
    {
      orderCode: 'RFJ-20261030-9841',
      status: OrderStatus.CONFIRMED,
      startDate: '30/10/2026 14:00',
      endDate: '01/11/2026 18:00',
      models: ['Fujifilm X-T5 Body Silver', 'Fujinon XF 35mm f/1.4 R'],
      totalAmount: 6760000,
      canCancel: true
    },
    {
      orderCode: 'RFJ-20260915-4102',
      status: OrderStatus.COMPLETED,
      startDate: '15/09/2026 09:00',
      endDate: '18/09/2026 17:00',
      models: ['Fujifilm X100VI Silver'],
      totalAmount: 6900000,
      canCancel: false
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-serif font-bold text-white mb-2">ĐƠN HÀNG THUÊ CỦA TÔI</h1>
      <p className="text-sm text-zinc-400 mb-8">Quản lý lịch sử thuê máy ảnh, mã theo dõi và biên bản bàn giao điện tử.</p>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3 mb-6">
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === tab ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'ALL' ? 'Tất cả đơn' : tab === 'ACTIVE' ? 'Đang thực hiện' : 'Đã hoàn tất'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {orders.map((ord) => (
          <div key={ord.orderCode} className="liquid-glass rounded-2xl p-5 border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm font-bold text-white">#{ord.orderCode}</span>
                <StatusBadge status={ord.status} type="order" />
              </div>
              <p className="text-xs text-zinc-300 font-medium">{ord.models.join(' + ')}</p>
              <p className="text-xs text-zinc-400 num mt-1">Lịch thuê: {ord.startDate} → {ord.endDate}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-zinc-400 block">Tổng thanh toán</span>
                <span className="text-sm font-bold text-emerald-400 num">{formatVND(ord.totalAmount)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { window.location.href = `/orders/tracking/${ord.orderCode}`; }}
              >
                Chi tiết đơn
              </Button>
              {ord.canCancel && (
                <Button variant="danger" size="sm" onClick={() => alert('Xác nhận hủy đơn hàng?')}>
                  Hủy đơn
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
