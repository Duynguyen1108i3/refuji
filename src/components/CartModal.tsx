import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  Minus, 
  Sparkles, 
  CheckCircle2,
  Clock,
  Camera,
  Aperture
} from 'lucide-react';
import { CartItem, EquipmentItem, LensModel, AccessoryModel, CameraModel } from '../types';
import { MembershipTierType } from './AccountModal';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOpenCalendar: () => void;
  rentalDatesText: string;
  membershipTier: MembershipTierType;
  onCheckoutSuccess?: () => void;
  allLenses?: LensModel[];
  allAccessories?: AccessoryModel[];
  onAddToCart?: (item: EquipmentItem) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCalendar,
  rentalDatesText,
  membershipTier,
  onCheckoutSuccess,
  allLenses = [],
  allAccessories = [],
  onAddToCart,
}) => {
  const [isSuccessBooked, setIsSuccessBooked] = useState(false);

  if (!isOpen) return null;

  // Tính số ngày thuê từ text "29/10 — 31/10 (3 ngày)"
  const daysMatch = rentalDatesText.match(/(\d+)\s*ngày/);
  const rentalDays = daysMatch ? parseInt(daysMatch[1], 10) : 3;

  // Tỉ lệ giảm cọc theo hạng hội viên
  const tierDiscountMap: Record<MembershipTierType, { label: string; rate: number }> = {
    BRONZE: { label: 'Hạng Đồng', rate: 0 },
    SILVER: { label: 'Hạng Bạc', rate: 0.05 },
    GOLD: { label: 'Hạng Vàng', rate: 0.10 },
    PLATINUM: { label: 'Bạch Kim', rate: 0.15 },
  };
  const tierInfo = tierDiscountMap[membershipTier] || tierDiscountMap.GOLD;

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

  // Gợi ý lens hoặc phụ kiện nếu trong giỏ đã có máy ảnh nhưng chưa có lens
  const hasCamera = cartItems.some((i) => i.item.type === 'BODY' || (i.item as CameraModel).series);
  const hasLens = cartItems.some((i) => i.item.type === 'LENS' || (i.item as LensModel).focalLength);

  const suggestedLenses = allLenses.filter(
    (l) => ['XF16-50', 'XF23', 'XF35', 'XF27'].some((k) => l.name.includes(k)) &&
      !cartItems.some((ci) => ci.id === l.id)
  ).slice(0, 2);

  const handleHoldBooking = () => {
    setIsSuccessBooked(true);
    setTimeout(() => {
      setIsSuccessBooked(false);
      if (onCheckoutSuccess) onCheckoutSuccess();
      onClose();
    }, 2800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_64px_rgba(20,24,32,0.18)] border border-[#14171f]/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
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

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-[#828898] hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                title="Xóa toàn bộ giỏ hàng"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Xóa tất cả</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#62687a] hover:text-[#14171f] bg-[#14171f]/[0.04] hover:bg-[#14171f]/[0.08] transition-colors cursor-pointer active:scale-95"
              aria-label="Đóng giỏ hàng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Thanh Thời Gian Thuê Được Áp Dụng */}
        <div className="bg-[#14171f]/[0.02] border-b border-[#14171f]/6 px-6 sm:px-8 py-3 flex items-center justify-between text-xs sm:text-[13px]">
          <div className="flex items-center gap-2 text-[#383e4e]">
            <Calendar size={14} className="text-[#14171f]" />
            <span className="font-light">Lịch thuê:</span>
            <strong className="font-semibold text-[#14171f]">{rentalDatesText}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCalendar();
            }}
            className="text-xs font-semibold text-[#14171f] hover:underline cursor-pointer flex items-center gap-1"
          >
            Đổi lịch
          </button>
        </div>

        {/* Danh Sách Thiết Bị Trong Giỏ */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#14171f]/[0.04] border border-[#14171f]/8 flex items-center justify-center text-[#828898] mb-4">
                <ShoppingBag size={28} className="stroke-[1.3]" />
              </div>
              <h4 className="text-base font-medium text-[#14171f] mb-1">
                Giỏ hàng của bạn đang trống
              </h4>
              <p className="text-xs sm:text-sm text-[#62687a] max-w-sm font-light mb-6">
                Chưa có thiết bị nào được thêm. Hãy chọn máy ảnh Fujifilm, ống kính Fujinon hoặc phụ kiện bạn cần cho chuyến đi!
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
            <>
              {cartItems.map((cartItem) => {
                const item = cartItem.item;
                const isBody = item.type === 'BODY' || (item as CameraModel).series;
                const isLens = item.type === 'LENS' || (item as LensModel).focalLength;
                const categoryLabel = isBody ? 'Máy ảnh' : isLens ? 'Ống kính' : 'Phụ kiện';

                const itemDepositDiscounted = Math.round(item.depositRate * (1 - tierInfo.rate));

                return (
                  <motion.div
                    key={cartItem.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl border border-[#14171f]/10 bg-white shadow-sm hover:border-[#14171f]/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#14171f]/[0.03] border border-[#14171f]/8 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain product-stage-img"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-[#14171f]/[0.06] text-[10px] font-semibold uppercase tracking-wider text-[#383e4e]">
                            {categoryLabel}
                          </span>
                          {item.highlightBadge && (
                            <span className="text-[10px] text-[#62687a] truncate max-w-[140px]">
                              • {item.highlightBadge}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm sm:text-base font-semibold text-[#14171f] line-clamp-1">
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
                      </div>
                    </div>

                    {/* Số lượng & Xóa */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#14171f]/5">
                      <div className="flex items-center gap-1.5 bg-[#14171f]/[0.04] border border-[#14171f]/10 rounded-full px-2 py-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[#525868] hover:text-[#14171f] hover:bg-white transition-colors cursor-pointer"
                          aria-label="Giảm số lượng"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-mono text-xs font-semibold px-2 text-[#14171f]">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[#525868] hover:text-[#14171f] hover:bg-white transition-colors cursor-pointer"
                          aria-label="Tăng số lượng"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <div className="text-xs text-[#62687a]">Tạm tính:</div>
                        <div className="text-sm font-semibold text-[#14171f] font-mono">
                          {(item.dailyRate * cartItem.quantity * rentalDays).toLocaleString('vi-VN')}đ
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(cartItem.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#828898] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer active:scale-95"
                        title="Xóa món này"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Gợi Ý Thêm Lens Combo Du Lịch Cho Thân Máy */}
              {hasCamera && !hasLens && suggestedLenses.length > 0 && onAddToCart && (
                <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 mt-4">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-amber-900">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Gợi Ý Ống Kính Fujinon Du Lịch Phù Hợp Đi Kèm</span>
                  </div>
                  <p className="text-[11.5px] text-[#62687a] mb-3 font-light">
                    Bạn đã có thân máy! Hãy thêm ống kính du lịch chính hãng để có bộ máy hoàn chỉnh sẵn sàng tác nghiệp.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {suggestedLenses.map((lens) => (
                      <div
                        key={lens.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#14171f]/8 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img src={lens.image} alt={lens.name} className="w-10 h-10 object-contain shrink-0" />
                          <div className="truncate">
                            <h5 className="text-xs font-semibold text-[#14171f] truncate">{lens.name}</h5>
                            <span className="text-[11px] text-[#62687a] font-mono">
                              +{lens.dailyRate.toLocaleString('vi-VN')}đ/ngày
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddToCart(lens)}
                          className="shrink-0 ml-2 px-3 py-1.5 rounded-full bg-[#14171f] text-white text-[11px] font-semibold hover:bg-[#2c3242] transition-colors cursor-pointer"
                        >
                          + Thêm
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Tổng Chi Phí & CTA Đặt Cọc */}
        {cartItems.length > 0 && (
          <div className="px-6 sm:px-8 py-5 border-t border-[#14171f]/8 bg-[#fbfcfd] space-y-4">
            <div className="space-y-1.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-[#62687a]">
                <span>Tạm tính tiền thuê ({rentalDays} ngày):</span>
                <span className="font-semibold text-[#14171f] font-mono">
                  {totalRentalPrice.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex items-center justify-between text-[#62687a]">
                <div className="flex items-center gap-1.5">
                  <span>Tiền cọc tiêu chuẩn:</span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                    {tierInfo.label} (-{tierInfo.rate * 100}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="line-through text-[#9aa0ae] text-xs mr-2 font-mono">
                    {totalStandardDeposit.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    {finalDeposit.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-[#828898] italic flex items-center gap-1 pt-0.5">
                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                <span>Tiền cọc sẽ được hoàn lại 100% ngay khi nhân viên kiểm tra máy tại quầy bàn giao.</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleHoldBooking}
                disabled={isSuccessBooked}
                className="w-full sm:flex-1 h-12 rounded-full bg-[#14171f] text-white font-semibold text-sm hover:bg-[#262c3a] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_24px_rgba(20,24,32,0.18)]"
              >
                {isSuccessBooked ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>Đã Khóa Giữ Chỗ Thành Công! (15:00)</span>
                  </>
                ) : (
                  <>
                    <Clock size={16} />
                    <span>Xác Nhận Giữ Chỗ 15 Phút Cả Giỏ Hàng</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
