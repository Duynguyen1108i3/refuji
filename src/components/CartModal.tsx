import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Minus, 
  Sparkles, 
  CheckCircle2,
  Clock,
  Camera,
  Aperture,
  QrCode,
  CreditCard,
  Store,
  Copy,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { CartItem, EquipmentItem, LensModel, AccessoryModel, CameraModel } from '../types';
import { MembershipTierType } from './AccountModal';
import { useAuth } from '../context/AuthContext';
import { createRentalOrder, payRentalOrder } from '../services/authApi';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOpenCalendar: () => void;
  rentalDatesText: string;
  startDate?: string;
  expectedReturnDate?: string;
  membershipTier: MembershipTierType;
  onCheckoutSuccess?: () => void;
  allLenses?: LensModel[];
  allAccessories?: AccessoryModel[];
  onAddToCart?: (item: EquipmentItem) => void;
}

const getTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const addDaysToStr = (baseStr: string, addDays: number) => {
  const d = new Date(baseStr);
  d.setDate(d.getDate() + addDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCalendar,
  rentalDatesText,
  startDate,
  expectedReturnDate,
  membershipTier,
  onCheckoutSuccess,
  allLenses = [],
  allAccessories = [],
  onAddToCart,
}) => {
  const { isAuthenticated, openAuthModal, user, setToast } = useAuth();

  // Trạng thái giữ chỗ và thanh toán
  const [isBooked, setIsBooked] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [assignedSerials, setAssignedSerials] = useState<string[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'VNPAY' | 'COUNTER'>('VIETQR');
  const [isPaying, setIsPaying] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Đếm ngược 15 phút thực tế
  const [timeLeft, setTimeLeft] = useState(900);

  useEffect(() => {
    if (!isBooked || isPaidSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBooked, isPaidSuccess]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Tính số ngày thuê từ text "05/11 — 08/11 (3 ngày)"
  const daysMatch = rentalDatesText.match(/(\d+)\s*ngày/);
  const rentalDays = daysMatch ? parseInt(daysMatch[1], 10) : 3;

  const finalStartDate = startDate || getTodayStr();
  const finalEndDate = expectedReturnDate || addDaysToStr(finalStartDate, rentalDays);

  // Tỉ lệ giảm cọc theo hạng hội viên
  const activeTier = user?.membership_tier || membershipTier;
  const tierDiscountMap: Record<MembershipTierType, { label: string; rate: number }> = {
    BRONZE: { label: 'Hạng Đồng', rate: 0 },
    SILVER: { label: 'Hạng Bạc', rate: 0.05 },
    GOLD: { label: 'Hạng Vàng', rate: 0.10 },
    PLATINUM: { label: 'Bạch Kim', rate: 0.15 },
  };
  const tierInfo = tierDiscountMap[activeTier] || tierDiscountMap.BRONZE;

  // Tổng tiền thuê và tiền cọc
  const totalRentalPrice = cartItems.reduce(
    (sum, item) => sum + item.item.dailyRate * item.quantity * rentalDays,
    0
  );
  const totalStandardDeposit = cartItems.reduce(
    (sum, item) => sum + item.item.depositRate * item.quantity,
    0
  );
  const depositDiscount = Math.round(totalStandardDeposit * tierInfo.rate);
  const finalDeposit = Math.max(0, totalStandardDeposit - depositDiscount);
  const totalDue = totalRentalPrice + finalDeposit;

  // Kiểm tra ràng buộc tồn kho cho từng mục trong giỏ
  const itemsExceedingStock = cartItems.filter((ci) => {
    const maxStock = (ci.item as any)?.availableCount !== undefined ? (ci.item as any).availableCount : 1;
    return ci.quantity > maxStock || (ci.item as any)?.status === 'BOOKED';
  });
  const hasStockViolation = itemsExceedingStock.length > 0;

  const handleHoldBooking = async () => {
    if (hasStockViolation) {
      setPaymentError(
        `Có ${itemsExceedingStock.length} thiết bị trong giỏ hàng đã vượt quá số lượng tồn kho khả dụng. Vui lòng điều chỉnh số lượng trước khi đặt giữ chỗ.`
      );
      return;
    }

    if (!isAuthenticated) {
      openAuthModal('login', {
        type: 'BOOK_RENTAL',
        modelId: cartItems[0]?.id || 1,
        modelName: `Giỏ hàng (${cartItems.reduce((acc, c) => acc + c.quantity, 0)} thiết bị)`,
        startDate: finalStartDate,
        expectedReturnDate: finalEndDate,
        dailyRate: totalRentalPrice / rentalDays,
        depositRate: finalDeposit,
        days: rentalDays,
        totalRent: totalRentalPrice,
        totalDue: totalDue,
        quantity: cartItems.reduce((acc, c) => acc + c.quantity, 0),
        items: cartItems.map((ci) => ({
          modelId: ci.item.id,
          modelName: ci.item.name,
          quantity: ci.quantity,
        })),
      });
      return;
    }

    setIsCreatingOrder(true);
    setPaymentError(null);
    try {
      const res = await createRentalOrder(
        {
          type: 'BOOK_RENTAL',
          modelId: cartItems[0]?.id || 'CART',
          modelName: `Giỏ hàng (${cartItems.reduce((acc, c) => acc + c.quantity, 0)} thiết bị)`,
          startDate: finalStartDate,
          expectedReturnDate: finalEndDate,
          dailyRate: totalRentalPrice / rentalDays,
          depositRate: finalDeposit,
          days: rentalDays,
          totalRent: totalRentalPrice,
          totalDue: totalDue,
          quantity: cartItems.reduce((acc, c) => acc + c.quantity, 0),
          items: cartItems.map((ci) => ({
            modelId: ci.item.id,
            modelName: ci.item.name,
            quantity: ci.quantity,
          })),
        },
        user?.id || 1
      );

      setCreatedOrderCode(res.orderId);
      if (res.assignedSerials && res.assignedSerials.length > 0) {
        setAssignedSerials(res.assignedSerials);
      }
      const realDeadline = res.payment_deadline
        ? new Date(res.payment_deadline).getTime()
        : Date.now() + 15 * 60 * 1000;
      const initialSeconds = Math.max(0, Math.floor((realDeadline - Date.now()) / 1000));
      setTimeLeft(initialSeconds);
      setIsBooked(true);

      // Lưu đơn giữ chỗ 15 phút vào localStorage để nút góc dưới bên phải luôn hiển thị
      const reservationData = {
        orderCode: res.orderId,
        modelName: cartItems.length === 1 ? cartItems[0].item.name : `Giỏ hàng (${cartItems.reduce((acc, c) => acc + c.quantity, 0)} thiết bị)`,
        items: cartItems.map((ci) => ({
          modelId: ci.item.id,
          modelName: ci.item.name,
          quantity: ci.quantity,
        })),
        assignedSerials: res.assignedSerials || [],
        startDate: startDate || new Date().toISOString().split('T')[0],
        expectedReturnDate: expectedReturnDate || new Date().toISOString().split('T')[0],
        days: rentalDays,
        totalRent: totalRentalPrice,
        depositAmount: finalDeposit,
        totalDue: totalDue,
        createdAt: Date.now(),
        paymentDeadline: res.payment_deadline || new Date(realDeadline).toISOString(),
        expiresAt: realDeadline,
      };
      try {
        localStorage.setItem('refuji_active_reservation', JSON.stringify(reservationData));
        window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: reservationData }));
      } catch (_) {}

      // XÓA NGAY KHỎI GIỎ HÀNG KHI ĐÃ ĐẶT ĐƠN GIỮ CHỖ THÀNH CÔNG
      onClearCart();
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));

      if (setToast) {
        setToast({
          id: Date.now().toString(),
          message: res.message || `Đã khóa giữ chỗ 15 phút thành công cả giỏ hàng! Mã đơn: #${res.orderId}`,
          type: 'success',
        });
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Không thể tạo đơn giữ chỗ');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePayOrder = async () => {
    if (!createdOrderCode) return;
    setIsPaying(true);
    setPaymentError(null);
    try {
      await payRentalOrder(createdOrderCode, paymentMethod);
      setIsPaidSuccess(true);
      try {
        localStorage.removeItem('refuji_active_reservation');
        window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
      } catch (_) {}
      onClearCart();
      if (onCheckoutSuccess) onCheckoutSuccess();
      if (setToast) {
        setToast({
          id: Date.now().toString(),
          message: `Thanh toán thành công đơn hàng #${createdOrderCode}! Toàn bộ giỏ hàng đã được xác nhận.`,
          type: 'success',
        });
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Lỗi khi xử lý thanh toán');
    } finally {
      setIsPaying(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText?.(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const vietQrUrl = `https://img.vietqr.io/image/mbbank-0901234567-compact.png?amount=${totalDue}&addInfo=REFUJI%20${createdOrderCode || 'CART'}&accountName=CONG%20TY%20REFUJI`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_70px_rgba(20,24,32,0.18)] border border-[#14171f]/10 overflow-hidden flex flex-col h-[670px] max-h-[92vh] select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full flex items-center justify-center text-[#62687a] hover:text-[#14171f] bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer active:scale-95"
          aria-label="Đóng giỏ hàng"
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
        {!isBooked ? (
          <motion.div
            key="cart-content-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[#14171f]/8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#14171f]/[0.05] border border-[#14171f]/10 flex items-center justify-center text-[#14171f]">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg sm:text-xl font-normal text-[#14171f]">
                      Giỏ Hàng Thuê Thiết Bị
                    </h3>
                    <span className="bg-[#14171f] text-white text-[11px] font-mono px-2 py-0.5 rounded-full font-bold">
                      {cartItems.reduce((acc, c) => acc + c.quantity, 0)}
                    </span>
                  </div>
                  <p className="text-xs text-[#62687a] font-light">
                    REFUJI • Giữ chỗ 15 phút chống đặt trùng
                  </p>
                </div>
              </div>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="mr-8 text-xs text-[#828898] hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                  title="Xóa toàn bộ giỏ hàng"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Xóa tất cả</span>
                </button>
              )}
            </div>

            {/* Thanh Thời Gian Thuê Được Áp Dụng (Có nút Sửa ngày) */}
            <div className="bg-[#14171f]/[0.02] border-b border-[#14171f]/6 px-6 sm:px-8 py-3 flex items-center justify-between text-xs sm:text-[13px]">
              <div className="flex items-center gap-2 text-[#383e4e]">
                <CalendarIcon size={14} className="text-[#14171f]" />
                <span className="font-light">Lịch thuê:</span>
                <strong className="font-semibold text-[#14171f]">{rentalDatesText}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCalendar();
                }}
                className="text-xs font-semibold text-[#14171f] underline hover:opacity-70 cursor-pointer flex items-center gap-1"
              >
                Sửa ngày / Đổi lịch
              </button>
            </div>

            {/* Danh Sách Thiết Bị Trong Giỏ */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center my-auto py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#14171f]/[0.04] border border-[#14171f]/8 flex items-center justify-center text-[#828898] mb-4">
                    <ShoppingBag size={28} className="stroke-[1.3]" />
                  </div>
                  <h4 className="text-base font-medium text-[#14171f] mb-1">
                    Giỏ hàng của bạn đang trống
                  </h4>
                  <p className="text-xs sm:text-sm text-[#62687a] max-w-sm font-light mb-6">
                    Chưa có thiết bị nào được thêm. Hãy chọn máy ảnh Fujifilm hoặc ống kính bạn cần!
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-[#14171f] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-[#2c3242] transition-colors shadow-sm cursor-pointer"
                  >
                    Khám phá thiết bị ngay
                  </button>
                </div>
              ) : (
                cartItems.map((cartItem) => {
                  const item = cartItem.item;
                  const itemDepositDiscounted = Math.round(item.depositRate * (1 - tierInfo.rate));

                  return (
                    <div
                      key={cartItem.id}
                      className="p-4 rounded-2xl border border-[#14171f]/10 bg-white shadow-sm hover:border-[#14171f]/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-xl bg-[#14171f]/[0.03] border border-[#14171f]/8 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain product-stage-img"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#14171f] line-clamp-1">
                            {item.name}
                          </h4>
                          <div className="text-xs text-[#525868] mt-0.5 font-light">
                            <span>Thuê: <strong>{item.dailyRate.toLocaleString('vi-VN')}đ</strong> / ngày</span>
                            <span className="mx-1.5">•</span>
                            <span>Cọc: <strong className="text-[#14171f]">{itemDepositDiscounted.toLocaleString('vi-VN')}đ</strong></span>
                            {tierInfo.rate > 0 && (
                              <span className="ml-1 text-[10.5px] text-emerald-600 font-medium">
                                (-{tierInfo.rate * 100}%)
                              </span>
                            )}
                          </div>
                          {/* Ràng buộc tồn kho thiết bị */}
                          {(() => {
                            const maxStock = (item as any)?.availableCount !== undefined ? (item as any).availableCount : 1;
                            const isExceeded = cartItem.quantity > maxStock;
                            const isOutOfStock = maxStock <= 0 || (item as any)?.status === 'BOOKED';
                            return (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isOutOfStock
                                    ? 'bg-rose-500'
                                    : isExceeded
                                    ? 'bg-rose-500 animate-pulse'
                                    : maxStock === 1
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`} />
                                <span className={`text-[11px] font-medium ${
                                  isExceeded
                                    ? 'text-rose-600 font-semibold'
                                    : isOutOfStock
                                    ? 'text-rose-600 font-semibold'
                                    : maxStock === 1
                                    ? 'text-amber-800'
                                    : 'text-neutral-500'
                                }`}>
                                  {isOutOfStock
                                    ? 'Tạm hết hàng trong kho'
                                    : isExceeded
                                    ? `Vượt giới hạn tồn kho (Kho còn ${maxStock} máy)`
                                    : maxStock === 1
                                    ? 'Kho chỉ còn 1 máy'
                                    : `Kho còn ${maxStock} máy khả dụng`}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Số lượng & Xóa */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {(() => {
                          const maxStock = (item as any)?.availableCount !== undefined ? (item as any).availableCount : 1;
                          const isAtMax = cartItem.quantity >= maxStock;
                          return (
                            <div className="flex items-center gap-1.5 bg-[#14171f]/[0.04] border border-[#14171f]/10 rounded-full px-2 py-1">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[#525868] hover:text-[#14171f] hover:bg-white transition-colors cursor-pointer"
                                aria-label="Giảm số lượng"
                              >
                                <Minus size={12} />
                              </button>
                              <span className={`font-mono text-xs font-semibold px-2 ${cartItem.quantity > maxStock ? 'text-rose-600 font-bold' : 'text-[#14171f]'}`}>
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={isAtMax}
                                onClick={() => !isAtMax && onUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  isAtMax
                                    ? 'text-neutral-300 cursor-not-allowed bg-neutral-100'
                                    : 'text-[#525868] hover:text-[#14171f] hover:bg-white cursor-pointer'
                                }`}
                                title={isAtMax ? `Kho chỉ còn tối đa ${maxStock} thiết bị` : 'Tăng số lượng'}
                                aria-label="Tăng số lượng"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => onRemoveItem(cartItem.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa thiết bị"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Chi Phí & Nút Giữ Chỗ */}
            {cartItems.length > 0 && (
              <div className="px-6 sm:px-8 py-4 border-t border-[#14171f]/8 bg-[#fbfcfd] space-y-3 shrink-0">
                {/* Cảnh báo vi phạm ràng buộc tồn kho */}
                {hasStockViolation && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>Có thiết bị trong giỏ hàng đã vượt quá số lượng còn lại trong kho. Vui lòng giảm bớt số lượng để tiếp tục.</span>
                  </div>
                )}

                {/* Thông báo lỗi thanh toán hoặc từ máy chủ */}
                {paymentError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-[#62687a]">
                    <span>Tạm tính tiền thuê ({rentalDays} ngày):</span>
                    <span className="font-semibold text-[#14171f] font-mono">
                      {totalRentalPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#62687a]">
                    <div className="flex items-center gap-1.5">
                      <span>Tiền cọc thiết bị:</span>
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {tierInfo.label} (-{tierInfo.rate * 100}%)
                      </span>
                    </div>
                    <span className="font-semibold text-emerald-700 font-mono">
                      {finalDeposit.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-neutral-200/60 pt-1.5 font-bold text-sm text-[#14171f]">
                    <span>Tổng thanh toán:</span>
                    <span className="font-mono text-base text-emerald-700">
                      {totalDue.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleHoldBooking}
                  disabled={isCreatingOrder || hasStockViolation}
                  className={`w-full h-12 rounded-full font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                    hasStockViolation
                      ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                      : 'bg-[#14171f] text-white hover:bg-[#262c3a] active:scale-[0.99] cursor-pointer shadow-md disabled:opacity-50'
                  }`}
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Đang tạo giữ chỗ 15 phút...</span>
                    </>
                  ) : hasStockViolation ? (
                    <span>Vượt quá giới hạn tồn kho</span>
                  ) : (
                    <>
                      <Clock size={16} />
                      <span>Xác Nhận Giữ Chỗ 15 Phút Cả Giỏ Hàng</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* TRẠNG THÁI GIỮ CHỖ & THANH TOÁN (PAYMENT SCREEN FOR CART) */
          <motion.div
            key="cart-payment-view"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-4 border-b border-[#14171f]/10 bg-white shrink-0 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#14171f]">
                    {isPaidSuccess ? 'Xác Nhận Đơn Hàng Thành Công' : 'Thanh Toán Giữ Chỗ Giỏ Hàng'}
                  </h3>
                  {createdOrderCode && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      #{createdOrderCode}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6e7587] mt-0.5">
                  Lịch thuê: <strong>{rentalDatesText}</strong> ({cartItems.reduce((acc, c) => acc + c.quantity, 0)} thiết bị)
                </p>
              </div>
            </div>

            {/* Thanh đếm ngược 15 phút */}
            {!isPaidSuccess && (
              <div className="px-6 sm:px-8 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
                <div className="flex items-center gap-2 font-medium">
                  <Clock size={16} className="text-amber-700 animate-pulse" />
                  <span>Thời hạn giữ chỗ 15 phút chống đặt trùng:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-amber-800">Còn lại:</span>
                  <span className="font-mono font-bold text-sm bg-amber-200/80 px-2.5 py-0.5 rounded text-amber-950 shadow-inner">
                    {timerDisplay}
                  </span>
                </div>
              </div>
            )}

            {/* Nội dung thanh toán cuộn */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4">
              {isPaidSuccess ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#14171f]">
                      Đã Xác Nhận Đơn Thuê Thành Công!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#525868] mt-1.5 max-w-md mx-auto leading-relaxed">
                      Đơn hàng <strong>#{createdOrderCode}</strong> đã được chuyển sang trạng thái <strong>ĐÃ XÁC NHẬN (CONFIRMED)</strong>. Thiết bị đã được giữ cố định theo lịch của bạn.
                    </p>
                  </div>

                  {assignedSerials.length > 0 && (
                    <div className="w-full max-w-md mx-auto py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex justify-between items-center">
                      <span className="font-medium">Mã Serial thiết bị bàn giao:</span>
                      <span className="font-mono font-bold">{assignedSerials.join(', ')}</span>
                    </div>
                  )}

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
                  {/* Bảng kê khai chi phí */}
                  <div className="p-4 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2 text-xs">
                    {assignedSerials.length > 0 && (
                      <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mb-2">
                        <span className="font-medium">Serial khóa giữ chỗ kho:</span>
                        <span className="font-mono font-bold text-emerald-950">{assignedSerials.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-600">
                      <span>Tiền thuê ({rentalDays} ngày):</span>
                      <span className="font-mono font-medium">{totalRentalPrice.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Tiền cọc thiết bị (hoàn 100% khi trả):</span>
                      <span className="font-mono font-medium">{finalDeposit.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-200/60 pt-2 font-bold text-sm text-[#14171f]">
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

                  {/* VietQR View */}
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
                              >
                                {copiedField === 'acc' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-neutral-200">
                            <span className="text-neutral-500">Số tiền:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-emerald-700">{totalDue.toLocaleString('vi-VN')} ₫</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(String(totalDue), 'amt')}
                                className="text-neutral-400 hover:text-[#14171f]"
                              >
                                {copiedField === 'amt' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-neutral-500">Nội dung CK:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">REFUJI {createdOrderCode}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(`REFUJI ${createdOrderCode}`, 'memo')}
                                className="text-neutral-400 hover:text-[#14171f]"
                              >
                                {copiedField === 'memo' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {paymentError}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chân Modal */}
            {!isPaidSuccess && (
              <div className="px-6 sm:px-8 py-4 border-t border-[#14171f]/10 bg-white shrink-0 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full border border-[#14171f]/20 hover:bg-neutral-50 text-xs font-semibold text-[#14171f] transition-all cursor-pointer"
                >
                  Để thanh toán sau
                </button>

                <button
                  type="button"
                  onClick={handlePayOrder}
                  disabled={isPaying || timeLeft <= 0}
                  className="flex-1 py-3 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPaying ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang xác nhận giao dịch...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>
                        {paymentMethod === 'VIETQR'
                          ? 'Tôi đã chuyển khoản xong'
                          : paymentMethod === 'VNPAY'
                          ? 'Thanh toán qua VNPAY'
                          : 'Xác nhận cọc & thanh toán tại quầy'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
