import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ShieldCheck, 
  ExternalLink,
  Loader2,
  Calendar
} from 'lucide-react';
import { payRentalOrder } from '../services/authApi';

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
  onPaymentSuccess?: () => void;
  onCancelHold?: () => void;
}

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
  onPaymentSuccess,
  onCancelHold,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'VNPAY' | 'COUNTER'>('VIETQR');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft !== undefined ? initialTimeLeft : 900); // 15 phút = 900 giây

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
      await payRentalOrder(orderCode, paymentMethod);
      setIsPaid(true);
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

  const formatDateDisplay = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length < 3) return dStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // URL tạo ảnh VietQR tự động theo chuẩn Napas 247
  const vietQrUrl = `https://img.vietqr.io/image/mbbank-0901234567-compact.png?amount=${totalDue}&addInfo=REFUJI%20${orderCode}&accountName=CONG%20TY%20REFUJI`;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-[#14171f]/65 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white border border-[#14171f]/10 rounded-3xl shadow-[0_24px_70px_rgba(20,24,32,0.25)] text-[#14171f] flex flex-col h-[670px] max-h-[92vh] overflow-hidden select-text"
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          aria-label="Đóng cửa sổ thanh toán"
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 text-[#6e7587] hover:text-[#14171f]"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="px-6 sm:px-7 pt-5 pb-3 border-b border-[#14171f]/10 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#14171f]">
                  Thanh Toán &amp; Giữ Chỗ Thiết Bị
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  #{orderCode}
                </span>
              </div>
              <p className="text-xs text-[#6e7587] mt-0.5">
                Thiết bị: <span className="font-semibold text-[#14171f]">{modelName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Thanh đếm ngược 15 phút */}
        {!isPaid && (
          <div className="px-6 sm:px-7 py-2.5 bg-amber-50/90 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock size={15} className="text-amber-700 animate-pulse" />
              <span>Thời hạn giữ chỗ 15 phút còn lại:</span>
            </div>
            <span className="font-mono font-bold text-sm bg-amber-200/70 px-2 py-0.5 rounded text-amber-950">
              {timerDisplay}
            </span>
          </div>
        )}

        {/* VÙNG NỘI DUNG CUỘN */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-4 space-y-4">
          {isPaid ? (
            /* TRẠNG THÁI ĐÃ THANH TOÁN THÀNH CÔNG */
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#14171f]">
                  Xác Nhận Thanh Toán Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-[#525868] mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Đơn hàng <strong>#{orderCode}</strong> đã được chuyển sang trạng thái <strong>ĐÃ XÁC NHẬN (CONFIRMED)</strong>. Thiết bị đã sẵn sàng cho ngày nhận máy của bạn.
                </p>
              </div>

              {/* Tóm tắt hóa đơn */}
              <div className="w-full max-w-md bg-[#f7f8fa] border border-[#14171f]/10 rounded-2xl p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Mã đơn thuê:</span>
                  <span className="font-mono font-bold text-[#14171f]">{orderCode}</span>
                </div>
                {assignedSerials && assignedSerials.length > 0 && (
                  <div className="flex justify-between items-center py-1 border-y border-neutral-200/60">
                    <span className="text-emerald-700 font-medium">Serial máy bàn giao:</span>
                    <span className="font-mono font-bold text-emerald-900">{assignedSerials.join(', ')}</span>
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
                  <span className="font-mono font-bold text-emerald-700 text-sm">
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
                <div className="py-2.5 px-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-900">Serial đối chứng kho đã khóa:</span>
                      <p className="text-[10.5px] text-emerald-700 font-light">Đã gán độc quyền cho bạn trong 15 phút, chống trùng lịch.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {assignedSerials.map((s) => (
                      <span key={s} className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-800 text-xs shadow-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh sách thiết bị nếu có nhiều món */}
              {itemsDetail && itemsDetail.length > 1 && (
                <div className="p-3 rounded-2xl bg-[#14171f]/[0.02] border border-[#14171f]/8 text-xs space-y-1.5">
                  <div className="font-semibold text-[#14171f] flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-500">
                    <span>Chi tiết gói thuê ({itemsDetail.length} thiết bị):</span>
                  </div>
                  <div className="divide-y divide-neutral-200/60">
                    {itemsDetail.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <span className="text-[#3a4050] font-medium">{it.model_name} (x{it.quantity})</span>
                        {it.assigned_serials && it.assigned_serials.length > 0 && (
                          <span className="font-mono text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {it.assigned_serials.join(', ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tóm tắt ngày và chi phí */}
              <div className="p-3.5 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#14171f]">
                  <span className="flex items-center gap-1.5 text-neutral-500">
                    <Calendar size={14} />
                    <span>Lịch thuê ({days} ngày):</span>
                  </span>
                  <span className="font-semibold">
                    {formatDateDisplay(startDate)} — {formatDateDisplay(expectedReturnDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-200/60 pt-2 text-[#14171f]">
                  <span className="text-neutral-500">Tiền thuê máy:</span>
                  <span className="font-mono font-medium">{totalRent.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex items-center justify-between text-[#14171f]">
                  <span className="text-neutral-500">Tiền cọc thiết bị (hoàn lại 100% khi trả):</span>
                  <span className="font-mono font-medium">{depositAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-200/60 pt-2 font-bold text-sm text-[#14171f]">
                  <span>Tổng cần thanh toán:</span>
                  <span className="font-mono text-base text-emerald-700">
                    {totalDue.toLocaleString('vi-VN')} ₫
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
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
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
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
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
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
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
                <div className="p-4 rounded-2xl border border-[#14171f]/10 bg-[#f9fafb] space-y-3.5">
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
                          <span className="font-mono font-bold text-[#14171f]">0901234567</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('0901234567', 'acc')}
                            className="text-neutral-400 hover:text-[#14171f]"
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
                          <span className="font-mono font-bold text-emerald-700">{totalDue.toLocaleString('vi-VN')} ₫</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(String(totalDue), 'amt')}
                            className="text-neutral-400 hover:text-[#14171f]"
                            title="Sao chép số tiền"
                          >
                            {copiedField === 'amt' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-neutral-500">Nội dung CK:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">REFUJI {orderCode}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`REFUJI ${orderCode}`, 'memo')}
                            className="text-neutral-400 hover:text-[#14171f]"
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
                <div className="p-4 rounded-2xl border border-[#14171f]/10 bg-[#f9fafb] text-xs space-y-2.5">
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
                <div className="p-4 rounded-2xl border border-[#14171f]/10 bg-[#f9fafb] text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[#14171f] font-semibold">
                    <Store size={16} className="text-amber-600" />
                    <span>Thanh toán trực tiếp tại Cửa hàng ReFuji</span>
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    Bạn có thể thanh toán bằng tiền mặt hoặc quẹt thẻ POS khi đến nhận máy tại quầy. Hệ thống vẫn giữ chỗ độc quyền thiết bị cho bạn theo lịch hẹn.
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <ShieldCheck size={14} className="shrink-0" />
                    <span>Cam kết không giữ thẻ CCCD gốc, chỉ đối chiếu thông tin lúc bàn giao.</span>
                  </div>
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
          <div className="px-6 sm:px-7 py-3.5 border-t border-[#14171f]/10 bg-white shrink-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-[#14171f]/20 hover:bg-neutral-50 text-xs font-semibold text-[#14171f] transition-all cursor-pointer"
            >
              Để thanh toán sau
            </button>

            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
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
                      : 'Xác nhận giữ chỗ & thanh toán tại quầy'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  );
};
