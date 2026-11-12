// Tính năng: Hàng đợi duyệt đơn POS kết nối SQLite thực tế, phân biệt Thành viên & Khách vãng lai (GUEST_INQUIRY), duyệt khóa Serial
import React, { useState, useEffect, useCallback } from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { StatusBadge } from '../../components/badges/StatusBadge.tsx';
import {
  Check,
  X,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  Search,
  Phone,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { formatVND } from '@refuji/shared';

interface AdminOrderRow {
  id: number;
  order_code: string;
  user_id: number | null;
  is_guest: boolean;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  guest_note: string | null;
  membership_tier: string;
  reputation_score: number | null;
  id_card_last4: string | null;
  model_name: string;
  start_date: string;
  expected_return_date: string;
  total_rent: number;
  deposit_amount: number;
  payment_method: string;
  order_status: string;
  payment_deadline: string | null;
  assigned_serials: string | null;
  quantity: number;
  items_detail: Array<{ model_id?: number; model_name: string; quantity: number; assigned_serials?: string[] }>;
}

export const OrderApprovalPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'GUEST_INQUIRY' | 'PENDING_HOLD' | 'CONFIRMED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingCode, setProcessingCode] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const token = localStorage.getItem('refuji_token');
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await fetch(`/api/admin/orders${params.toString() ? `?${params.toString()}` : ''}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        const err = await res.json().catch(() => ({}));
        setAuthError(err.error || 'Vui lòng đăng nhập tài khoản Staff / Admin để xem danh sách đơn POS.');
        setOrders([]);
        return;
      }
      if (!res.ok) {
        throw new Error('Không thể tải danh sách đơn hàng POS');
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Lỗi kết nối API máy chủ' });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderCode: string, nextStatus: 'CONFIRMED' | 'CANCELLED') => {
    setProcessingCode(orderCode);
    setActionMsg(null);
    try {
      const token = localStorage.getItem('refuji_token');
      const res = await fetch(`/api/admin/orders/${orderCode}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Không thể cập nhật đơn #${orderCode}`);
      }
      setActionMsg({ type: 'success', text: data.message || `Đã cập nhật đơn #${orderCode}` });
      await loadOrders();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Thao tác thất bại' });
    } finally {
      setProcessingCode(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'GUEST_INQUIRY') return o.order_status === 'GUEST_INQUIRY';
    if (filterTab === 'PENDING_HOLD')
      return o.order_status === 'PENDING_PAYMENT' || o.order_status === 'PENDING';
    if (filterTab === 'CONFIRMED')
      return o.order_status === 'CONFIRMED' || o.order_status === 'DELIVERED';
    return true;
  });

  const guestInquiryCount = orders.filter((o) => o.order_status === 'GUEST_INQUIRY').length;

  return (
    <StaffPosLayout activeKey="approval">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1">
              HÀNG ĐỢI DUYỆT ĐƠN THUÊ POS
            </h1>
            <p className="text-xs text-zinc-400">
              Phân loại Thành viên / Khách vãng lai, gọi xác nhận yêu cầu tại quầy (GUEST_INQUIRY) và khóa Serial kho
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={loadOrders} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>

        {/* Tính năng: Đồng bộ font chữ Plus Jakarta Sans (.num) & bo tròn pill nút lọc, ô tìm kiếm, CTA */}
        {/* Bộ lọc & tìm kiếm */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-4 py-2 rounded-full border font-medium transition-all ${
                filterTab === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('GUEST_INQUIRY')}
              className={`px-4 py-2 rounded-full border font-medium transition-all ${
                filterTab === 'GUEST_INQUIRY'
                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              Vãng lai chờ gọi ({guestInquiryCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('PENDING_HOLD')}
              className={`px-4 py-2 rounded-full border font-medium transition-all ${
                filterTab === 'PENDING_HOLD'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              Đang giữ chỗ 15p / Chờ duyệt
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('CONFIRMED')}
              className={`px-4 py-2 rounded-full border font-medium transition-all ${
                filterTab === 'CONFIRMED'
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              Đã xác nhận / Đang thuê
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn, tên hoặc SĐT..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {authError && (
          <div className="mb-6 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <p className="font-bold text-sm text-amber-300 mb-0.5">Yêu cầu xác thực Nhân viên / Admin</p>
                <p>{authError}</p>
              </div>
            </div>
            <a
              href="/login"
              className="px-4 py-2 rounded-full bg-emerald-500 text-zinc-950 font-bold text-xs shrink-0 text-center hover:bg-emerald-400"
            >
              Đăng nhập POS ngay
            </a>
          </div>
        )}

        {actionMsg && (
          <div
            className={`mb-5 p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
              actionMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionMsg.text}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {!isLoading && !authError && filteredOrders.length === 0 && (
            <div className="liquid-glass rounded-3xl p-10 border border-white/10 text-center text-sm text-zinc-400">
              Không có đơn thuê nào phù hợp với bộ lọc hiện tại.
            </div>
          )}

          {filteredOrders.map((item) => {
            const totalAmount = Number(item.total_rent || 0) + Number(item.deposit_amount || 0);
            const canApprove =
              item.order_status === 'GUEST_INQUIRY' ||
              item.order_status === 'PENDING' ||
              item.order_status === 'PENDING_PAYMENT';
            const canCancel =
              item.order_status === 'GUEST_INQUIRY' ||
              item.order_status === 'PENDING' ||
              item.order_status === 'PENDING_PAYMENT' ||
              item.order_status === 'CONFIRMED';

            return (
              <div
                key={item.order_code}
                className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-white">#{item.order_code}</span>
                    <StatusBadge status={item.order_status} type="order" />
                    {item.is_guest ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Khách vãng lai (0% giảm cọc • Chưa KYC sẵn)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                        <UserCheck className="w-3 h-3" />
                        <span className="num">
                          Thành viên {item.membership_tier} • Uy tín {item.reputation_score ?? 100}/100
                        </span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white flex flex-wrap items-center gap-2">
                    <span>{item.customer_name}</span>
                    <span className="inline-flex items-center gap-1 text-zinc-300 font-sans num text-xs">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {item.customer_phone}
                    </span>
                    {item.customer_email && (
                      <span className="text-xs text-zinc-400 font-normal">• {item.customer_email}</span>
                    )}
                  </p>

                  <p className="text-xs text-zinc-200">
                    <span className="text-zinc-400">Thiết bị:</span>{' '}
                    {item.items_detail && item.items_detail.length > 0
                      ? item.items_detail.map((d) => `${d.model_name} (x${d.quantity})`).join(' + ')
                      : item.model_name}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span className="num">
                      Lịch thuê: <strong className="text-zinc-200">{item.start_date} → {item.expected_return_date}</strong>
                    </span>
                    <span>Kênh TT: <strong className="text-zinc-200">{item.payment_method}</strong></span>
                    {item.assigned_serials ? (
                      <span className="text-emerald-400">
                        Serial: <strong className="font-mono">{item.assigned_serials}</strong>
                      </span>
                    ) : (
                      <span className="text-violet-300">Chưa khóa Serial kho</span>
                    )}
                  </div>

                  {item.guest_note && (
                    <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 inline-block">
                      Ghi chú khách: {item.guest_note}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-left lg:text-right mr-1">
                    <span className="text-[11px] text-zinc-400 block num">
                      Thuê: {formatVND(item.total_rent)} • Cọc: {formatVND(item.deposit_amount)}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 num">{formatVND(totalAmount)}</span>
                  </div>

                  {canApprove && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={processingCode === item.order_code}
                      onClick={() => handleUpdateStatus(item.order_code, 'CONFIRMED')}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      <span>{item.order_status === 'GUEST_INQUIRY' ? 'Duyệt & Khóa Serial' : 'Duyệt đơn'}</span>
                    </Button>
                  )}

                  {item.order_status === 'CONFIRMED' && (
                    <a
                      href={`/staff/checkout-wizard?orderCode=${item.order_code}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-semibold transition-all"
                    >
                      <span>Bàn giao</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {canCancel && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={processingCode === item.order_code}
                      onClick={() => handleUpdateStatus(item.order_code, 'CANCELLED')}
                      title="Hủy đơn và nhả Serial"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StaffPosLayout>
  );
};
