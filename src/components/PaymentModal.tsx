import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Store, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  Loader2,
  Calendar,
  Ban,
  AlertCircle
} from 'lucide-react';
import { payRentalOrder, updateRecentGuestOrderStatus } from '../services/authApi';
import {
  POPUP_BACKDROP_CLASS,
  POPUP_FRAME_CLASS,
  POPUP_INNER_CLASS,
  POPUP_CLOSE_BUTTON_CLASS,
  getBackdropDismissProps,
} from './ui/popupTheme';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  modelName: string;
  startDate: string;
  expectedReturnDate: string;
  days: number;
  totalRent: number;
  depositAmount: number;
  totalDue: number;
  assignedSerials?: string[];
  itemsDetail?: Array<{ model_id?: number | string; model_name: string; quantity: number; assigned_serials?: string[] }>;
  initialTimeLeft?: number;
  isGuest?: boolean;
  guestPhone?: string;
  onPaymentSuccess?: () => void;
  onCancelHold?: () => void | Promise<void>;
}

// Tính năng: Modal thanh toán giữ chỗ 15p (hỗ trợ cả Thành viên và Khách vãng lai kèm tự hủy giữ chỗ)
export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderCode,
  modelName,
  startDate,
  expectedReturnDate,
  days,
  totalRent,
  depositAmount,
  totalDue,
  assignedSerials,
  itemsDetail,
  initialTimeLeft,
  isGuest = false,
  guestPhone,
  onPaymentSuccess,
  onCancelHold,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'VNPAY' | 'COUNTER'>('VIETQR');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [resultStatus, setResultStatus] = useState<'CONFIRMED' | 'GUEST_INQUIRY'>('CONFIRMED');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft !== undefined ? initialTimeLeft : 900); // 15 phút = 900 giây

  useEffect(() => {
    if (isOpen) {
      setIsCancelling(false);
      setIsProcessing(false);
      setIsPaid(false);
      setErrorMsg(null);
    }
  }, [isOpen, orderCode]);

  useEffect(() => {
    if (initialTimeLeft !== undefined) {
      setTimeLeft(initialTimeLeft);
    }
  }, [initialTimeLeft]);

  // Đếm ngược 15 phút
  useEffect(() => {
    if (!isOpen || isPaid) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isPaid]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard?.writeText?.(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPayment = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const res = await payRentalOrder(orderCode, paymentMethod, guestPhone);
      const finalStatus = res.orderStatus === 'GUEST_INQUIRY' ? 'GUEST_INQUIRY' : 'CONFIRMED';
      setResultStatus(finalStatus);
      setIsPaid(true);
      updateRecentGuestOrderStatus(orderCode, finalStatus);
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
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
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể xác nhận thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  // Tính năng: Quản lý trạng thái bất đồng bộ khi nhấn Hủy giữ chỗ để khóa lặp & hiển thị lỗi rõ ràng
  const handleCancelHoldClick = async () => {
    if (!onCancelHold || isCancelling || isProcessing) return;
    setErrorMsg(null);
    setIsCancelling(true);
    try {
      await onCancelHold();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể hủy giữ chỗ đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDateDisplay = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length < 3) return dStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // URL tạo ảnh VietQR tự động theo chuẩn Napas 247
  const vietQrUrl = `https://img.vietqr.io/image/mbbank-0901234567-compact.png?amount=${totalDue}&addInfo=REFUJI%20${orderCode}&accountName=CONG%20TY%20REFUJI`;

  if (typeof document === 'undefined') return null;

  // Tính năng: Quy chuẩn khung popup Thanh toán về cố định 1 khung chung toàn dự án
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      {...getBackdropDismissProps(onClose)}
      className={`${POPUP_BACKDROP_CLASS} z-[200]`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        className={POPUP_FRAME_CLASS}
      >
        <div className={POPUP_INNER_CLASS}>
        {/* Nút đóng */}
        <button
          onClick={onClose}
          aria-label="Đóng cửa sổ thanh toán"
          className={POPUP_CLOSE_BUTTON_CLASS}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="px-6 sm:px-8 py-5 pb-4 border-b border-[#14171f]/10 pr-14 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#14171f]">
                  Thanh Toán &amp; Giữ Chỗ Thiết Bị
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans tracking-wide num font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  #{orderCode}
                </span>
              </div>
              <p className="text-xs text-[#6e7587] mt-0.5">
                Thiết bị: <span className="font-semibold text-[#14171f]">{modelName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Chức năng: Đồng bộ font Poppins / Plus Jakarta Sans num & bo tròn khung/nút */}
        {/* Thanh đếm ngược 15 phút */}
        {!isPaid && (
          <div className="px-6 sm:px-8 py-2.5 bg-amber-50/90 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock size={15} className="text-amber-700 animate-pulse" />
              <span>Thời hạn giữ chỗ 15 phút còn lại:</span>
            </div>
            <span className="font-sans num font-bold text-sm bg-amber-200/70 px-3 py-0.5 rounded-full text-amber-950">
              {timerDisplay}
            </span>
          </div>
        )}

        {/* VÙNG NỘI DUNG CUỘN */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-4 space-y-4">
          {isPaid ? (
            /* TRẠNG THÁI ĐÃ THANH TOÁN THÀNH CÔNG */
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#14171f]">
                  {resultStatus === 'GUEST_INQUIRY'
                    ? 'Đã Chuyển Sang Yêu Cầu Tại Quầy'
                    : 'Xác Nhận Thanh Toán Thành Công!'}
                </h3>
                <p className="text-xs sm:text-sm text-[#525868] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  {resultStatus === 'GUEST_INQUIRY' ? (
                    <>
                      Đơn <strong>#{orderCode}</strong> đã được chuyển sang <strong>ĐẶT TẠI QUẦY (CHƯA KHÓA KHO)</strong>. Nhân viên ReFuji sẽ gọi xác nhận trước khi giữ máy.
                    </>
                  ) : (
                    <>
                      Đơn hàng <strong>#{orderCode}</strong> đã được chuyển sang trạng thái <strong>ĐÃ XÁC NHẬN (CONFIRMED)</strong>. Thiết bị đã sẵn sàng cho ngày nhận máy của bạn.
                    </>
                  )}
                </p>
              </div>

              {/* Tóm tắt hóa đơn */}
              <div className="w-full max-w-md bg-[#f7f8fa] border border-[#14171f]/10 rounded-3xl p-4 text-xs space-y-2 text-left num">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Mã đơn thuê:</span>
                  <span className="font-sans tracking-wide font-bold text-[#14171f]">{orderCode}</span>
                </div>
                {assignedSerials && assignedSerials.length > 0 && (
                  <div className="flex justify-between items-center py-1 border-y border-neutral-200/60">
                    <span className="text-emerald-700 font-medium">Serial máy bàn giao:</span>
                    <span className="font-sans tracking-wide font-bold text-emerald-900">{assignedSerials.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Thời gian thuê:</span>
                  <span className="font-semibold text-[#14171f]">
                    {formatDateDisplay(startDate)} — {formatDateDisplay(expectedReturnDate)} ({days} ngày)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tổng thanh toán:</span>
                  <span className="font-sans font-bold text-emerald-700 text-sm">
                    {totalDue.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Hình thức:</span>
                  <span className="font-medium text-[#14171f]">
                    {paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : paymentMethod === 'VNPAY' ? 'Cổng VNPAY' : 'Thanh toán tại quầy'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#14171f] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[#252a37] transition-all cursor-pointer"
              >
                Hoàn tất &amp; Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Serial đối chứng kho đã khóa giữ chỗ */}
              {assignedSerials && assignedSerials.length > 0 && (
                <div className="py-2.5 px-3.5 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-900">Serial đối chứng kho đã khóa:</span>
                      <p className="text-[10.5px] text-emerald-700 font-light">Đã gán độc quyền cho bạn trong 15 phút, chống trùng lịch.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {assignedSerials.map((s) => (
                      <span key={s} className="font-sans tracking-wide num font-bold bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 text-emerald-800 text-xs shadow-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh sách thiết bị nếu có nhiều món */}
              {itemsDetail && itemsDetail.length > 1 && (
                <div className="p-3.5 rounded-3xl bg-[#14171f]/[0.02] border border-[#14171f]/8 text-xs space-y-1.5">
                  <div className="font-semibold text-[#14171f] flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-500">
                    <span>Chi tiết gói thuê ({itemsDetail.length} thiết bị):</span>
                  </div>
                  <div className="divide-y divide-neutral-200/60">
                    {itemsDetail.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <span className="text-[#3a4050] font-medium">{it.model_name} (x{it.quantity})</span>
                        {it.assigned_serials && it.assigned_serials.length > 0 && (
                          <span className="font-sans tracking-wide num text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            {it.assigned_serials.join(', ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tóm tắt ngày và chi phí */}
              <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2 text-xs num">
                <div className="flex items-center justify-between text-[#14171f]">
                  <span className="flex items-center gap-1.5 text-neutral-500">
                    <Calendar size={14} />
                    <span>Lịch thuê ({days} ngày):</span>
                  </span>
                  <span className="font-semibold">
                    {formatDateDisplay(startDate)} — {formatDateDisplay(expectedReturnDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-neutral-200/60 pt-2 text-[#14171f]">
                  <span className="text-neutral-500">Tiền thuê máy:</span>
                  <span className="font-sans font-semibold whitespace-nowrap shrink-0">{totalRent.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[#14171f]">
                  <span className="text-neutral-500">Tiền cọc thiết bị (hoàn lại 100% khi trả):</span>
                  <span className="font-sans font-semibold whitespace-nowrap shrink-0">{depositAmount.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-neutral-200/60 pt-2 font-bold text-sm text-[#14171f]">
                  <span>Tổng cần thanh toán:</span>
                  <span className="font-sans text-base font-bold text-emerald-700 whitespace-nowrap shrink-0">
                    {totalDue.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              {/* Lựa chọn phương thức thanh toán */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#14171f] uppercase tracking-wider">
                  Chọn phương thức thanh toán
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`p-3 rounded-3xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'VIETQR'
                        ? 'border-[#14171f] bg-[#14171f] text-white shadow-sm'
                        : 'border-[#14171f]/15 bg-[#fbfcfd] text-[#14171f] hover:bg-neutral-50'
                    }`}
                  >
                    <QrCode size={18} />
                    <span className="text-xs font-semibold">Chuyển khoản VietQR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VNPAY')}
                    className={`p-3 rounded-3xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'VNPAY'
                        ? 'border-[#14171f] bg-[#14171f] text-white shadow-sm'
                        : 'border-[#14171f]/15 bg-[#fbfcfd] text-[#14171f] hover:bg-neutral-50'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-xs font-semibold">Cổng VNPAY</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COUNTER')}
                    className={`p-3 rounded-3xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'COUNTER'
                        ? 'border-[#14171f] bg-[#14171f] text-white shadow-sm'
                        : 'border-[#14171f]/15 bg-[#fbfcfd] text-[#14171f] hover:bg-neutral-50'
                    }`}
                  >
                    <Store size={18} />
                    <span className="text-xs font-semibold">Thanh toán tại quầy</span>
                  </button>
                </div>
              </div>

              {/* Nội dung chi tiết từng phương thức */}
              {paymentMethod === 'VIETQR' && (
                <div className="p-4 rounded-3xl border border-[#14171f]/10 bg-[#f9fafb] space-y-3.5 num">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="bg-white p-2 rounded-2xl border border-neutral-200 shadow-sm shrink-0">
                      <img
                        src={vietQrUrl}
                        alt="VietQR Mã thanh toán"
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                    <div className="space-y-2 text-xs flex-1 w-full">
                      <div className="flex items-center justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Ngân hàng:</span>
                        <span className="font-bold text-[#14171f]">MB Bank (Quân Đội)</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans font-bold text-[#14171f]">0901234567</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('0901234567', 'acc')}
                            className="w-7 h-7 rounded-full inline-flex items-center justify-center text-neutral-500 hover:text-[#14171f] hover:bg-neutral-200/70 transition-colors cursor-pointer"
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'acc' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Chủ tài khoản:</span>
                        <span className="font-semibold text-[#14171f]">CONG TY TNHH REFUJI</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-neutral-200">
                        <span className="text-neutral-500">Số tiền:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans font-bold text-emerald-700">{totalDue.toLocaleString('vi-VN')} ₫</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(String(totalDue), 'amt')}
                            className="w-7 h-7 rounded-full inline-flex items-center justify-center text-neutral-500 hover:text-[#14171f] hover:bg-neutral-200/70 transition-colors cursor-pointer"
                            title="Sao chép số tiền"
                          >
                            {copiedField === 'amt' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-neutral-500">Nội dung CK:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans tracking-wide num font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">REFUJI {orderCode}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`REFUJI ${orderCode}`, 'memo')}
                            className="w-7 h-7 rounded-full inline-flex items-center justify-center text-neutral-500 hover:text-[#14171f] hover:bg-neutral-200/70 transition-colors cursor-pointer"
                            title="Sao chép nội dung chuyển khoản"
                          >
                            {copiedField === 'memo' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 italic">
                    * Mở app ngân hàng quét mã QR trên để tự động điền chính xác số tiền và nội dung chuyển khoản.
                  </p>
                </div>
              )}

              {paymentMethod === 'VNPAY' && (
                <div className="p-4 rounded-3xl border border-[#14171f]/10 bg-[#f9fafb] text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[#14171f] font-semibold">
                    <CreditCard size={16} className="text-blue-600" />
                    <span>Cổng thanh toán điện tử VNPAY Sandbox</span>
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    Hỗ trợ thẻ ATM nội địa hơn 30 ngân hàng, Thẻ quốc tế Visa/Mastercard/JCB và Ví VNPAY. Giao dịch được mã hóa an toàn đạt chuẩn bảo mật quốc tế PCI DSS.
                  </p>
                </div>
              )}

              {paymentMethod === 'COUNTER' && (
                <div className="p-4 rounded-3xl border border-[#14171f]/10 bg-[#f9fafb] text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[#14171f] font-semibold">
                    <Store size={16} className="text-amber-600" />
                    <span>Thanh toán trực tiếp tại Cửa hàng ReFuji</span>
                  </div>
                  {isGuest ? (
                    <div className="flex items-start gap-2 text-[11.5px] text-amber-900 bg-amber-50 p-3 rounded-2xl border border-amber-200 leading-relaxed">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-700" />
                      <span>
                        <strong>Lưu ý Khách vãng lai:</strong> Chuyển sang hình thức tại quầy sẽ <strong>nhả khóa Serial 15 phút</strong> và đưa đơn vào hàng đợi nhân viên gọi xác nhận. Nếu bạn muốn giữ chắc máy ngay, vui lòng chọn VietQR hoặc VNPAY.
                      </span>
                    </div>
                  ) : (
                    <p className="text-neutral-600 leading-relaxed">
                      Bạn có thể thanh toán bằng tiền mặt hoặc quẹt thẻ POS khi đến nhận máy tại quầy. Hệ thống vẫn giữ chỗ độc quyền thiết bị cho bạn theo lịch hẹn.
                    </p>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isPaid && (
          <div className="px-6 sm:px-8 py-4 border-t border-[#14171f]/10 bg-white shrink-0 flex flex-wrap items-center justify-between gap-2.5">
            {onCancelHold && (
              <button
                type="button"
                onClick={handleCancelHoldClick}
                disabled={isProcessing || isCancelling}
                className="px-3.5 py-2.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCancelling ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                <span>{isCancelling ? 'Đang hủy...' : 'Hủy giữ chỗ'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isCancelling}
              className="px-4 py-2.5 rounded-full border border-[#14171f]/20 hover:bg-neutral-50 text-xs font-semibold text-[#14171f] transition-all cursor-pointer disabled:opacity-50"
            >
              Để thanh toán sau
            </button>

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessing || isCancelling}
              className="flex-1 min-w-[200px] py-3 px-4 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang ghi nhận giao dịch...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>
                    {paymentMethod === 'VIETQR'
                      ? 'Tôi đã chuyển khoản xong'
                      : paymentMethod === 'VNPAY'
                      ? 'Thanh toán qua VNPAY'
                      : isGuest
                      ? 'Chuyển sang yêu cầu tại quầy'
                      : 'Xác nhận giữ chỗ & thanh toán tại quầy'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
