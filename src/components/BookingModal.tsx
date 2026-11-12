import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModel, LensModel, AccessoryModel, EquipmentItem } from '../types';
import { 
  X, 
  Calendar as CalendarIcon, 
  Check,
  Clock, 
  Star, 
  Share2, 
  Heart, 
  CheckCircle2,  
  Zap,
  ShoppingBag,
  QrCode,
  CreditCard,
  Store,
  Copy,
  Loader2,
  CalendarDays,
  AlertCircle,
  Search,
  Ban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchModelAvailability } from '../services/api';
import {
  createRentalOrder,
  payRentalOrder,
  cancelGuestOrder,
  cancelMyOrder,
  saveRecentGuestOrder,
  updateRecentGuestOrderStatus,
} from '../services/authApi';
import { GuestCustomerStep, GuestCustomerSubmitPayload } from './booking/GuestCustomerStep';
import { isSmallThumbnailImage } from '../utils/cn';
import {
  POPUP_BACKDROP_CLASS,
  POPUP_FRAME_CLASS,
  POPUP_INNER_CLASS,
  POPUP_CLOSE_BUTTON_CLASS,
  getBackdropDismissProps,
} from './ui/popupTheme';

interface BookingModalProps {
  item: CameraModel | LensModel | AccessoryModel | null;
  onClose: () => void;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  onAddToCart?: (item: EquipmentItem) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  onOpenCalendar?: () => void;
  onOpenGuestLookup?: () => void;
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

// Tính năng: Modal đặt thuê thiết bị hỗ trợ cả Thành viên và Khách vãng lai (đặt nhanh 3 bước) kèm kiểm tra lịch trùng
export const BookingModal: React.FC<BookingModalProps> = ({ 
  item, 
  onClose,
  membershipTier = 'BRONZE',
  onAddToCart,
  initialStartDate,
  initialEndDate,
  onOpenCalendar,
  onOpenGuestLookup,
}) => {
  const defStart = initialStartDate || getTodayStr();
  const defEnd = initialEndDate || addDaysToStr(defStart, 3);

  const [startDate, setStartDate] = useState(defStart);
  const [expectedReturnDate, setExpectedReturnDate] = useState(defEnd);

  // Tính số ngày thuê chính xác
  const calculateDaysBetween = (s: string, e: string) => {
    const sDate = new Date(s);
    const eDate = new Date(e);
    const diff = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  };

  const days = calculateDaysBetween(startDate, expectedReturnDate);

  const [isCustomerStep, setIsCustomerStep] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [isCounterInquiryResult, setIsCounterInquiryResult] = useState(false);
  const [activeGuestPhone, setActiveGuestPhone] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [liveAvailableCount, setLiveAvailableCount] = useState<number | null>(null);

  // Trạng thái giữ chỗ và thanh toán
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [assignedSerials, setAssignedSerials] = useState<string[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'VNPAY' | 'COUNTER'>('VIETQR');
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Đồng hồ đếm ngược 15 phút (900 giây) thực tế
  const [timeLeft, setTimeLeft] = useState(900);

  const { isAuthenticated, openAuthModal, user, setToast } = useAuth();

  // Tính năng: Đặt lại trạng thái bước đặt/thanh toán khi chuyển sang thiết bị khác
  useEffect(() => {
    setIsCustomerStep(false);
    setIsBooked(false);
    setIsCounterInquiryResult(false);
    setActiveGuestPhone(null);
    setCreatedOrderCode(null);
    setAssignedSerials([]);
    setIsPaidSuccess(false);
    setPaymentError(null);
    setIsCancelling(false);
    setTimeLeft(900);
  }, [item?.id]);

  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialEndDate) setExpectedReturnDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  // Tính năng: Kiểm tra số lượng trống theo ngày nhận - trả mỗi khi đổi ngày trong BookingModal
  useEffect(() => {
    if (!item?.id || !startDate || !expectedReturnDate) return;
    let active = true;
    fetchModelAvailability(item.id, startDate, expectedReturnDate).then((res) => {
      if (active && res && typeof res.availableCount === 'number') {
        setLiveAvailableCount(res.availableCount);
      }
    });
    return () => {
      active = false;
    };
  }, [item?.id, startDate, expectedReturnDate]);

  // Bộ đếm ngược 15 phút chạy từng giây khi đã giữ chỗ
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

  if (!item) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const effectiveTier = isAuthenticated ? (user?.membership_tier || membershipTier) : 'BRONZE';
  const discountRate = effectiveTier === 'PLATINUM' ? 0.15 : effectiveTier === 'GOLD' ? 0.10 : effectiveTier === 'SILVER' ? 0.05 : 0;
  const discountedDeposit = Math.round(item.depositRate * (1 - discountRate));
  const totalRent = item.dailyRate * days;
  const totalDue = totalRent + discountedDeposit;

  // Xử lý khi chọn nhanh thời lượng ngày (1, 3, 5, 7, 14)
  const handleQuickDays = (d: number) => {
    const newEnd = addDaysToStr(startDate, d);
    setExpectedReturnDate(newEnd);
  };

  // Thay đổi ngày nhận
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val >= expectedReturnDate) {
      setExpectedReturnDate(addDaysToStr(val, 3));
    }
  };

  // Thay đổi ngày trả
  const handleEndDateChange = (val: string) => {
    if (val <= startDate) {
      setExpectedReturnDate(addDaysToStr(startDate, 1));
    } else {
      setExpectedReturnDate(val);
    }
  };

  const availableStock = liveAvailableCount !== null ? liveAvailableCount : (item?.availableCount ?? 1);
  const isOutOfStock = availableStock <= 0;

  // Tính năng: Mở Bước 2 nhập thông tin cho Khách vãng lai hoặc tạo đơn trực tiếp cho Thành viên
  const handleConfirm = async () => {
    if (isOutOfStock) {
      setPaymentError(`Thiết bị "${item.name}" hiện đã hết hàng trong khoảng ngày bạn chọn.`);
      return;
    }

    if (!isAuthenticated) {
      setPaymentError(null);
      setIsCustomerStep(true);
      return;
    }

    setIsCreatingOrder(true);
    setPaymentError(null);
    try {
      const res = await createRentalOrder(
        {
          type: 'BOOK_RENTAL',
          modelId: item.id,
          modelName: item.name,
          startDate,
          expectedReturnDate,
          dailyRate: item.dailyRate,
          depositRate: discountedDeposit,
          days,
          totalRent,
          totalDue,
          quantity: 1,
          items: [{
            modelId: item.id,
            modelName: item.name,
            quantity: 1,
          }],
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

      const reservationData = {
        orderCode: res.orderId,
        modelName: item.name,
        items: [{
          modelId: item.id,
          modelName: item.name,
          quantity: 1,
        }],
        assignedSerials: res.assignedSerials || [],
        startDate,
        expectedReturnDate,
        days,
        totalRent,
        depositAmount: discountedDeposit,
        totalDue,
        createdAt: Date.now(),
        paymentDeadline: res.payment_deadline || new Date(realDeadline).toISOString(),
        expiresAt: realDeadline,
      };
      try {
        localStorage.setItem('refuji_active_reservation', JSON.stringify(reservationData));
        window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: reservationData }));
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));

      if (setToast) {
        setToast({
          id: Date.now().toString(),
          message: res.message || `Đã khóa giữ chỗ 15 phút thành công cho ${item.name}! Mã đơn: #${res.orderId}`,
          type: 'success',
        });
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Không thể tạo đơn giữ chỗ');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Tính năng: Gửi thông tin khách vãng lai tạo đơn Online (15p) hoặc Yêu cầu tại quầy (GUEST_INQUIRY)
  const handleGuestCustomerSubmit = async (payload: GuestCustomerSubmitPayload) => {
    setIsCreatingOrder(true);
    setPaymentError(null);
    try {
      const res = await createRentalOrder(
        {
          type: 'BOOK_RENTAL',
          modelId: item.id,
          modelName: item.name,
          startDate,
          expectedReturnDate,
          dailyRate: item.dailyRate,
          depositRate: item.depositRate,
          days,
          totalRent,
          totalDue: totalRent + item.depositRate,
          quantity: 1,
          items: [{
            modelId: item.id,
            modelName: item.name,
            quantity: 1,
          }],
        },
        null,
        {
          guestInfo: payload.guestInfo,
          bookingMode: payload.bookingMode,
          paymentMethod: payload.paymentMethod,
        }
      );

      setCreatedOrderCode(res.orderId);
      setActiveGuestPhone(payload.guestInfo.phone);
      saveRecentGuestOrder({
        orderCode: res.orderId,
        phone: payload.guestInfo.phone,
        modelName: item.name,
        status: res.status || 'PENDING_PAYMENT',
        createdAt: Date.now(),
      });

      setIsCustomerStep(false);

      if (res.status === 'GUEST_INQUIRY') {
        setAssignedSerials([]);
        setIsCounterInquiryResult(true);
        setIsPaidSuccess(true);
        setIsBooked(true);
        if (setToast) {
          setToast({
            id: Date.now().toString(),
            message: res.message || `Đã gửi yêu cầu đặt tại quầy #${res.orderId}!`,
            type: 'success',
          });
        }
        return;
      }

      if (res.assignedSerials && res.assignedSerials.length > 0) {
        setAssignedSerials(res.assignedSerials);
      }
      setPaymentMethod(payload.paymentMethod === 'VNPAY' ? 'VNPAY' : 'VIETQR');
      const realDeadline = res.payment_deadline
        ? new Date(res.payment_deadline).getTime()
        : Date.now() + 15 * 60 * 1000;
      const initialSeconds = Math.max(0, Math.floor((realDeadline - Date.now()) / 1000));
      setTimeLeft(initialSeconds);
      setIsBooked(true);

      const reservationData = {
        orderCode: res.orderId,
        modelName: item.name,
        items: [{
          modelId: item.id,
          modelName: item.name,
          quantity: 1,
        }],
        assignedSerials: res.assignedSerials || [],
        startDate,
        expectedReturnDate,
        days,
        totalRent,
        depositAmount: item.depositRate,
        totalDue: totalRent + item.depositRate,
        createdAt: Date.now(),
        paymentDeadline: res.payment_deadline || new Date(realDeadline).toISOString(),
        expiresAt: realDeadline,
        isGuest: true,
        guestPhone: payload.guestInfo.phone,
      };
      try {
        localStorage.setItem('refuji_active_reservation', JSON.stringify(reservationData));
        window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: reservationData }));
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));

      if (setToast) {
        setToast({
          id: Date.now().toString(),
          message: res.message || `Đã khóa giữ chỗ 15 phút thành công! Mã đơn: #${res.orderId}`,
          type: 'success',
        });
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Không thể tạo đơn đặt thuê');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Xử lý thanh toán cọc
  const handlePayOrder = async () => {
    if (!createdOrderCode) return;
    setIsPaying(true);
    setPaymentError(null);
    try {
      const res = await payRentalOrder(createdOrderCode, paymentMethod, activeGuestPhone || undefined);
      const isInquiry = res.orderStatus === 'GUEST_INQUIRY';
      setIsCounterInquiryResult(isInquiry);
      setIsPaidSuccess(true);
      if (activeGuestPhone) {
        updateRecentGuestOrderStatus(createdOrderCode, res.orderStatus || 'CONFIRMED');
      }
      try {
        localStorage.removeItem('refuji_active_reservation');
        window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      if (setToast) {
        setToast({
          id: Date.now().toString(),
          message: isInquiry
            ? `Đã chuyển đơn #${createdOrderCode} sang đặt tại quầy (nhả khóa 15p).`
            : `Thanh toán thành công đơn hàng #${createdOrderCode}! Thiết bị đã sẵn sàng.`,
          type: 'success',
        });
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Lỗi khi xử lý thanh toán');
    } finally {
      setIsPaying(false);
    }
  };

  // Tính năng: Hủy giữ chỗ / hủy yêu cầu trực tiếp trong Modal Đặt máy để trả Serial về kho
  const handleCancelHold = async () => {
    if (!createdOrderCode) {
      setIsBooked(false);
      onClose();
      return;
    }
    const cancelledCode = createdOrderCode;
    setIsCancelling(true);
    setPaymentError(null);
    try {
      if (activeGuestPhone) {
        await cancelGuestOrder(cancelledCode, activeGuestPhone);
        updateRecentGuestOrderStatus(cancelledCode, 'CANCELLED');
      } else {
        await cancelMyOrder(cancelledCode);
      }

      try {
        const rawRes = localStorage.getItem('refuji_active_reservation');
        if (rawRes) {
          const parsed = JSON.parse(rawRes);
          if (parsed.orderCode === cancelledCode) {
            localStorage.removeItem('refuji_active_reservation');
            window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
          }
        }
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      setIsBooked(false);
      setCreatedOrderCode(null);
      setAssignedSerials([]);
      setIsPaidSuccess(false);
      setIsCounterInquiryResult(false);
      onClose();
      if (setToast) {
        setToast({
          id: Date.now().toString(),
          message: `Đã hủy giữ chỗ đơn #${cancelledCode} và trả thiết bị về kho.`,
          type: 'info',
        });
      }
    } catch (e: any) {
      setPaymentError(e.message || 'Không thể hủy giữ chỗ đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText?.(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDateDisplay = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length < 3) return dStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const vietQrUrl = `https://img.vietqr.io/image/mbbank-0901234567-compact.png?amount=${totalDue}&addInfo=REFUJI%20${createdOrderCode || 'ORD'}&accountName=CONG%20TY%20REFUJI`;

  // Trích xuất thông số kỹ thuật
  const isCamera = 'sensor' in item;
  const isLens = 'focalLength' in item;
  const cameraItem = isCamera ? (item as CameraModel) : null;
  const lensItem = isLens ? (item as LensModel) : null;

  // Tính năng: Quy chuẩn khung popup Chi tiết & Đặt máy về cố định 1 khung chung
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      {...getBackdropDismissProps(onClose)}
      className={`${POPUP_BACKDROP_CLASS} z-50`}
    >
      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={POPUP_FRAME_CLASS}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={POPUP_INNER_CLASS}>
        {/* Nút đóng tròn phong cách Apple */}
        <button 
          onClick={onClose}
          className={POPUP_CLOSE_BUTTON_CLASS}
          aria-label="Đóng cửa sổ"
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
        {isCustomerStep ? (
          <motion.div
            key="booking-customer-step"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            className="flex-1 min-h-0 flex flex-col h-full overflow-hidden"
          >
            <GuestCustomerStep
              summaryTitle={item.name}
              rentalDateDisplay={`${formatDateDisplay(startDate)} — ${formatDateDisplay(expectedReturnDate)}`}
              days={days}
              totalRent={totalRent}
              standardDeposit={item.depositRate}
              isSubmitting={isCreatingOrder}
              serverError={paymentError}
              onBack={() => {
                setPaymentError(null);
                setIsCustomerStep(false);
              }}
              onSwitchToMemberLogin={() => {
                setIsCustomerStep(false);
                onClose();
                openAuthModal('login', {
                  type: 'BOOK_RENTAL',
                  source: 'BOOKING_MODAL',
                  modelId: item.id,
                  modelName: item.name,
                  startDate,
                  expectedReturnDate,
                  dailyRate: item.dailyRate,
                  depositRate: item.depositRate,
                  days,
                  totalRent,
                  totalDue: totalRent + item.depositRate,
                  quantity: 1,
                  items: [{
                    modelId: item.id,
                    modelName: item.name,
                    quantity: 1,
                  }],
                });
              }}
              onSubmit={handleGuestCustomerSubmit}
            />
          </motion.div>
        ) : !isBooked ? (
          <motion.div 
            key="booking-content-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-h-0 overflow-y-auto scroll-smooth"
          >
            {/* 1. KHU VỰC HERO BANNER — Chức năng: Ảnh máy cỡ vuông liền mạch nền trắng + Giá thuê nổi bật + 4 nút thao tác cùng hàng */}
            <div className="relative px-6 sm:px-8 pt-5 pb-4 border-b border-[#14171f]/10 bg-white">
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5">
                {/* Vùng hiển thị ảnh thiết bị cỡ vuông, hòa liền với nền trắng */}
                <div className="w-40 h-40 sm:w-[176px] sm:h-[176px] aspect-square shrink-0 flex items-center justify-center overflow-hidden bg-transparent">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className={`w-full h-full object-contain product-stage-img transition-transform duration-700 ${
                      isSmallThumbnailImage(item)
                        ? 'scale-[1.58] hover:scale-[1.65]'
                        : 'scale-[1.06] hover:scale-[1.12]'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0 w-full flex flex-col justify-between gap-2.5 py-0.5">
                  <div className="sm:pr-9">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-3 py-0.5 rounded-full bg-[#14171f]/[0.06] text-[10.5px] font-sans font-semibold tracking-wider text-[#3c4252] uppercase border border-[#14171f]/10">
                        REFUJI STUDIO
                      </span>
                      <span className="px-3 py-0.5 rounded-full bg-[#14171f]/[0.06] text-[#3c4252] text-[10.5px] font-sans font-bold tracking-wider uppercase border border-[#14171f]/10">
                        {isCamera || isLens ? 'FUJIFILM JAPAN' : (item.brand || 'REFUJI').toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl leading-tight font-medium text-[#14171f] tracking-tight">
                      {item.name}
                    </h3>

                    {/* Hiển thị giới hạn tồn kho thực tế theo khoảng ngày */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isOutOfStock ? 'bg-rose-500' : availableStock === 1 ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                      <span className={`text-xs font-semibold leading-snug ${isOutOfStock ? 'text-rose-600' : availableStock === 1 ? 'text-amber-800' : 'text-emerald-700'}`}>
                        {isOutOfStock
                          ? 'Đã hết hàng trong khoảng ngày đã chọn'
                          : availableStock === 1
                          ? `Kho chỉ còn duy nhất 1 ${isCamera || isLens ? 'máy' : 'thiết bị'} trong lịch này`
                          : `Kho sẵn sàng: ${availableStock} ${isCamera || isLens ? 'máy' : 'thiết bị'} trong lịch đã chọn`}
                      </span>
                    </div>
                  </div>

                  {/* Giá thuê theo ngày nổi bật tại khoảng giữa Header */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-sans num text-2xl sm:text-[26px] font-bold tracking-tight text-[#14171f] leading-none whitespace-nowrap">
                      {item.dailyRate.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-sm font-normal text-gray-500 whitespace-nowrap">
                      / ngày
                    </span>
                  </div>

                  {/* Hàng nút tương tác cùng dòng: Đặt hàng + Thêm giỏ hàng + Thả tym + Chia sẻ */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={isCreatingOrder || isOutOfStock}
                      className={`px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 whitespace-nowrap ${
                        isOutOfStock
                          ? 'bg-neutral-200 text-neutral-600 border border-neutral-300 cursor-not-allowed shadow-none select-none'
                          : 'bg-[#14171f] hover:bg-[#252a37] text-white shadow-[0_4px_16px_rgba(20,24,32,0.18)] active:scale-95 transition-all cursor-pointer disabled:opacity-50'
                      }`}
                    >
                      {isCreatingOrder ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span>Đang tạo giữ chỗ...</span>
                        </>
                      ) : isOutOfStock ? (
                        <span>Đã hết hàng</span>
                      ) : (
                        <>
                          <Zap size={16} className="fill-white" />
                          <span>{isAuthenticated ? 'Đặt hàng (Giữ chỗ 15p)' : 'Đặt hàng ngay'}</span>
                        </>
                      )}
                    </button>

                    {onAddToCart && (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => !isOutOfStock && onAddToCart(item)}
                        title={isOutOfStock ? 'Thiết bị tạm hết trong kho' : 'Thêm vào giỏ hàng'}
                        aria-label={isOutOfStock ? 'Thiết bị tạm hết trong kho' : 'Thêm vào giỏ hàng'}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
                          isOutOfStock
                            ? 'bg-neutral-200 text-neutral-600 border-neutral-300 cursor-not-allowed shadow-none select-none'
                            : 'bg-white hover:bg-[#14171f] hover:text-white text-[#14171f] border-[#14171f]/15 shadow-sm transition-all active:scale-95 cursor-pointer'
                        }`}
                      >
                        <ShoppingBag size={17} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsFavorited(!isFavorited)}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isFavorited 
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                          : 'bg-white hover:bg-neutral-50 text-[#14171f] border-[#14171f]/15 shadow-sm'
                      }`}
                      aria-label="Thêm vào danh sách mong muốn"
                    >
                      <Heart size={17} className={isFavorited ? 'fill-current' : ''} />
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-10 h-10 rounded-full border border-[#14171f]/15 bg-white hover:bg-neutral-50 text-[#14171f] flex items-center justify-center transition-all cursor-pointer relative shadow-sm shrink-0"
                      aria-label="Chia sẻ thiết bị"
                    >
                      <Share2 size={17} />
                      {copiedLink && (
                        <span className="absolute -top-8 px-2 py-1 rounded-full bg-[#14171f] text-[10px] text-white whitespace-nowrap border border-[#14171f]/20 shadow-md">
                          Đã copy link!
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {paymentError && !isBooked && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}
            </div>

            {/* 2. DÒNG THÔNG SỐ NHANH */}
            <div className="px-6 sm:px-8 py-2.5 flex flex-wrap items-center gap-2 border-b border-[#14171f]/10 text-xs text-[#525868]">
              <div className="flex items-center gap-1 text-[#14171f] font-bold">
                <Star size={14} className="fill-[#14171f] text-[#14171f]" />
                <span>4.9</span>
                <span className="text-[#888f9e] font-normal">(128 đánh giá)</span>
              </div>
              <span className="text-[#14171f]/20">•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.04] border border-[#14171f]/10 text-[11px] font-medium text-[#2d3342]">
                Thế hệ 2026
              </span>
              {isCamera && (
                <>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.04] border border-[#14171f]/10 text-[11px] font-medium text-[#2d3342]">
                    {cameraItem?.resolution}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.04] border border-[#14171f]/10 text-[11px] font-medium text-[#2d3342]">
                    IBIS 5 trục
                  </span>
                </>
              )}
              {isLens && (
                <>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.04] border border-[#14171f]/10 text-[11px] font-medium text-[#2d3342]">
                    {lensItem?.aperture}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.04] border border-[#14171f]/10 text-[11px] font-medium text-[#2d3342]">
                    Ngàm {lensItem?.mount}
                  </span>
                </>
              )}
              {/* Đồng bộ trạng thái: ẩn chấm xanh khi hết hàng để tránh mâu thuẫn thị giác */}
              {isOutOfStock ? (
                <div className="flex items-center gap-1.5 ml-auto text-gray-600 text-[11.5px] font-medium">
                  <Store size={13} className="text-gray-500 shrink-0" />
                  <span>Nhận và trả máy tại REFUJI Studio</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 ml-auto text-[#2d3342] text-[11.5px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sẵn sàng bàn giao tại cửa hàng</span>
                </div>
              )}
            </div>

            {/* 3. BỐ CỤC THU GỌN: HÀNG TRÊN (LỊCH THUÊ + THÔNG SỐ) & BẢNG CHI PHÍ */}
            <div className="px-6 pt-4 pb-6 sm:px-8 sm:pt-4 sm:pb-6 space-y-3.5">
              {/* Hàng trên: 2 cột cân bằng chiều cao */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
                {/* CỘT TRÁI (7 COLS): THỜI GIAN & LỊCH THUÊ MÁY */}
                <div className="md:col-span-7 p-3.5 sm:p-4 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2.5 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#14171f] uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarIcon size={14} className="text-[#14171f]" />
                      <span>Thời Gian &amp; Lịch Thuê</span>
                    </span>
                    {onOpenCalendar && (
                      <button
                        type="button"
                        onClick={onOpenCalendar}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#14171f]/15 hover:bg-[#14171f] hover:text-white text-[11px] font-semibold text-[#14171f] transition-all cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                      >
                        <CalendarDays size={12} />
                        <span>Mở lịch</span>
                      </button>
                    )}
                  </div>

                  {/* Hai ô chọn / sửa ngày nhận và trả */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-[#6e7587] pl-1">
                        Ngày nhận máy
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        min={getTodayStr()}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full px-3 py-1.5 text-[11.5px] font-medium font-sans num rounded-full border border-neutral-300 bg-white text-[#14171f] outline-none focus:border-[#14171f]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-semibold text-[#6e7587] pl-1">
                        Ngày trả máy
                      </label>
                      <input
                        type="date"
                        value={expectedReturnDate}
                        min={startDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="w-full px-3 py-1.5 text-[11.5px] font-medium font-sans num rounded-full border border-neutral-300 bg-white text-[#14171f] outline-none focus:border-[#14171f]"
                      />
                    </div>
                  </div>

                  {/* Chọn nhanh số ngày */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#525868] mb-1.5">
                      <span>Chọn nhanh số ngày:</span>
                      <span className="font-bold text-[#14171f] num">{days} ngày</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 3, 5, 7, 14].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleQuickDays(d)}
                          className={`px-1 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer num whitespace-nowrap ${
                            days === d
                              ? 'bg-[#14171f] text-white shadow-sm font-bold'
                              : 'bg-white border border-[#14171f]/12 text-[#444a59] hover:bg-neutral-100 active:scale-95'
                          }`}
                        >
                          {d} ngày
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI (5 COLS): THÔNG SỐ KỸ THUẬT THU GỌN */}
                <div className="md:col-span-5 bg-[#f7f8fa] border border-[#14171f]/10 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-[#6e7587] mb-2.5">
                      Thông số kỹ thuật
                    </h4>

                    <div className="space-y-2 text-xs">
                      {isCamera && (
                        <>
                          <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Cảm biến:</span>
                            <span className="text-[#14171f] font-medium text-right leading-snug">{cameraItem?.sensor}</span>
                          </div>
                          <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Độ phân giải:</span>
                            <span className="text-[#14171f] font-medium text-right num whitespace-nowrap">{cameraItem?.resolution}</span>
                          </div>
                          <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Dòng máy:</span>
                            <span className="text-[#14171f] font-medium text-right whitespace-nowrap">{cameraItem?.series} Series</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Hệ ngàm:</span>
                            <span className="text-[#14171f] font-medium text-right whitespace-nowrap">
                              {cameraItem?.mountType === 'NONE'
                                ? 'Ống kính liền (Fixed Lens)'
                                : cameraItem?.series === 'GFX' || cameraItem?.mountType === 'G_MOUNT'
                                ? 'Fujifilm G Mount'
                                : 'Fujifilm X Mount'}
                            </span>
                          </div>
                        </>
                      )}

                      {isLens && (
                        <>
                          <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Tiêu cự:</span>
                            <span className="text-[#14171f] font-medium text-right num whitespace-nowrap">{lensItem?.focalLength}</span>
                          </div>
                          <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Khẩu độ:</span>
                            <span className="text-[#14171f] font-medium text-right num whitespace-nowrap">{lensItem?.aperture}</span>
                          </div>
                          <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Ngàm:</span>
                            <span className="text-[#14171f] font-medium text-right whitespace-nowrap">{lensItem?.mount} Mount</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Trọng lượng:</span>
                            <span className="text-[#14171f] font-medium text-right num whitespace-nowrap">{lensItem?.weight || '187g'}</span>
                          </div>
                        </>
                      )}

                      {!isCamera && !isLens && (
                        <>
                          <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Nhóm phụ kiện:</span>
                            <span className="text-[#14171f] font-medium text-right">
                              {(item as AccessoryModel).subCategory || 'Phụ kiện Studio'}
                            </span>
                          </div>
                          {((item as AccessoryModel).capacity || (item as AccessoryModel).readSpeed) && (
                            <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                              <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Thông số chính:</span>
                              <span className="text-[#14171f] font-medium text-right num">
                                {[(item as AccessoryModel).capacity, (item as AccessoryModel).readSpeed]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </span>
                            </div>
                          )}
                          {(item as AccessoryModel).compatibility && (
                            <div className="flex justify-between gap-2 pb-1.5 border-b border-[#14171f]/[0.06]">
                              <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Tương thích:</span>
                              <span className="text-[#14171f] font-medium text-right leading-snug">
                                {(item as AccessoryModel).compatibility}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between gap-2">
                            <span className="text-[#6e7587] shrink-0 whitespace-nowrap">Thương hiệu:</span>
                            <span className="text-[#14171f] font-medium text-right">{item.brand || 'Fujifilm'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bảng kê khai chi phí — Chiều ngang rộng, giữ số tiền và ₫ trên cùng 1 dòng */}
              <div className="bg-[#f7f8fa] rounded-2xl p-3.5 sm:p-4 border border-[#14171f]/10 space-y-2 text-xs num">
                <div className="flex items-baseline justify-between gap-3 text-[#525868]">
                  <span>Tiền thuê ({days} ngày × {item.dailyRate.toLocaleString('vi-VN')}₫):</span>
                  <span className="text-[#14171f] font-semibold whitespace-nowrap shrink-0">
                    {totalRent.toLocaleString('vi-VN')}₫
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-3 text-[#525868]">
                  <span>Tiền đặt cọc (hoàn 100% khi trả máy):</span>
                  <span className="whitespace-nowrap shrink-0">
                    {discountRate > 0 ? (
                      <>
                        <span className="line-through text-[#8e95a6] mr-1.5">{item.depositRate.toLocaleString('vi-VN')}₫</span>
                        <span className="text-[#14171f] font-bold">{discountedDeposit.toLocaleString('vi-VN')}₫ (-{discountRate * 100}%)</span>
                      </>
                    ) : (
                      <span className="text-[#14171f] font-semibold">{item.depositRate.toLocaleString('vi-VN')}₫</span>
                    )}
                  </span>
                </div>

                <div className="w-full h-[1px] bg-[#14171f]/10" />

                <div className="flex items-baseline justify-between gap-3 font-semibold text-sm text-[#14171f]">
                  <span>Tổng thanh toán tạm tính:</span>
                  <span className="text-[#14171f] font-bold text-base whitespace-nowrap shrink-0">
                    {totalDue.toLocaleString('vi-VN')}₫
                  </span>
                </div>

                <p className="text-[11px] text-[#747b8c] leading-snug italic">
                  * Hoàn trả cọc ngay khi kiểm tra thiết bị lúc trả máy tại quầy.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* TRẠNG THÁI GIỮ MÁY & THANH TOÁN (PAYMENT & HOLD CONFIRMATION SCREEN) */
          <motion.div
            key="booking-payment-view"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="flex-1 min-h-0 flex flex-col h-full overflow-hidden"
          >
            {/* Header thanh toán */}
            <div className="px-6 sm:px-8 py-4 border-b border-[#14171f]/10 bg-white shrink-0 flex items-center justify-between pr-14">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#14171f]">
                    {isPaidSuccess
                      ? isCounterInquiryResult
                        ? 'Đã Gửi Yêu Cầu Đặt Tại Quầy'
                        : 'Xác Nhận Đơn Hàng Thành Công'
                      : 'Thanh Toán & Giữ Chỗ Thiết Bị'}
                  </h3>
                  {createdOrderCode && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans tracking-wide num font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      #{createdOrderCode}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6e7587] mt-0.5">
                  Thiết bị: <span className="font-semibold text-[#14171f]">{item.name}</span>
                </p>
              </div>
            </div>

            {/* THANH ĐẾM NGƯỢC THỜI HẠN GIỮ CHỖ 15 PHÚT */}
            {!isPaidSuccess && (
              <div className="px-6 sm:px-8 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
                <div className="flex items-center gap-2 font-medium">
                  <Clock size={16} className="text-amber-700 animate-pulse" />
                  <span>Thời hạn giữ chỗ 15 phút chống đặt trùng:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-amber-800">Còn lại:</span>
                  <span className="font-sans num font-bold text-sm bg-amber-200/80 px-3 py-0.5 rounded-full text-amber-950 shadow-inner">
                    {timerDisplay}
                  </span>
                </div>
              </div>
            )}

            {/* Nội dung thanh toán cuộn */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5 space-y-4">
              {isPaidSuccess ? (
                /* THÀNH CÔNG HOÀN TẤT */
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center border shadow-sm ${
                      isCounterInquiryResult
                        ? 'bg-violet-100 text-violet-700 border-violet-200'
                        : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                    }`}
                  >
                    {isCounterInquiryResult ? <Store size={32} /> : <CheckCircle2 size={36} />}
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#14171f]">
                      {isCounterInquiryResult
                        ? 'Đã Ghi Nhận Yêu Cầu Đặt Tại Quầy!'
                        : 'Đã Xác Nhận Đơn Thuê Thành Công!'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#525868] mt-1.5 max-w-md mx-auto leading-relaxed">
                      {isCounterInquiryResult ? (
                        <>
                          Yêu cầu <strong>#{createdOrderCode}</strong> cho thiết bị <strong>{item.name}</strong> đang ở trạng thái <strong>CHỜ NHÂN VIÊN GỌI XÁC NHẬN</strong>. Máy <strong>chưa khóa Serial trên kho</strong> cho tới khi nhân viên liên hệ số <strong>{activeGuestPhone}</strong> và xác nhận giữ máy.
                        </>
                      ) : (
                        <>
                          Đơn hàng <strong>#{createdOrderCode}</strong> cho thiết bị <strong>{item.name}</strong> đã được chuyển sang trạng thái <strong>ĐÃ XÁC NHẬN (CONFIRMED)</strong>. Thiết bị được giữ cố định theo lịch của bạn.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="w-full max-w-md bg-[#f7f8fa] border border-[#14171f]/10 rounded-3xl p-4 text-xs space-y-2 text-left num">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Mã đơn thuê:</span>
                      <span className="font-sans tracking-wide font-bold text-[#14171f]">#{createdOrderCode}</span>
                    </div>
                    {activeGuestPhone && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">SĐT tra cứu đơn:</span>
                        <span className="font-sans font-bold text-[#14171f]">{activeGuestPhone}</span>
                      </div>
                    )}
                    {assignedSerials.length > 0 && (
                      <div className="flex justify-between items-center py-1.5 bg-emerald-50 px-3 rounded-full border border-emerald-200">
                        <span className="text-emerald-800 font-medium">Serial máy đối chứng:</span>
                        <span className="font-sans tracking-wide font-bold text-emerald-900">{assignedSerials.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Lịch nhận &amp; trả:</span>
                      <span className="font-semibold text-[#14171f]">
                        {formatDateDisplay(startDate)} — {formatDateDisplay(expectedReturnDate)} ({days} ngày)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">
                        {isCounterInquiryResult ? 'Tổng dự kiến (thanh toán tại quầy):' : 'Tổng thanh toán:'}
                      </span>
                      <span className="font-sans font-bold text-emerald-700 text-sm">
                        {totalDue.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {isCounterInquiryResult && createdOrderCode && (
                      <button
                        type="button"
                        onClick={handleCancelHold}
                        disabled={isCancelling}
                        className="px-4 py-2.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                        <span>{isCancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}</span>
                      </button>
                    )}
                    {onOpenGuestLookup && activeGuestPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenGuestLookup();
                        }}
                        className="px-5 py-2.5 rounded-full border border-[#14171f]/20 bg-white hover:bg-neutral-50 text-[#14171f] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Search size={14} />
                        <span>Tra cứu / Tự hủy đơn</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-full bg-[#14171f] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[#252a37] transition-all cursor-pointer"
                    >
                      Hoàn tất &amp; Đóng
                    </button>
                  </div>
                  {paymentError && (
                    <div className="w-full max-w-md p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
                      {paymentError}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Tóm tắt ngày và chi phí */}
                  <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2 text-xs num">
                    <div className="flex items-center justify-between text-[#14171f]">
                      <span className="flex items-center gap-1.5 text-neutral-500">
                        <CalendarIcon size={14} />
                        <span>Lịch thuê ({days} ngày):</span>
                      </span>
                      <span className="font-semibold">
                        {formatDateDisplay(startDate)} — {formatDateDisplay(expectedReturnDate)}
                      </span>
                    </div>
                    {assignedSerials.length > 0 && (
                      <div className="flex items-center justify-between py-1.5 px-3 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                        <span className="font-medium">Serial khóa giữ chỗ:</span>
                        <span className="font-sans tracking-wide font-bold">{assignedSerials.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 border-t border-neutral-200/60 pt-2 text-[#14171f]">
                      <span className="text-neutral-500">Tiền thuê ({days} ngày):</span>
                      <span className="font-sans font-semibold whitespace-nowrap shrink-0">{totalRent.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[#14171f]">
                      <span className="text-neutral-500">Tiền cọc thiết bị (hoàn 100% khi trả):</span>
                      <span className="font-sans font-semibold whitespace-nowrap shrink-0">{discountedDeposit.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-neutral-200/60 pt-2 font-bold text-sm text-[#14171f]">
                      <span>Tổng cần thanh toán:</span>
                      <span className="font-sans text-base font-bold text-emerald-700 whitespace-nowrap shrink-0">
                        {totalDue.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>

                  {/* 3 Phương thức thanh toán */}
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

                  {/* Chi tiết từng phương thức */}
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
                              <span className="font-sans tracking-wide font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">REFUJI {createdOrderCode}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(`REFUJI ${createdOrderCode}`, 'memo')}
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
                        * Quét mã QR trên app ngân hàng để tự động điền đúng số tiền và cú pháp chuyển khoản.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'VNPAY' && (
                    <div className="p-4 rounded-3xl border border-[#14171f]/10 bg-[#f9fafb] text-xs space-y-2">
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
                    <div className="p-4 rounded-3xl border border-[#14171f]/10 bg-[#f9fafb] text-xs space-y-2">
                      <div className="flex items-center gap-2 text-[#14171f] font-semibold">
                        <Store size={16} className="text-amber-600" />
                        <span>Thanh toán trực tiếp tại Cửa hàng ReFuji</span>
                      </div>
                      {activeGuestPhone ? (
                        <div className="flex items-start gap-2 text-[11.5px] text-amber-900 bg-amber-50 p-3 rounded-2xl border border-amber-200 leading-relaxed">
                          <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-700" />
                          <span>
                            <strong>Lưu ý Khách vãng lai:</strong> Đổi sang đặt tại quầy sẽ <strong>nhả khóa Serial 15 phút</strong> và đưa đơn vào hàng đợi nhân viên gọi xác nhận trước khi chốt máy.
                          </span>
                        </div>
                      ) : (
                        <p className="text-neutral-600 leading-relaxed">
                          Bạn có thể thanh toán bằng tiền mặt hoặc quẹt thẻ POS khi đến nhận máy tại quầy. Hệ thống vẫn giữ chỗ độc quyền thiết bị cho bạn theo lịch hẹn.
                        </p>
                      )}
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

            {/* Chức năng: Bổ sung nút Hủy giữ chỗ trên thanh thao tác bước thanh toán đặt máy */}
            {!isPaidSuccess && (
              <div className="px-6 sm:px-8 py-4 border-t border-[#14171f]/10 bg-white shrink-0 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelHold}
                  disabled={isCancelling || isPaying}
                  className="px-3.5 py-2.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCancelling ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                  <span>{isCancelling ? 'Đang hủy...' : 'Hủy giữ chỗ'}</span>
                </button>

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
                  onClick={handlePayOrder}
                  disabled={isPaying || isCancelling || timeLeft <= 0}
                  className="flex-1 min-w-[200px] py-3 px-4 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
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
                          : activeGuestPhone
                          ? 'Chuyển sang yêu cầu tại quầy'
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
        </div>

      </motion.div>
    </motion.div>
  );
};
