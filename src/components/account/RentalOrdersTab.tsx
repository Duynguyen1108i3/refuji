import React, { useState, useEffect } from 'react';
import { Package, Loader2, Camera, Calendar } from 'lucide-react';
import { RentalOrderRecord } from './types';
import { getAccessTokenInMemory } from '../../services/authApi';

interface RentalOrdersTabProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RentalOrdersTab: React.FC<RentalOrdersTabProps> = ({ isOpen, onClose }) => {
  const [myOrders, setMyOrders] = useState<RentalOrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingOrders(true);
      const token = getAccessTokenInMemory();
      fetch('/api/orders/my-orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setMyOrders(data))
        .catch(() => setMyOrders([]))
        .finally(() => setIsLoadingOrders(false));
    }
  }, [isOpen]);

  return (
    <div className="w-full flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#14171f] flex items-center gap-1.5">
            <Package size={14} />
            <span>Danh Sách Đơn Thuê Thiết Bị</span>
          </h4>
          <span className="text-[11px] text-[#6e7587]">{myOrders.length} đơn hàng</span>
        </div>

        {isLoadingOrders ? (
          <div className="py-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-neutral-400" />
            <span>Đang tải danh sách đơn thuê...</span>
          </div>
        ) : myOrders.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#14171f]/15 bg-[#fbfbfc] p-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 shadow-inner">
              <Package size={24} className="text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#14171f]">Bạn chưa có đơn thuê nào</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Mỗi đơn thuê hoàn tất thành công sẽ được tích lũy vào tiến độ nâng hạng tự động (3 đơn lên Hạng Bạc, 8 đơn lên Hạng Vàng, 15 đơn lên Bạch Kim).
              </p>
            </div>
            <a
              href="#explore"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs font-medium shadow-sm transition-all active:scale-95"
            >
              <Camera size={13} />
              <span>Xem máy ảnh sẵn có</span>
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl border border-[#14171f]/10 bg-[#f9fafb] hover:border-[#14171f]/25 transition-all text-left space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#14171f]">
                    {ord.order_code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    {ord.order_status === 'PENDING_PAYMENT' ? 'Giữ chỗ 15 phút' : ord.order_status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#14171f]">{ord.model_name}</span>
                  <span className="font-bold text-[#14171f]">
                    {(ord.total_rent || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {ord.start_date} → {ord.expected_return_date}
                  </span>
                  <span>Cọc: {(ord.deposit_amount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
