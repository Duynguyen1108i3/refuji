import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Check,
  X,
  FileText,
  ArrowRightLeft,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  approveAdminOrder,
  fetchAdminOrders,
  rejectAdminOrder,
} from '../../services/dashboardApi';
import {
  AdminOrderRow,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  formatVnd,
  formatShortDate,
} from './dashboardTypes';

interface OrdersOperationsTabProps {
  onOpenCheckout: (orderCode: string) => void;
  onOpenCheckin: (orderCode: string) => void;
  onOpenDossier: (orderCode: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshSignal: number;
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'ALL', label: 'Tất cả đơn' },
  { id: 'GUEST_INQUIRY', label: 'Chờ duyệt Quầy' },
  { id: 'PENDING_PAYMENT', label: 'Giữ chỗ 15p' },
  { id: 'CONFIRMED', label: 'Sẵn sàng Check-out' },
  { id: 'DELIVERED', label: 'Đang giao khách' },
  { id: 'OVERDUE', label: 'Quá hạn' },
  { id: 'RETURNED', label: 'Đã quyết toán' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

export const OrdersOperationsTab: React.FC<OrdersOperationsTabProps> = ({
  onOpenCheckout,
  onOpenCheckin,
  onOpenDossier,
  onNotify,
  refreshSignal,
}) => {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerType, setCustomerType] = useState<'all' | 'member' | 'guest'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [confirmRejectCode, setConfirmRejectCode] = useState<string | null>(null);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

  const loadOrders = useCallback(async (manual = false) => {
    setIsLoading(true);
    try {
      const apiStatus = statusFilter === 'OVERDUE' ? 'ALL' : statusFilter;
      const [list] = await Promise.all([
        fetchAdminOrders({
          status: apiStatus,
          customer_type: customerType,
          search: searchTerm,
        }),
        manual ? new Promise((r) => setTimeout(r, 450)) : Promise.resolve(),
      ]);
      const filtered =
        statusFilter === 'OVERDUE'
          ? list.filter((o) => o.order_status === 'OVERDUE' || o.order_status === 'OVERDUE_CRITICAL')
          : list;
      setOrders(filtered);
      if (manual) {
        onNotify(`Đã làm mới ${filtered.length} đơn thuê từ hệ thống`, 'success');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tải hàng đợi đơn hàng POS.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, customerType, searchTerm, onNotify]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadOrders();
    }, 150);
    return () => clearTimeout(t);
  }, [loadOrders, refreshSignal]);

  const handleApprove = async (orderCode: string) => {
    setConflictAlert(null);
    setBusyCode(orderCode);
    try {
      const res = await approveAdminOrder(orderCode);
      onNotify(res.message || `Đã duyệt đơn #${orderCode}`, 'success');
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      await loadOrders();
    } catch (err: any) {
      if (err?.status === 409) {
        setConflictAlert(`Xung đột tồn kho đơn #${orderCode}: ${err.message}`);
      }
      onNotify(err?.message || 'Không thể duyệt đơn hàng.', 'error');
    } finally {
      setBusyCode(null);
    }
  };

  const handleReject = async (orderCode: string, requireConfirm = false) => {
    if (requireConfirm && confirmRejectCode !== orderCode) {
      setConfirmRejectCode(orderCode);
      window.setTimeout(() => {
        setConfirmRejectCode((cur) => (cur === orderCode ? null : cur));
      }, 4500);
      return;
    }
    setConfirmRejectCode(null);
    setConflictAlert(null);
    setBusyCode(orderCode);
    try {
      const res = await rejectAdminOrder(orderCode, 'Nhân viên POS hủy đơn & giải phóng Serial kho');
      onNotify(res.message || `Đã hủy đơn #${orderCode}`, 'info');
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      await loadOrders();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể hủy đơn hàng.', 'error');
    } finally {
      setBusyCode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
            <span>Hàng Đợi POS &amp; Giao Nhận</span>
          </div>
          <h2 className="font-serif text-3xl text-[#14171f]">
            Quản Lý Đơn Thuê &amp; Bàn Giao
          </h2>
          <p className="text-xs sm:text-sm text-[#5a6072] mt-1">
            Duyệt yêu cầu tại quầy, thực hiện Check-out đối chứng KYC + ảnh, và Check-in quyết toán cọc.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders(true)}
          className="glass-button px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* 409 Conflict Banner */}
      {conflictAlert && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">Cảnh báo Xung đột Tồn kho (409 Conflict)</p>
              <p className="mt-0.5">{conflictAlert}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConflictAlert(null)}
            className="text-rose-500 hover:text-rose-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-[#62687a]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã đơn (#ORD...), tên khách, số điện thoại..."
              className="w-full pl-10 pr-9 py-2.5 rounded-full crystal-liquid-lens text-xs sm:text-sm text-[#14171f] placeholder:text-[#8c93a4] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#14171f]/10 hover:bg-[#14171f]/20 text-[#14171f] flex items-center justify-center cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Customer Type Toggle */}
          <div className="flex items-center gap-1.5 bg-[#f5f6f8] p-1 rounded-full border border-[#14171f]/10 self-start md:self-auto">
            {[
              { id: 'all', label: 'Tất cả khách' },
              { id: 'member', label: 'Thành viên' },
              { id: 'guest', label: 'Vãng lai (Guest)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCustomerType(item.id as 'all' | 'member' | 'guest')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  customerType === item.id
                    ? 'bg-[#14171f] text-white shadow-xs'
                    : 'text-[#5a6072] hover:text-[#14171f]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#14171f] text-white border-[#14171f] shadow-xs'
                  : 'bg-white text-[#5a6072] border-[#14171f]/10 hover:border-[#14171f]/25 hover:text-[#14171f]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-[#5a6072]">
          <Loader2 size={24} className="animate-spin text-[#14171f]" />
          <span className="text-xs">Đang tải danh sách đơn hàng...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-12 text-center text-sm text-[#5a6072]">
          Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="liquid-glass rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#14171f]/10 bg-[#f7f8fa] text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                  <th className="py-3.5 px-5">Mã đơn &amp; Thời gian</th>
                  <th className="py-3.5 px-4">Khách hàng &amp; KYC</th>
                  <th className="py-3.5 px-4">Thiết bị &amp; Serial kho</th>
                  <th className="py-3.5 px-4">Lịch thuê</th>
                  <th className="py-3.5 px-4 text-right">Tài chính</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Nghiệp vụ POS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14171f]/8 text-xs">
                {orders.map((order) => {
                  const stMeta = ORDER_STATUS_META[order.order_status] || ORDER_STATUS_META.PENDING;
                  const payMeta = PAYMENT_STATUS_META[order.payment_status] || PAYMENT_STATUS_META.UNPAID;
                  const serialList = order.assigned_serials
                    ? order.assigned_serials.split(',').map((s) => s.trim()).filter(Boolean)
                    : [];
                  const isBusy = busyCode === order.order_code;

                  const needsApprove =
                    order.order_status === 'GUEST_INQUIRY' || order.order_status === 'PENDING';
                  const canCheckout =
                    order.order_status === 'CONFIRMED' || order.order_status === 'PENDING';
                  const canCheckin = ['DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL'].includes(
                    order.order_status
                  );
                  const canReject = [
                    'GUEST_INQUIRY',
                    'PENDING_PAYMENT',
                    'PENDING',
                    'CONFIRMED',
                  ].includes(order.order_status);

                  return (
                    <tr key={order.id} className="hover:bg-[#f7f8fa]/70 transition-colors">
                      {/* Order Code */}
                      <td className="py-4 px-5 align-top">
                        <button
                          type="button"
                          onClick={() => onOpenDossier(order.order_code)}
                          className="font-bold text-[#14171f] hover:underline num cursor-pointer block"
                        >
                          #{order.order_code}
                        </button>
                        <span className="text-[11px] text-[#7e8596] num block mt-0.5">
                          {formatShortDate(order.created_at)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-[#14171f]">{order.customer_name}</span>
                          {order.is_guest ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                              GUEST
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-[#14171f]">
                              {order.membership_tier}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#5a6072] num mt-0.5">
                          {order.customer_phone || '—'}
                          {!order.is_guest && order.id_card_last4 && (
                            <span className="ml-2 text-emerald-700 font-medium">
                              CCCD ****{order.id_card_last4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Equipment & Serial */}
                      <td className="py-4 px-4 align-top max-w-[230px]">
                        <p className="font-semibold text-[#14171f] truncate" title={order.model_name}>
                          {order.model_name}
                        </p>
                        {serialList.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {serialList.map((sn) => (
                              <span
                                key={sn}
                                className="px-2 py-0.5 rounded-full bg-white border border-[#14171f]/15 text-[10.5px] font-semibold text-[#14171f] num"
                              >
                                {sn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 italic block mt-0.5">
                            Chưa khóa Serial kho
                          </span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4 align-top num whitespace-nowrap text-[#4b5262]">
                        <div>Nhận: <strong className="text-[#14171f]">{formatShortDate(order.start_date)}</strong></div>
                        <div className="mt-0.5">Trả: <strong className="text-[#14171f]">{formatShortDate(order.expected_return_date)}</strong></div>
                      </td>

                      {/* Finance */}
                      <td className="py-4 px-4 align-top text-right num whitespace-nowrap">
                        <div className="font-bold text-[#14171f]">{formatVnd(order.total_rent)}</div>
                        <div className="text-[11px] text-[#5a6072]">
                          Cọc: {formatVnd(order.deposit_amount)}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${payMeta.badgeClass}`}>
                          {payMeta.label}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td className="py-4 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold border whitespace-nowrap ${stMeta.bg} ${stMeta.text} ${stMeta.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stMeta.dot}`} />
                          {stMeta.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {needsApprove && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApprove(order.order_code)}
                              className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            >
                              {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              <span>Duyệt &amp; Khóa Serial</span>
                            </button>
                          )}

                          {canCheckout && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onOpenCheckout(order.order_code)}
                              className="px-3 py-1.5 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <ArrowRightLeft size={12} />
                              <span>Check-out</span>
                            </button>
                          )}

                          {canCheckin && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => onOpenCheckin(order.order_code)}
                              className="px-3 py-1.5 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Check size={12} />
                              <span>Check-in Quyết toán</span>
                            </button>
                          )}

                          {canReject && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleReject(order.order_code, order.order_status === 'CONFIRMED')
                              }
                              className={`px-2.5 py-1.5 rounded-full border text-[11px] font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1 transition-all ${
                                confirmRejectCode === order.order_code
                                  ? 'border-rose-600 bg-rose-600 text-white'
                                  : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                              }`}
                              title={
                                order.order_status === 'CONFIRMED'
                                  ? 'Hủy giữ chỗ & mở khóa Serial về kho'
                                  : 'Hủy / Từ chối đơn'
                              }
                            >
                              <X size={12} />
                              {confirmRejectCode === order.order_code && (
                                <span>Xác nhận hủy?</span>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenDossier(order.order_code)}
                            className="glass-button px-2.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="Xem hồ sơ & In biên bản"
                          >
                            <FileText size={12} />
                            <span>Hồ sơ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
