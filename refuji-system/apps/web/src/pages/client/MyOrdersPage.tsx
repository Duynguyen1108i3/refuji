// Tính năng: Tích hợp danh sách đơn thuê thành viên (/my-orders), lọc nhanh & tra cứu/tự hủy đơn khách vãng lai (/guest-lookup)
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Ban, AlertCircle, CheckCircle2, Phone, Hash, Package, Calendar, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../../components/badges/StatusBadge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { OrderStatus, formatVND } from '@refuji/shared';

interface ApiRentalOrder {
  id: number;
  order_code: string;
  model_name: string;
  start_date: string;
  expected_return_date: string;
  total_rent: number;
  deposit_amount: number;
  order_status: string;
  assigned_serials?: string | null;
  items_detail?: string | null;
  payment_deadline?: string | null;
  is_guest?: number;
  guest_name?: string | null;
  guest_phone?: string | null;
}

export const MyOrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<ApiRentalOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Guest order lookup state
  const [lookupCode, setLookupCode] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [isSearchingGuest, setIsSearchingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestNotice, setGuestNotice] = useState<string | null>(null);
  const [guestOrder, setGuestOrder] = useState<ApiRentalOrder | null>(null);
  const [isCancellingGuest, setIsCancellingGuest] = useState(false);

  // Tính năng: Trạng thái hủy đơn giữ chỗ dành cho Thành viên đã đăng nhập
  const [cancellingMemberCode, setCancellingMemberCode] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberNotice, setMemberNotice] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('refuji_token');
    setIsLoggedIn(Boolean(token));
    if (!token) return;

    setIsLoadingOrders(true);
    fetch('/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => setIsLoadingOrders(false));
  }, []);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((ord) => {
      const status = ord.order_status;
      if (
        activeTab === 'ACTIVE' &&
        ![OrderStatus.GUEST_INQUIRY, OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.DELIVERED, OrderStatus.OVERDUE].includes(status as any)
      ) {
        return false;
      }
      if (
        activeTab === 'COMPLETED' &&
        ![OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(status as any)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        (ord.order_code || '').toLowerCase().includes(q) ||
        (ord.model_name || '').toLowerCase().includes(q) ||
        (ord.assigned_serials || '').toLowerCase().includes(q)
      );
    });
  }, [orders, activeTab, searchQuery]);

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError(null);
    setGuestNotice(null);

    const code = lookupCode.trim().toUpperCase();
    const phone = lookupPhone.trim();
    if (!code || !phone) {
      setGuestError('Vui lòng nhập đầy đủ cả Mã đơn hàng và Số điện thoại đặt đơn.');
      return;
    }

    setIsSearchingGuest(true);
    try {
      const params = new URLSearchParams({ orderCode: code, phone });
      const res = await fetch(`/api/orders/guest-lookup?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGuestOrder(null);
        throw new Error(data.error || 'Không tìm thấy đơn hàng khớp với thông tin đã nhập.');
      }
      setGuestOrder(data);
    } catch (err: any) {
      setGuestError(err.message || 'Lỗi khi tra cứu đơn hàng.');
    } finally {
      setIsSearchingGuest(false);
    }
  };

  const handleCancelGuest = async () => {
    if (!guestOrder) return;
    setIsCancellingGuest(true);
    setGuestError(null);
    setGuestNotice(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(guestOrder.order_code)}/guest-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: lookupPhone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Không thể hủy đơn hàng này.');
      }
      setGuestOrder({ ...guestOrder, order_status: OrderStatus.CANCELLED, assigned_serials: null });
      setGuestNotice(data.message || 'Đã hủy đơn hàng và nhả Serial về kho thành công.');
    } catch (err: any) {
      setGuestError(err.message || 'Không thể hủy đơn hàng.');
    } finally {
      setIsCancellingGuest(false);
    }
  };

  // Tính năng: Thành viên tự hủy giữ chỗ 15p / đơn chờ duyệt qua /api/orders/:orderCode/cancel
  const handleCancelMemberOrder = async (orderCode: string) => {
    setCancellingMemberCode(orderCode);
    setMemberActionError(null);
    setMemberNotice(null);
    try {
      const token = localStorage.getItem('refuji_token');
      const res = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/cancel`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Không thể hủy đơn hàng này.');
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.order_code === orderCode
            ? { ...o, order_status: OrderStatus.CANCELLED, assigned_serials: null }
            : o
        )
      );
      setMemberNotice(data.message || `Đã hủy giữ chỗ đơn #${orderCode} và trả thiết bị về kho.`);
    } catch (err: any) {
      setMemberActionError(err.message || 'Không thể hủy đơn hàng.');
    } finally {
      setCancellingMemberCode(null);
    }
  };

  const renderOrderModels = (ord: ApiRentalOrder) => {
    if (ord.items_detail) {
      try {
        const parsed = JSON.parse(ord.items_detail);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((i: any) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(' + ');
        }
      } catch (_) {}
    }
    return ord.model_name || 'Thiết bị Fujifilm';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white mb-2">ĐƠN HÀNG THUÊ &amp; TRA CỨU</h1>
        <p className="text-sm text-zinc-400">
          Quản lý lịch sử thuê máy ảnh thành viên hoặc tra cứu đơn đặt nhanh không cần tài khoản bằng Mã đơn &amp; Số điện thoại.
        </p>
      </div>

      {/* Khu vực Tra cứu đơn Khách vãng lai */}
      <section id="guest-lookup" className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/15 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Tra Cứu Đơn Không Cần Tài Khoản</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Đối soát đồng thời Mã đơn hàng (#ORD-...) và Số điện thoại đặt đơn theo chuẩn bảo mật dữ liệu cá nhân.
            </p>
          </div>
        </div>

        <form onSubmit={handleGuestLookup} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="relative">
            <Input
              label="Mã đơn hàng"
              type="text"
              placeholder="VD: ORD-20261111-1234"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
            />
            <Hash className="w-3.5 h-3.5 text-zinc-500 absolute right-4 bottom-3.5 pointer-events-none" />
          </div>

          <div className="relative">
            <Input
              label="Số điện thoại đặt đơn"
              type="tel"
              placeholder="VD: 0901234567"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
            />
            <Phone className="w-3.5 h-3.5 text-zinc-500 absolute right-4 bottom-3.5 pointer-events-none" />
          </div>

          <Button type="submit" variant="primary" size="md" disabled={isSearchingGuest} className="w-full md:w-auto">
            {isSearchingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isSearchingGuest ? 'Đang tìm...' : 'Tra cứu đơn'}</span>
          </Button>
        </form>

        {guestError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{guestError}</span>
          </div>
        )}

        {guestNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{guestNotice}</span>
          </div>
        )}

        {guestOrder && (
          <div className="p-5 rounded-3xl bg-white/5 border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-sans tracking-wide text-sm font-bold text-white num">#{guestOrder.order_code}</span>
                <StatusBadge status={guestOrder.order_status} type="order" />
              </div>
              <p className="text-xs text-zinc-200 font-medium">{renderOrderModels(guestOrder)}</p>
              <p className="text-xs text-zinc-400 num flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Lịch thuê: {guestOrder.start_date} → {guestOrder.expected_return_date}</span>
              </p>
              {guestOrder.assigned_serials && (
                <p className="text-xs text-emerald-400 font-medium num">Serial khóa kho: {guestOrder.assigned_serials}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right mr-2">
                <span className="text-[11px] text-zinc-400 block">Tổng tiền + Cọc</span>
                <span className="text-sm font-bold text-emerald-400 num">
                  {formatVND((guestOrder.total_rent || 0) + (guestOrder.deposit_amount || 0))}
                </span>
              </div>
              {(guestOrder.order_status === OrderStatus.PENDING_PAYMENT ||
                guestOrder.order_status === OrderStatus.GUEST_INQUIRY) && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isCancellingGuest}
                  onClick={handleCancelGuest}
                >
                  {isCancellingGuest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  <span>Hủy giữ chỗ</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Danh sách đơn Thành viên */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Lịch Sử Đơn Thuê Thành Viên</span>
          </h2>

          {isLoggedIn && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn, tên máy, Serial..."
                className="w-full min-h-[40px] pl-10 pr-4 py-2 rounded-full bg-zinc-900/80 border border-white/15 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        {isLoggedIn && (
          <div className="flex gap-2 border-b border-white/10 pb-3">
            {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'ALL' ? 'Tất cả đơn' : tab === 'ACTIVE' ? 'Đang thực hiện' : 'Đã hoàn tất'}
              </button>
            ))}
          </div>
        )}

        {memberActionError && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{memberActionError}</span>
          </div>
        )}

        {memberNotice && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{memberNotice}</span>
          </div>
        )}

        {!isLoggedIn ? (
          <div className="liquid-glass rounded-3xl p-8 border border-white/15 text-center space-y-3">
            <p className="text-sm text-zinc-300 font-medium">
              Đăng nhập tài khoản thành viên để đồng bộ toàn bộ lịch sử đơn thuê và tiến độ nâng hạng.
            </p>
            <div>
              <Button variant="outline" size="sm" onClick={() => { window.location.href = '/login'; }}>
                <span>Đăng nhập thành viên</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : isLoadingOrders ? (
          <div className="liquid-glass rounded-3xl p-10 border border-white/15 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải đơn thuê của bạn...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-8 border border-white/15 text-center text-xs text-zinc-400">
            Chưa có đơn hàng nào phù hợp trong mục này.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((ord) => (
              <div
                key={ord.order_code}
                className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-sans tracking-wide text-sm font-bold text-white num">#{ord.order_code}</span>
                    <StatusBadge status={ord.order_status} type="order" />
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">{renderOrderModels(ord)}</p>
                  <p className="text-xs text-zinc-400 num mt-1">
                    Lịch thuê: {ord.start_date} → {ord.expected_return_date}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right mr-1">
                    <span className="text-[11px] text-zinc-400 block">Tổng tiền + Cọc</span>
                    <span className="text-sm font-bold text-emerald-400 num">
                      {formatVND((ord.total_rent || 0) + (ord.deposit_amount || 0))}
                    </span>
                  </div>
                  {(ord.order_status === OrderStatus.PENDING_PAYMENT ||
                    ord.order_status === OrderStatus.PENDING ||
                    ord.order_status === OrderStatus.GUEST_INQUIRY) && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={cancellingMemberCode === ord.order_code}
                      onClick={() => handleCancelMemberOrder(ord.order_code)}
                    >
                      {cancellingMemberCode === ord.order_code ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {cancellingMemberCode === ord.order_code
                          ? 'Đang hủy...'
                          : ord.order_status === OrderStatus.PENDING_PAYMENT
                          ? 'Hủy giữ chỗ'
                          : 'Hủy đơn'}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/orders/tracking/${ord.order_code}`;
                    }}
                  >
                    Chi tiết đơn
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
