import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModel, LensModel, AccessoryModel, EquipmentItem } from '../types';
import { 
  X, 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  Check, 
  Clock, 
  Star, 
  Share2, 
  Heart, 
  CheckCircle2, 
  Zap,
  ShoppingBag,
  Sparkles,
  Plus,
  QrCode,
  CreditCard,
  Store,
  Copy,
  Loader2,
  CalendarDays
} from 'lucide-react';
import { getRecommendedItemsForCamera } from '../data/travelCombos';
import { useAuth } from '../context/AuthContext';
import { createRentalOrder, payRentalOrder } from '../services/authApi';

interface BookingModalProps {
  item: CameraModel | LensModel | AccessoryModel | null;
  onClose: () => void;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  allLenses?: LensModel[];
  allAccessories?: AccessoryModel[];
  onAddToCart?: (item: EquipmentItem) => void;
  onOpenCart?: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
  onOpenCalendar?: () => void;
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

export const BookingModal: React.FC<BookingModalProps> = ({ 
  item, 
  onClose,
  membershipTier = 'BRONZE',
  allLenses = [],
  allAccessories = [],
  onAddToCart,
  onOpenCart,
  initialStartDate,
  initialEndDate,
  onOpenCalendar,
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

  const [isBooked, setIsBooked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  // Trạng thái giữ chỗ và thanh toán
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [assignedSerials, setAssignedSerials] = useState<string[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'VNPAY' | 'COUNTER'>('VIETQR');
  const [isPaying, setIsPaying] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Đồng hồ đếm ngược 15 phút (900 giây) thực tế
  const [timeLeft, setTimeLeft] = useState(900);

  const { isAuthenticated, openAuthModal, user, setToast } = useAuth();

  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialEndDate) setExpectedReturnDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

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

  const effectiveTier = user?.membership_tier || membershipTier;
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

  const isOutOfStock = (item?.availableCount ?? 1) <= 0 || item?.status === 'BOOKED';
  const availableStock = item?.availableCount !== undefined ? item.availableCount : 1;

  const handleConfirm = async () => {
    if (isOutOfStock) {
      setPaymentError(`Thiết bị "${item.name}" hiện đã hết hàng trong kho hoặc đang có người giữ chỗ.`);
      return;
    }

    if (!isAuthenticated) {
      openAuthModal('login', {
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
      });
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

      // Lưu đơn giữ chỗ 15 phút vào localStorage để nút góc dưới bên phải luôn hiển thị
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

      // Xóa thiết bị khỏi giỏ hàng nếu đang có trong giỏ & làm mới số lượng kho
      try {
        const rawCart = localStorage.getItem('refuji_cart');
        if (rawCart) {
          const cartList = JSON.parse(rawCart);
          const filtered = cartList.filter((ci: any) => ci.item?.id !== item.id);
          localStorage.setItem('refuji_cart', JSON.stringify(filtered));
        }
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

  // Xử lý thanh toán cọc
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
      if (setToast) {
        setToast({
          id: Date.now().toString(),
          message: `Thanh toán thành công đơn hàng #${createdOrderCode}! Thiết bị đã sẵn sàng.`,
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

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddRecommend = (recItem: EquipmentItem) => {
    if (onAddToCart) {
      onAddToCart(recItem);
      setAddedItems((prev) => new Set(prev).add(recItem.id));
    }
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

  const recommendedData = isCamera 
    ? getRecommendedItemsForCamera(item.name, allLenses, allAccessories)
    : { lenses: [], accessories: [] };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-4xl bg-white border border-[#14171f]/10 rounded-3xl shadow-[0_24px_70px_rgba(20,24,32,0.18)] overflow-hidden flex flex-col h-[670px] max-h-[92vh] select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng tròn phong cách Apple */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-[#14171f]/10 text-[#6e7587] hover:text-[#14171f] flex items-center justify-center transition-all cursor-pointer active:scale-90"
          aria-label="Đóng cửa sổ"
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
        {!isBooked ? (
          <motion.div 
            key="booking-content-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            {/* 1. KHU VỰC HERO BANNER */}
            <div className="relative pt-6 px-6 sm:px-8 pb-4 border-b border-[#14171f]/10 bg-gradient-to-b from-neutral-50/70 to-white">
              <div className="w-full h-44 sm:h-52 flex items-center justify-center mb-4">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="max-h-full max-w-[85%] object-contain product-stage-img transition-transform duration-700 hover:scale-105"
                />
              </div>

              <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.06] text-[10.5px] font-mono font-semibold tracking-wider text-[#3c4252] uppercase border border-[#14171f]/10">
                      REFUJI STUDIO
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.06] text-[#3c4252] text-[10.5px] font-mono font-bold tracking-wider uppercase border border-[#14171f]/10">
                      FUJIFILM JAPAN
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#14171f] tracking-tight">
                    {item.name}
                  </h3>

                  {/* Hiển thị giới hạn tồn kho thực tế */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-rose-500' : availableStock === 1 ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                    <span className={`text-xs font-semibold ${isOutOfStock ? 'text-rose-600' : availableStock === 1 ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {isOutOfStock ? 'Tạm hết hàng trong kho' : availableStock === 1 ? 'Kho chỉ còn duy nhất 1 máy' : `Kho sẵn sàng: ${availableStock} máy (Kiểm định Serial)`}
                    </span>
                  </div>
                </div>

                {/* Hàng nút tương tác: Đặt giữ chỗ + Yêu thích + Chia sẻ */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleConfirm}
                    disabled={isCreatingOrder || isOutOfStock}
                    className={`px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                        : 'bg-[#14171f] hover:bg-[#252a37] text-white shadow-[0_4px_16px_rgba(20,24,32,0.18)] active:scale-95 disabled:opacity-50'
                    }`}
                  >
                    {isCreatingOrder ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>Đang tạo giữ chỗ...</span>
                      </>
                    ) : isOutOfStock ? (
                      <span>Tạm hết hàng trong kho</span>
                    ) : (
                      <>
                        <Zap size={16} className="fill-white" />
                        <span>Thuê ngay (Giữ chỗ 15p)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
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
                    className="w-10 h-10 rounded-full border border-[#14171f]/15 bg-white hover:bg-neutral-50 text-[#14171f] flex items-center justify-center transition-all cursor-pointer relative shadow-sm"
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

            {/* 2. DÒNG THÔNG SỐ NHANH */}
            <div className="px-5 sm:px-8 pt-4 pb-3 flex flex-wrap items-center gap-2.5 border-b border-[#14171f]/10 text-xs text-[#525868]">
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
              <div className="flex items-center gap-1.5 ml-auto text-[#2d3342] text-[11.5px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sẵn sàng bàn giao tại cửa hàng</span>
              </div>
            </div>

            {/* 3. BỐ CỤC 2 CỘT CHÍNH */}
            <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* CỘT TRÁI (7 COLS): MÔ TẢ & CHỌN/SỬA NGÀY & DỰ TOÁN TÀI CHÍNH */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-6">
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-[#6e7587] mb-2">
                    Mô tả &amp; Trải nghiệm
                  </h4>
                  <p className="text-sm text-[#464c5c] leading-relaxed font-light mb-6">
                    {item.description || 'Thiết bị Fujifilm nguyên bản được kiểm định nghiêm ngặt theo quy chuẩn 12 bước trước khi bàn giao. Đảm bảo cảm biến sạch tuyệt đối, hoạt động mượt mà và đi kèm trọn bộ phụ kiện cao cấp.'}
                  </p>

                  {/* KHU VỰC CHỌN & SỬA NGÀY THUÊ */}
                  <div className="mb-6 p-4 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#14171f] uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarIcon size={14} className="text-[#14171f]" />
                        <span>Thời Gian &amp; Lịch Thuê Máy</span>
                      </span>
                      {onOpenCalendar && (
                        <button
                          type="button"
                          onClick={onOpenCalendar}
                          className="inline-flex items-center gap-1 text-xs font-semibold underline text-[#14171f] hover:opacity-75 transition-opacity cursor-pointer"
                        >
                          <CalendarDays size={13} />
                          <span>Mở xem trên lịch</span>
                        </button>
                      )}
                    </div>

                    {/* Hai ô chọn / sửa ngày nhận và trả */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#6e7587]">
                          Ngày nhận máy (Start Date)
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          min={getTodayStr()}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 bg-white text-[#14171f] outline-none focus:border-[#14171f]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[#6e7587]">
                          Ngày trả máy (Return Date)
                        </label>
                        <input
                          type="date"
                          value={expectedReturnDate}
                          min={startDate}
                          onChange={(e) => handleEndDateChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-neutral-300 bg-white text-[#14171f] outline-none focus:border-[#14171f]"
                        />
                      </div>
                    </div>

                    {/* Chọn nhanh số ngày */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11.5px] text-[#525868] mb-2">
                        <span>Chọn nhanh số ngày thuê:</span>
                        <span className="font-bold text-[#14171f]">{days} ngày</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 3, 5, 7, 14].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleQuickDays(d)}
                            className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              days === d
                                ? 'bg-[#14171f] text-white shadow-sm font-bold scale-[1.02]'
                                : 'bg-white border border-[#14171f]/10 text-[#444a59] hover:bg-neutral-100 active:scale-95'
                            }`}
                          >
                            {d} ngày
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bảng kê khai chi phí minh bạch */}
                  <div className="bg-[#f7f8fa] rounded-2xl p-4 sm:p-5 border border-[#14171f]/10 space-y-2.5 text-xs mb-6">
                    <div className="flex justify-between text-[#525868]">
                      <span>Tiền thuê ({days} ngày × {item.dailyRate.toLocaleString('vi-VN')}₫):</span>
                      <span className="text-[#14171f] font-medium">{totalRent.toLocaleString('vi-VN')} ₫</span>
                    </div>

                    <div className="flex justify-between text-[#525868]">
                      <span>Tiền đặt cọc (hoàn lại 100% khi Check-in):</span>
                      <span>
                        {discountRate > 0 ? (
                          <>
                            <span className="line-through text-[#8e95a6] mr-1.5">{item.depositRate.toLocaleString('vi-VN')} ₫</span>
                            <span className="text-[#14171f] font-bold">{discountedDeposit.toLocaleString('vi-VN')} ₫ (-{discountRate * 100}%)</span>
                          </>
                        ) : (
                          <span className="text-[#14171f] font-medium">{item.depositRate.toLocaleString('vi-VN')} ₫</span>
                        )}
                      </span>
                    </div>

                    <div className="w-full h-[1px] bg-[#14171f]/10 my-2" />

                    <div className="flex justify-between font-semibold text-sm sm:text-base text-[#14171f]">
                      <span>Tổng thanh toán tạm tính:</span>
                      <span className="text-[#14171f] font-bold">{totalDue.toLocaleString('vi-VN')} ₫</span>
                    </div>

                    <p className="text-[11px] text-[#747b8c] pt-1 leading-normal italic">
                      * Cọc sẽ được hoàn trả trực tiếp vào tài khoản ngân hàng của bạn ngay khi hoàn tất kiểm tra thiết bị lúc trả máy.
                    </p>
                  </div>
                </div>

                {/* Cam kết pháp lý & Khóa chỗ */}
                <div className="flex items-start gap-2.5 text-[11px] text-[#484e5e] bg-[#14171f]/[0.03] p-3.5 rounded-xl border border-[#14171f]/10">
                  <ShieldCheck size={16} className="text-[#14171f] shrink-0 mt-0.5" />
                  <span>
                    <strong>Tuân thủ Luật Căn cước 2023:</strong> Cửa hàng chỉ đối chiếu thẻ CCCD/VNeID trực tiếp, <strong>cam kết KHÔNG giữ giấy tờ gốc</strong> của khách hàng.
                  </span>
                </div>
              </div>

              {/* CỘT PHẢI (5 COLS): THÔNG SỐ KỸ THUẬT */}
              <div className="md:col-span-5 bg-[#f7f8fa] border border-[#14171f]/10 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-[#6e7587] mb-3.5">
                    Thông số kỹ thuật
                  </h4>

                  <div className="space-y-3 text-xs">
                    {isCamera && (
                      <>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Cảm biến:</span>
                          <span className="text-[#14171f] font-medium">{cameraItem?.sensor}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Độ phân giải:</span>
                          <span className="text-[#14171f] font-medium">{cameraItem?.resolution}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Dòng máy:</span>
                          <span className="text-[#14171f] font-medium">{cameraItem?.series} Series</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Hệ ngàm:</span>
                          <span className="text-[#14171f] font-medium">Fujifilm X Mount</span>
                        </div>
                      </>
                    )}

                    {isLens && (
                      <>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Tiêu cự:</span>
                          <span className="text-[#14171f] font-medium">{lensItem?.focalLength}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Khẩu độ lớn nhất:</span>
                          <span className="text-[#14171f] font-medium">{lensItem?.aperture}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Ngàm tương thích:</span>
                          <span className="text-[#14171f] font-medium">{lensItem?.mount} Mount</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Trọng lượng:</span>
                          <span className="text-[#14171f] font-medium">{lensItem?.weight || '187g (Siêu nhẹ)'}</span>
                        </div>
                      </>
                    )}

                    {!isCamera && !isLens && (
                      <>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Phân loại:</span>
                          <span className="text-[#14171f] font-medium">Phụ kiện chính hãng</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Thương hiệu:</span>
                          <span className="text-[#14171f] font-medium">{item.brand || 'Fujifilm'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => !isOutOfStock && onAddToCart && onAddToCart(item)}
                    className={`w-full py-2.5 rounded-full border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      isOutOfStock
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                        : 'border-[#14171f]/20 bg-white hover:bg-[#14171f]/5 text-[#14171f] active:scale-95 cursor-pointer'
                    }`}
                  >
                    <ShoppingBag size={14} />
                    <span>{isOutOfStock ? 'Thiết bị tạm hết trong kho' : 'Thêm vào giỏ thuê'}</span>
                  </button>
                </div>
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
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* Header thanh toán */}
            <div className="px-6 sm:px-8 py-4 border-b border-[#14171f]/10 bg-white shrink-0 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#14171f]">
                    {isPaidSuccess ? 'Xác Nhận Đơn Hàng Thành Công' : 'Thanh Toán &amp; Giữ Chỗ Thiết Bị'}
                  </h3>
                  {createdOrderCode && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
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
                  <span className="font-mono font-bold text-sm bg-amber-200/80 px-2.5 py-0.5 rounded text-amber-950 shadow-inner">
                    {timerDisplay}
                  </span>
                </div>
              </div>
            )}

            {/* Nội dung thanh toán cuộn */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-4">
              {isPaidSuccess ? (
                /* THÀNH CÔNG HOÀN TẤT */
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#14171f]">
                      Đã Xác Nhận Đơn Thuê Thành Công!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#525868] mt-1.5 max-w-md mx-auto leading-relaxed">
                      Đơn hàng <strong>#{createdOrderCode}</strong> cho thiết bị <strong>{item.name}</strong> đã được chuyển sang trạng thái <strong>ĐÃ XÁC NHẬN (CONFIRMED)</strong>. Thiết bị được giữ cố định theo lịch của bạn.
                    </p>
                  </div>

                  <div className="w-full max-w-md bg-[#f7f8fa] border border-[#14171f]/10 rounded-2xl p-4 text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Mã đơn thuê:</span>
                      <span className="font-mono font-bold text-[#14171f]">#{createdOrderCode}</span>
                    </div>
                    {assignedSerials.length > 0 && (
                      <div className="flex justify-between items-center py-1 bg-emerald-50 px-2 rounded border border-emerald-200">
                        <span className="text-emerald-800 font-medium">Serial máy đối chứng:</span>
                        <span className="font-mono font-bold text-emerald-900">{assignedSerials.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Lịch nhận &amp; trả:</span>
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
                  {/* Tóm tắt ngày và chi phí */}
                  <div className="p-4 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2 text-xs">
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
                      <div className="flex items-center justify-between py-1 px-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                        <span className="font-medium">Serial khóa giữ chỗ:</span>
                        <span className="font-mono font-bold">{assignedSerials.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-neutral-200/60 pt-2 text-[#14171f]">
                      <span className="text-neutral-500">Tiền thuê ({days} ngày):</span>
                      <span className="font-mono font-medium">{totalRent.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex items-center justify-between text-[#14171f]">
                      <span className="text-neutral-500">Tiền cọc thiết bị (hoàn 100% khi trả):</span>
                      <span className="font-mono font-medium">{discountedDeposit.toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-200/60 pt-2 font-bold text-sm text-[#14171f]">
                      <span>Tổng cần thanh toán:</span>
                      <span className="font-mono text-base text-emerald-700">
                        {totalDue.toLocaleString('vi-VN')} ₫
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

                  {/* Chi tiết từng phương thức */}
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
                              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">REFUJI {createdOrderCode}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(`REFUJI ${createdOrderCode}`, 'memo')}
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
                        * Quét mã QR trên app ngân hàng để tự động điền đúng số tiền và cú pháp chuyển khoản.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'VNPAY' && (
                    <div className="p-4 rounded-2xl border border-[#14171f]/10 bg-[#f9fafb] text-xs space-y-2">
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
                    <div className="p-4 rounded-2xl border border-[#14171f]/10 bg-[#f9fafb] text-xs space-y-2">
                      <div className="flex items-center gap-2 text-[#14171f] font-semibold">
                        <Store size={16} className="text-amber-600" />
                        <span>Thanh toán trực tiếp tại Cửa hàng ReFuji</span>
                      </div>
                      <p className="text-neutral-600 leading-relaxed">
                        Bạn có thể thanh toán bằng tiền mặt hoặc quẹt thẻ POS khi đến nhận máy tại quầy. Hệ thống vẫn giữ chỗ độc quyền thiết bị cho bạn theo lịch hẹn.
                      </p>
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

            {/* Chân Modal thanh toán */}
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
