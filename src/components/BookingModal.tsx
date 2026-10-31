import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraModel, LensModel, AccessoryModel, EquipmentItem } from '../types';
import { 
  X, 
  Calendar, 
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
  Plus
} from 'lucide-react';
import { getRecommendedItemsForCamera } from '../data/travelCombos';

interface BookingModalProps {
  item: CameraModel | LensModel | AccessoryModel | null;
  onClose: () => void;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  allLenses?: LensModel[];
  allAccessories?: AccessoryModel[];
  onAddToCart?: (item: EquipmentItem) => void;
  onOpenCart?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  item, 
  onClose,
  membershipTier = 'BRONZE',
  allLenses = [],
  allAccessories = [],
  onAddToCart,
  onOpenCart,
}) => {
  const [days, setDays] = useState(3);
  const [isBooked, setIsBooked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  if (!item) return null;

  const discountRate = membershipTier === 'PLATINUM' ? 0.15 : membershipTier === 'GOLD' ? 0.10 : membershipTier === 'SILVER' ? 0.05 : 0;
  const discountedDeposit = Math.round(item.depositRate * (1 - discountRate));
  const totalRent = item.dailyRate * days;
  const totalDue = totalRent + discountedDeposit;

  const handleConfirm = () => {
    setIsBooked(true);
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

  // Trích xuất thông số kỹ thuật theo từng phân loại
  const isCamera = 'sensor' in item;
  const isLens = 'focalLength' in item;
  const cameraItem = isCamera ? (item as CameraModel) : null;
  const lensItem = isLens ? (item as LensModel) : null;

  // Lấy gợi ý combo ống kính và phụ kiện chính hãng nếu xem máy ảnh
  const recommendedData = isCamera
    ? getRecommendedItemsForCamera(item.name, allLenses, allAccessories)
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-[#14171f]/40 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-[#14171f]/10 rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(20,24,32,0.18)] text-[#14171f] my-auto max-h-[92vh] flex flex-col"
      >
        
        {/* NÚT ĐÓNG (X) DẠNG TRÒN NỔI BẬT THEO STYLE RYTOXGROUP */}
        <button 
          onClick={onClose}
          aria-label="Đóng chi tiết"
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-[#14171f]/15 text-[#14171f] flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-md backdrop-blur-md"
        >
          <X size={18} />
        </button>

        {!isBooked ? (
          <div className="overflow-y-auto flex-1">
            {/* 1. HERO PRODUCT STAGE */}
            <div className="relative pt-6 pb-5 px-6 sm:px-8 bg-gradient-to-b from-[#f6f7fa] to-[#ffffff] border-b border-[#14171f]/[0.08] flex flex-col items-center">
              
              {/* Product Stage Image with generous height and clean white backing */}
              <div className="relative h-56 sm:h-64 w-full flex items-center justify-center mb-5">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="max-h-full max-w-[85%] object-contain product-stage-img transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Product Badges, Name, and Actions */}
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
                </div>

                {/* Hàng nút tương tác: Đặt giữ chỗ + Yêu thích + Chia sẻ */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-2.5 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_16px_rgba(20,24,32,0.18)] active:scale-95 transition-all cursor-pointer"
                  >
                    <Zap size={16} className="fill-white" />
                    <span>Thuê ngay (Giữ chỗ 15p)</span>
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

            {/* 2. DÒNG THÔNG SỐ NHANH & BADGES */}
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
                <span className="w-2 h-2 rounded-full bg-[#14171f]/80 radar-pulse-white" />
                <span>Sẵn sàng bàn giao tại cửa hàng</span>
              </div>
            </div>

            {/* 3. BỐ CỤC 2 CỘT CHÍNH */}
            <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* CỘT TRÁI (7 COLS): MÔ TẢ & CHỌN NGÀY & DỰ TOÁN TÀI CHÍNH */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-[#6e7587] mb-2">
                    Mô tả &amp; Trải nghiệm
                  </h4>
                  <p className="text-sm text-[#464c5c] leading-relaxed font-light mb-6">
                    {item.description || 'Thiết bị Fujifilm nguyên bản được kiểm định nghiêm ngặt theo quy chuẩn 12 bước trước khi bàn giao. Đảm bảo cảm biến sạch tuyệt đối, hoạt động mượt mà và đi kèm trọn bộ phụ kiện cao cấp.'}
                  </p>

                  {/* Chọn thời gian thuê máy */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs text-[#525868] font-medium mb-2.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#3c4252]" />
                        <span>Thời lượng thuê:</span>
                      </span>
                      <span className="text-[#14171f] font-semibold">{days} ngày</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {[1, 3, 5, 7, 14].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDays(d)}
                          className={`py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            days === d
                              ? 'bg-[#14171f] text-white shadow-md font-bold scale-[1.02]'
                              : 'bg-[#14171f]/[0.04] border border-[#14171f]/10 text-[#444a59] hover:bg-[#14171f]/[0.08] active:scale-95'
                          }`}
                        >
                          {d} ngày
                        </button>
                      ))}
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

              {/* CỘT PHẢI (5 COLS): THÔNG SỐ KỸ THUẬT & PHỤ KIỆN ĐI KÈM */}
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
                        <div className="flex justify-between pb-2 border-b border-[#14171f]/[0.06]">
                          <span className="text-[#6e7587]">Tiêu chuẩn:</span>
                          <span className="text-[#14171f] font-medium">Chính hãng Fujifilm 100%</span>
                        </div>
                      </>
                    )}

                    {/* Quy tắc v1.1: Khách đặt thuê online là đặt trên ProductModels (assigned_item_id = NULL) */}
                    <div className="pb-2 border-b border-[#14171f]/[0.06] space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#6e7587]">Quy chế gán Serial máy:</span>
                        <span className="text-[#14171f] font-mono text-[11px] font-semibold bg-[#14171f]/[0.05] px-2 py-0.5 rounded-full">
                          Chỉ định tại quầy (Check-out)
                        </span>
                      </div>
                      <div className="text-[11px] text-[#444a59] bg-[#14171f]/[0.025] p-2.5 rounded-xl border border-[#14171f]/[0.06] leading-relaxed">
                        Kho hiện có <strong>{(item.items?.filter(i => i.status === 'AVAILABLE').length || item.availableCount || 1)} máy khả dụng</strong> (Độ mới 95%–99% • Số shot từ {Math.min(...(item.items?.map(i => i.shutter_count || 2150) || [2150])).toLocaleString('vi-VN')} shots) — <em>Số Serial cụ thể sẽ được nhân viên bàn giao và đối chiếu trực tiếp khi Check-out tại quầy</em>.
                      </div>
                    </div>
                  </div>

                  {/* Trọn bộ phụ kiện đi kèm theo máy */}
                  <h4 className="text-xs uppercase font-bold tracking-wider text-[#6e7587] mt-6 mb-3">
                    Bộ phụ kiện đi kèm trọn gói
                  </h4>
                  <ul className="space-y-2 text-xs text-[#444a59]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[#14171f] shrink-0" />
                      <span>02 Pin chính hãng (NP-W235/NP-W126S)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[#14171f] shrink-0" />
                      <span>01 Sạc đôi nhanh cổng USB Type-C</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[#14171f] shrink-0" />
                      <span>01 Thẻ nhớ SD SanDisk Extreme 128GB</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-[#14171f] shrink-0" />
                      <span>Dây đeo Peak Design &amp; Túi chống sốc</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[#14171f]/10 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddToCart) onAddToCart(item);
                    }}
                    className="flex-1 py-3 bg-white border border-[#14171f]/20 hover:border-[#14171f]/40 text-[#14171f] font-semibold text-xs sm:text-sm rounded-full transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag size={15} />
                    <span>Thêm vào giỏ</span>
                  </button>

                  <button
                    onClick={handleConfirm}
                    className="flex-[1.5] py-3 bg-[#14171f] text-white hover:bg-[#252a37] font-bold text-xs sm:text-sm rounded-full transition-all shadow-[0_4px_16px_rgba(20,24,32,0.18)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  >
                    Giữ chỗ 15 phút
                  </button>
                </div>
              </div>

            </div>

            {/* GỢI Ý COMBO LENS & PHỤ KIỆN DU LỊCH CHÍNH HÃNG FUJIFILM */}
            {isCamera && recommendedData && (
              <div className="px-6 sm:px-8 pb-8 pt-6 border-t border-[#14171f]/10 bg-gradient-to-b from-white to-[#fbfcfd]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/[0.08] text-amber-900 border border-amber-500/20 text-[11px] font-semibold mb-1.5">
                      <Sparkles size={12} className="text-amber-600" />
                      <span>{recommendedData.comboGuide.subtitle}</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-serif font-normal text-[#14171f]">
                      Gợi Ý Ống Kính &amp; Phụ Kiện Chuẩn Cẩm Nang Du Lịch
                    </h4>
                    <p className="text-xs text-[#525868] font-light max-w-2xl mt-0.5">
                      {recommendedData.comboGuide.travelNote}
                    </p>
                  </div>
                </div>

                {/* Danh sách ống kính khuyên dùng */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
                  {recommendedData.lenses.map((recLens) => {
                    const isAdded = addedItems.has(recLens.id);
                    return (
                      <div
                        key={recLens.id}
                        className="p-3.5 rounded-2xl bg-[#f9fafb] border border-[#14171f]/8 hover:border-[#14171f]/20 transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="w-14 h-14 rounded-xl bg-white border border-[#14171f]/6 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                            <img src={recLens.image} alt={recLens.name} className="max-h-full max-w-full object-contain product-stage-img group-hover:scale-105 transition-transform" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-[#62687a] block truncate uppercase">
                              {recLens.focalLength} • {recLens.aperture}
                            </span>
                            <h5 className="text-xs font-semibold text-[#14171f] line-clamp-2">
                              {recLens.name}
                            </h5>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#14171f]/5">
                          <div className="text-xs font-mono font-semibold text-[#14171f]">
                            +{recLens.dailyRate.toLocaleString('vi-VN')}đ<span className="text-[10px] font-normal text-[#62687a]">/ngày</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddRecommend(recLens)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#14171f] text-white hover:bg-[#2c3242] active:scale-95'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check size={12} />
                                <span>Đã thêm</span>
                              </>
                            ) : (
                              <>
                                <Plus size={12} />
                                <span>+ Combo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Danh sách phụ kiện khuyên dùng */}
                {recommendedData.accessories.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendedData.accessories.map((recAcc) => {
                      const isAdded = addedItems.has(recAcc.id);
                      return (
                        <div
                          key={recAcc.id}
                          className="p-3 rounded-xl bg-[#f9fafb] border border-[#14171f]/8 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={recAcc.image} alt={recAcc.name} className="w-10 h-10 object-contain shrink-0" />
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-[#14171f] truncate">{recAcc.name}</h5>
                              <span className="text-[11px] font-mono text-[#62687a]">
                                +{recAcc.dailyRate.toLocaleString('vi-VN')}đ/ngày
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddRecommend(recAcc)}
                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#14171f]/[0.06] hover:bg-[#14171f] text-[#14171f] hover:text-white'
                            }`}
                          >
                            {isAdded ? '✓ Đã thêm' : '+ Thêm phụ kiện'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TRẠNG THÁI GIỮ MÁY THÀNH CÔNG (SUCCESS HOLD STATE) */
          <div className="p-8 sm:p-12 text-center my-auto">
            <div className="w-16 h-16 rounded-full bg-[#14171f]/[0.06] text-[#14171f] flex items-center justify-center mx-auto mb-5 border border-[#14171f]/15 shadow-sm">
              <Check size={32} />
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl font-medium mb-3 text-[#14171f]">
              Đã Giữ Máy Thành Công!
            </h3>
            <p className="text-xs sm:text-sm text-[#525868] leading-relaxed mb-6 max-w-md mx-auto">
              Thiết bị <strong>{item.name}</strong> đã được hệ thống REFUJI khóa giữ chỗ độc quyền cho bạn trong vòng 15 phút.
            </p>
            
            <div className="crystal-liquid-glass inline-flex items-center gap-2 text-xs sm:text-sm text-[#14171f] px-5 py-2.5 rounded-full mb-8 border border-[#14171f]/15 shadow-sm">
              <Clock size={16} className="text-[#3c4252]" />
              <span>Thời hạn thanh toán cọc: <strong>14:59</strong> còn lại</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#14171f] text-white hover:bg-[#252a37] font-bold text-xs sm:text-sm rounded-full transition-all cursor-pointer shadow-md active:scale-95"
              >
                Hoàn tất &amp; Đóng
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
};
