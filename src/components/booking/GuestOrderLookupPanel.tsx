// Tính năng: Panel tra cứu đơn khách vãng lai (khớp Mã đơn + SĐT), thanh toán tiếp giữ chỗ 15p hoặc tự hủy đơn nhả Serial
import React, { useState, useEffect } from 'react';
import {
  Search,
  Phone,
  Hash,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  CreditCard,
  Ban,
  Calendar,
  Store,
} from 'lucide-react';
import { guestLookupSchema } from '../../schemas/guest.schema';
import {
  lookupGuestOrder,
  cancelGuestOrder,
  GuestLookupOrderResponse,
  getRecentGuestOrders,
  RecentGuestOrder,
  updateRecentGuestOrderStatus,
} from '../../services/authApi';

// Tính năng: Tách Panel tra cứu & tự hủy đơn dùng chung cho cả Dashboard (AccountModal) & Popup Tài khoản (AuthModal)
interface GuestOrderLookupPanelProps {
  isActive?: boolean;
  compact?: boolean;
  onResumePayment?: (order: GuestLookupOrderResponse) => void;
  onOrderCancelled?: (orderCode: string) => void;
  onCloseParent?: () => void;
}

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  GUEST_INQUIRY: {
    label: 'Chờ nhân viên gọi (Đặt tại quầy)',
    className: 'bg-violet-50 text-violet-800 border-violet-200',
  },
  PENDING_PAYMENT: {
    label: 'Đang giữ chỗ 15p (Chờ thanh toán)',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  CONFIRMED: {
    label: 'Đã xác nhận (Đã khóa Serial)',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  DELIVERED: {
    label: 'Đang thuê (Đã bàn giao)',
    className: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  CANCELLED: {
    label: 'Đã hủy / Nhả thiết bị',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
};

export const GuestOrderLookupPanel: React.FC<GuestOrderLookupPanelProps> = ({
  isActive = true,
  compact = false,
  onResumePayment,
  onOrderCancelled,
  onCloseParent,
}) => {
  const [orderCodeInput, setOrderCodeInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [recentOrders, setRecentOrders] = useState<RecentGuestOrder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<GuestLookupOrderResponse | null>(null);

  useEffect(() => {
    if (isActive) {
      setRecentOrders(getRecentGuestOrders());
      setErrorMsg(null);
      setActionMsg(null);
      setConfirmCancelOpen(false);
    }
  }, [isActive]);

  const runLookup = async (code: string, phone: string) => {
    setErrorMsg(null);
    setActionMsg(null);
    setConfirmCancelOpen(false);

    const parsed = guestLookupSchema.safeParse({ orderCode: code, phone });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Thông tin tra cứu chưa hợp lệ');
      return;
    }

    setIsSearching(true);
    try {
      const order = await lookupGuestOrder(parsed.data.orderCode, parsed.data.phone);
      setFoundOrder(order);
      updateRecentGuestOrderStatus(order.order_code, order.order_status);
      setRecentOrders(getRecentGuestOrders());
    } catch (err: any) {
      setFoundOrder(null);
      setErrorMsg(err.message || 'Không tìm thấy đơn hàng khớp với thông tin đã nhập');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runLookup(orderCodeInput, phoneInput);
  };

  const handleSelfCancel = async () => {
    if (!foundOrder) return;
    setIsCancelling(true);
    setErrorMsg(null);
    try {
      const res = await cancelGuestOrder(foundOrder.order_code, foundOrder.guest_phone);
      setFoundOrder({ ...foundOrder, order_status: 'CANCELLED', assigned_serials: null });
      setConfirmCancelOpen(false);
      setActionMsg(res.message);
      updateRecentGuestOrderStatus(foundOrder.order_code, 'CANCELLED');
      setRecentOrders(getRecentGuestOrders());

      try {
        const rawActive = localStorage.getItem('refuji_active_reservation');
        if (rawActive) {
          const parsedActive = JSON.parse(rawActive);
          if (parsedActive.orderCode === foundOrder.order_code) {
            localStorage.removeItem('refuji_active_reservation');
            window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
          }
        }
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      if (onOrderCancelled) onOrderCancelled(foundOrder.order_code);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tự hủy đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDateDisplay = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
  };

  const statusMeta = foundOrder
    ? STATUS_BADGE_MAP[foundOrder.order_status] || {
        label: foundOrder.order_status,
        className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      }
    : null;

  const isHoldNotExpired =
    foundOrder?.order_status === 'PENDING_PAYMENT' &&
    (!foundOrder.payment_deadline || new Date(foundOrder.payment_deadline).getTime() > Date.now());

  const canSelfCancel =
    foundOrder && (foundOrder.order_status === 'PENDING_PAYMENT' || foundOrder.order_status === 'GUEST_INQUIRY');

  let parsedItems: Array<{ model_name: string; quantity: number; assigned_serials?: string[] }> = [];
  if (foundOrder?.items_detail) {
    try {
      const parsed = JSON.parse(foundOrder.items_detail);
      if (Array.isArray(parsed)) parsedItems = parsed;
    } catch (_) {}
  }

  return (
    <div className={compact ? 'space-y-3.5' : 'space-y-4'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#14171f] mb-1">
              Mã đơn hàng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={orderCodeInput}
                onChange={(e) => setOrderCodeInput(e.target.value)}
                placeholder="VD: ORD-12345678"
                className="w-full pl-9 pr-4 py-2.5 text-xs font-sans font-semibold uppercase num rounded-full border border-neutral-300 bg-white text-[#14171f] outline-none focus:border-[#14171f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14171f] mb-1">
              Số điện thoại đặt đơn <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="0901234567"
                className="w-full pl-9 pr-4 py-2.5 text-xs font-sans font-semibold num rounded-full border border-neutral-300 bg-white text-[#14171f] outline-none focus:border-[#14171f]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="w-full py-2.5 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSearching ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Đang tìm đơn hàng...</span>
            </>
          ) : (
            <>
              <Search size={15} />
              <span>Tra cứu trạng thái đơn</span>
            </>
          )}
        </button>
      </form>

      {/* Gợi ý nhanh các đơn vừa đặt trên trình duyệt này */}
      {recentOrders.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Đơn vừa tạo gần đây trên trình duyệt này:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recentOrders.slice(0, 5).map((item) => (
              <button
                key={item.orderCode}
                type="button"
                onClick={() => {
                  setOrderCodeInput(item.orderCode);
                  setPhoneInput(item.phone);
                  runLookup(item.orderCode, item.phone);
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#f7f8fa] hover:bg-neutral-100 border border-[#14171f]/12 text-[11px] font-sans num text-[#14171f] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="font-bold">#{item.orderCode}</span>
                <span className="text-neutral-500">• {item.phone}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {actionMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Kết quả tra cứu */}
      {foundOrder && statusMeta && (
        <div className="rounded-3xl border border-[#14171f]/12 bg-[#f7f8fa] p-4 space-y-3 text-xs num">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-200/80">
            <div className="flex items-center gap-2">
              <span className="font-sans tracking-wide font-bold text-sm text-[#14171f]">
                #{foundOrder.order_code}
              </span>
              <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-white border border-neutral-200 font-medium text-neutral-600">
                Khách vãng lai
              </span>
            </div>
            <span className={`px-3 py-0.5 rounded-full border text-[11px] font-semibold ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px]">Khách hàng:</span>
              <span className="font-semibold text-[#14171f]">{foundOrder.guest_name}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">SĐT / Email:</span>
              <span className="font-sans font-medium text-[#14171f]">
                {foundOrder.guest_phone} • {foundOrder.guest_email}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-white border border-neutral-200/80">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <Calendar size={14} />
              <span>Lịch thuê:</span>
            </span>
            <span className="font-semibold text-[#14171f]">
              {formatDateDisplay(foundOrder.start_date)} — {formatDateDisplay(foundOrder.expected_return_date)}
            </span>
          </div>

          <div className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-neutral-200/80">
            <div className="font-semibold text-[#14171f]">
              {parsedItems.length > 1
                ? `Danh sách thiết bị (${parsedItems.length} mẫu):`
                : foundOrder.model_name}
            </div>
            {parsedItems.length > 0 && (
              <div className="space-y-1">
                {parsedItems.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11.5px] text-neutral-600">
                    <span>{it.model_name} (x{it.quantity})</span>
                    {it.assigned_serials && it.assigned_serials.length > 0 && (
                      <span className="font-sans tracking-wide text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {it.assigned_serials.join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {foundOrder.assigned_serials ? (
              <div className="pt-1.5 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-emerald-700 font-medium">Serial đang khóa giữ:</span>
                <span className="font-sans tracking-wide font-bold text-emerald-900">{foundOrder.assigned_serials}</span>
              </div>
            ) : foundOrder.order_status === 'GUEST_INQUIRY' ? (
              <div className="pt-1.5 border-t border-neutral-100 flex items-center gap-1.5 text-violet-700 text-[11px]">
                <Store size={13} className="shrink-0" />
                <span>Chưa khóa Serial kho — Nhân viên ReFuji sẽ gọi xác nhận với bạn.</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-neutral-600">
              <span>Tiền thuê:</span>
              <span className="font-sans font-medium">{Number(foundOrder.total_rent || 0).toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Tiền cọc chuẩn:</span>
              <span className="font-sans font-medium">{Number(foundOrder.deposit_amount || 0).toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#14171f] pt-1 border-t border-neutral-200/80">
              <span>Tổng cộng:</span>
              <span className="font-sans font-bold text-emerald-700">
                {(Number(foundOrder.total_rent || 0) + Number(foundOrder.deposit_amount || 0)).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {isHoldNotExpired && (
              <button
                type="button"
                onClick={() => {
                  if (onResumePayment) {
                    onResumePayment(foundOrder);
                  } else {
                    window.dispatchEvent(new CustomEvent('refuji_resume_guest_payment', { detail: foundOrder }));
                  }
                  if (onCloseParent) onCloseParent();
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <CreditCard size={14} />
                <span>Thanh toán giữ chỗ ngay</span>
              </button>
            )}

            {canSelfCancel && !confirmCancelOpen && (
              <button
                type="button"
                onClick={() => setConfirmCancelOpen(true)}
                className="py-2.5 px-4 rounded-full border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Ban size={14} />
                <span>Tự hủy đơn / Nhả máy</span>
              </button>
            )}
          </div>

          {confirmCancelOpen && canSelfCancel && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <p className="text-[11.5px] text-rose-800 font-medium">
                Xác nhận hủy đơn <strong>#{foundOrder.order_code}</strong>? Serial (nếu có) sẽ được trả về kho ngay lập tức.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleSelfCancel}
                  className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCancelling ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  <span>Xác nhận hủy ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancelOpen(false)}
                  className="px-3 py-1.5 rounded-full bg-white border border-neutral-300 text-xs font-medium text-neutral-700 cursor-pointer"
                >
                  Không hủy
                </button>
              </div>
            </div>
          )}

          {foundOrder.order_status === 'PENDING_PAYMENT' && !isHoldNotExpired && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
              <Clock size={14} />
              <span>Thời hạn giữ chỗ 15 phút đã hết hạn. Vui lòng đặt lại đơn mới.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
