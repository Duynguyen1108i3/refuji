import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, Loader2, Camera, Calendar, Clock, CreditCard, Search, ChevronDown, X, Ban, AlertCircle } from 'lucide-react';
import { RentalOrderRecord } from './types';
import { getAccessTokenInMemory, cancelMyOrder } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';
import { PaymentModal } from '../PaymentModal';
import { GuestOrderLookupPanel } from '../booking/GuestOrderLookupPanel';

interface RentalOrdersTabProps {
  isOpen: boolean;
  onClose: () => void;
}

// Tính năng: Tích hợp tìm kiếm đơn thuê thành viên & tra cứu đơn khách vãng lai (Mã đơn + SĐT) ngay trong Dashboard
export const RentalOrdersTab: React.FC<RentalOrdersTabProps> = ({ isOpen, onClose }) => {
  const { setToast } = useAuth();
  const [myOrders, setMyOrders] = useState<RentalOrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedPayOrder, setSelectedPayOrder] = useState<RentalOrderRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuestLookup, setShowGuestLookup] = useState(false);
  const [cancellingCode, setCancellingCode] = useState<string | null>(null);
  const [orderActionError, setOrderActionError] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
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
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
    const handleRefresh = () => {
      if (isOpen) {
        loadOrders();
      }
    };
    window.addEventListener('refuji_reservation_updated', handleRefresh);
    window.addEventListener('refuji_catalog_refresh', handleRefresh);
    return () => {
      window.removeEventListener('refuji_reservation_updated', handleRefresh);
      window.removeEventListener('refuji_catalog_refresh', handleRefresh);
    };
  }, [isOpen, loadOrders]);

  const calculateDays = (s: string, e: string) => {
    const sDate = new Date(s);
    const eDate = new Date(e);
    const diff = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };

  // Tính năng: Thành viên tự hủy giữ chỗ / hủy đơn chờ duyệt trực tiếp trong Dashboard Đơn thuê
  const handleCancelMemberOrder = async (orderCode: string) => {
    setOrderActionError(null);
    setCancellingCode(orderCode);
    try {
      await cancelMyOrder(orderCode);
      try {
        const rawRes = localStorage.getItem('refuji_active_reservation');
        if (rawRes) {
          const parsed = JSON.parse(rawRes);
          if (parsed.orderCode === orderCode) {
            localStorage.removeItem('refuji_active_reservation');
            window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
          }
        }
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      loadOrders();
      if (setToast) {
        setToast({
          id: Date.now().toString(),
          message: `Đã hủy giữ chỗ đơn #${orderCode} và trả thiết bị về kho.`,
          type: 'info',
        });
      }
    } catch (err: any) {
      setOrderActionError(err?.message || 'Không thể hủy đơn hàng này.');
    } finally {
      setCancellingCode(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return myOrders;
    return myOrders.filter((ord) => {
      const code = (ord.order_code || '').toLowerCase();
      const model = (ord.model_name || '').toLowerCase();
      const serials = (ord.assigned_serials || '').toLowerCase();
      return code.includes(q) || model.includes(q) || serials.includes(q);
    });
  }, [myOrders, searchQuery]);

  return (
    <div className="w-full flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#14171f] flex items-center gap-1.5">
            <Package size={14} />
            <span>Danh Sách Đơn Thuê Thiết Bị</span>
          </h4>
          <span className="text-[11px] text-[#6e7587] font-sans num">
            {filteredOrders.length} / {myOrders.length} đơn hàng
          </span>
        </div>

        {/* Ô tìm kiếm đơn nhanh & nút mở tra cứu đơn đặt vãng lai */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh theo mã đơn (#ORD...), tên máy hoặc Serial..."
              className="w-full pl-9 pr-8 py-2 rounded-full border border-[#14171f]/15 bg-[#f9fafb] text-xs text-[#14171f] placeholder:text-neutral-400 focus:outline-none focus:border-[#14171f] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa tìm đơn"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-[#14171f] cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowGuestLookup((v) => !v)}
            className={`px-4 py-2 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              showGuestLookup
                ? 'bg-[#14171f] text-white border-[#14171f]'
                : 'bg-white hover:bg-neutral-50 text-[#14171f] border-[#14171f]/15'
            }`}
          >
            <Search size={13} />
            <span>Tra cứu đơn không đăng nhập</span>
            <ChevronDown size={13} className={`transition-transform ${showGuestLookup ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showGuestLookup && (
          <div className="p-4 rounded-3xl border border-[#14171f]/12 bg-[#f9fafb]/80 space-y-3">
            <p className="text-[11px] text-[#6e7587] leading-relaxed">
              Nếu bạn có đơn đã đặt nhanh trước đó (không qua tài khoản), nhập <strong>Mã đơn</strong> và <strong>SĐT</strong> để xem hoặc hủy giữ chỗ:
            </p>
            <GuestOrderLookupPanel
              isActive={showGuestLookup}
              compact
              onOrderCancelled={() => loadOrders()}
              onCloseParent={onClose}
            />
          </div>
        )}

        {orderActionError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{orderActionError}</span>
          </div>
        )}

        {/* Tính năng: Đồng bộ font chữ dự án (.num) & bo tròn card/pill danh sách đơn */}
        {isLoadingOrders ? (
          <div className="py-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-neutral-400" />
            <span>Đang tải danh sách đơn thuê...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center rounded-3xl border border-dashed border-[#14171f]/15 bg-[#fbfbfc] p-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 shadow-inner">
              <Package size={24} className="text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#14171f]">
                {searchQuery.trim() ? 'Không tìm thấy đơn hàng phù hợp' : 'Bạn chưa có đơn thuê nào'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                {searchQuery.trim()
                  ? `Không có đơn nào khớp với "${searchQuery.trim()}". Bạn có thể xóa từ khóa hoặc dùng mục "Tra cứu đơn không đăng nhập" ở trên.`
                  : 'Mỗi đơn thuê hoàn tất thành công sẽ được tích lũy vào tiến độ nâng hạng tự động (3 đơn lên Hạng Bạc, 8 đơn lên Hạng Vàng, 15 đơn lên Bạch Kim).'}
              </p>
            </div>
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs font-medium shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Xóa từ khóa tìm kiếm</span>
              </button>
            ) : (
              <a
                href="#explore"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs font-medium shadow-sm transition-all active:scale-95"
              >
                <Camera size={13} />
                <span>Xem máy ảnh sẵn có</span>
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3 num">
            {filteredOrders.map((ord) => {
              const isPending = ord.order_status === 'PENDING_PAYMENT';
              const days = calculateDays(ord.start_date, ord.expected_return_date);
              const totalDue = (ord.total_rent || 0) + (ord.deposit_amount || 0);

              return (
                <div
                  key={ord.id}
                  className="p-4 sm:p-5 rounded-3xl border border-[#14171f]/10 bg-[#f9fafb] hover:border-[#14171f]/25 transition-all text-left space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans tracking-wide font-bold text-xs text-[#14171f]">
                      #{ord.order_code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans uppercase border whitespace-nowrap ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : ord.order_status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                      }`}
                    >
                      {isPending ? 'Giữ chỗ 15 phút (Chờ thanh toán)' : ord.order_status === 'CONFIRMED' ? 'Đã xác nhận' : ord.order_status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#14171f]">{ord.model_name}</span>
                    <span className="font-bold text-[#14171f]">
                      {(ord.total_rent || 0).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60 font-sans num">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {ord.start_date} → {ord.expected_return_date} ({days} ngày)
                    </span>
                    <span>Cọc: {(ord.deposit_amount || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>

                  {/* Hiển thị Serial nếu đã được gán đối chứng */}
                  {ord.assigned_serials && (
                    <div className="flex items-center justify-between text-[11px] bg-emerald-50/80 border border-emerald-200/70 px-3 py-1.5 rounded-full">
                      <span className="text-emerald-800 font-medium">Serial khóa kho:</span>
                      <span className="font-sans tracking-wide font-bold text-emerald-950">{ord.assigned_serials}</span>
                    </div>
                  )}

                  {/* Chức năng: Bổ sung nút Hủy giữ chỗ / Hủy đơn cho các đơn chưa xác nhận thanh toán */}
                  {(isPending || ord.order_status === 'PENDING' || ord.order_status === 'GUEST_INQUIRY') && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-amber-200/50">
                      <div className="flex items-center gap-1 text-[11px] text-amber-800">
                        <Clock size={12} className="animate-pulse text-amber-700" />
                        <span>
                          {isPending ? 'Đang khóa giữ máy 15 phút' : 'Đơn đang chờ xử lý'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCancelMemberOrder(ord.order_code)}
                          disabled={cancellingCode === ord.order_code}
                          className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {cancellingCode === ord.order_code ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Ban size={13} />
                          )}
                          <span>
                            {cancellingCode === ord.order_code
                              ? 'Đang hủy...'
                              : isPending
                              ? 'Hủy giữ chỗ'
                              : 'Hủy đơn'}
                          </span>
                        </button>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => setSelectedPayOrder(ord)}
                            disabled={cancellingCode === ord.order_code}
                            className="px-3.5 py-1.5 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <CreditCard size={13} />
                            <span>Thanh toán ngay ({totalDue.toLocaleString('vi-VN')}đ)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal thanh toán khi click Thanh toán ngay từ danh sách đơn */}
      {selectedPayOrder && (
        <PaymentModal
          isOpen={!!selectedPayOrder}
          onClose={() => setSelectedPayOrder(null)}
          orderCode={selectedPayOrder.order_code}
          modelName={selectedPayOrder.model_name}
          startDate={selectedPayOrder.start_date}
          expectedReturnDate={selectedPayOrder.expected_return_date}
          days={calculateDays(selectedPayOrder.start_date, selectedPayOrder.expected_return_date)}
          totalRent={selectedPayOrder.total_rent}
          depositAmount={selectedPayOrder.deposit_amount}
          totalDue={(selectedPayOrder.total_rent || 0) + (selectedPayOrder.deposit_amount || 0)}
          assignedSerials={
            selectedPayOrder.assigned_serials
              ? selectedPayOrder.assigned_serials.split(',').map((s) => s.trim())
              : undefined
          }
          itemsDetail={
            selectedPayOrder.items_detail
              ? (() => {
                  try {
                    return JSON.parse(selectedPayOrder.items_detail);
                  } catch (_) {
                    return undefined;
                  }
                })()
              : undefined
          }
          initialTimeLeft={
            (selectedPayOrder as any).payment_deadline
              ? Math.max(0, Math.floor((new Date((selectedPayOrder as any).payment_deadline).getTime() - Date.now()) / 1000))
              : undefined
          }
          onCancelHold={async () => {
            await handleCancelMemberOrder(selectedPayOrder.order_code);
            setSelectedPayOrder(null);
          }}
          onPaymentSuccess={() => {
            loadOrders();
          }}
        />
      )}
    </div>
  );
};
