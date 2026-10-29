import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraModel, LensModel, AccessoryModel } from '../types';
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
  Zap 
} from 'lucide-react';

interface BookingModalProps {
  item: CameraModel | LensModel | AccessoryModel | null;
  onClose: () => void;
  membershipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  item, 
  onClose,
  membershipTier = 'BRONZE',
}) => {
  const [days, setDays] = useState(3);
  const [isBooked, setIsBooked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  // Trích xuất thông số kỹ thuật theo từng phân loại
  const isCamera = 'sensor' in item;
  const isLens = 'focalLength' in item;
  const cameraItem = isCamera ? (item as CameraModel) : null;
  const lensItem = isLens ? (item as LensModel) : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#0c0f17] border border-white/20 rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.95)] text-white my-auto max-h-[92vh] flex flex-col"
      >
        
        {/* NÚT ĐÓNG (X) DẠNG TRÒN NỔI BẬT THEO STYLE RYTOXGROUP */}
        <button 
          onClick={onClose}
          aria-label="Đóng chi tiết"
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-lg"
        >
          <X size={18} />
        </button>

        {!isBooked ? (
          <div className="overflow-y-auto flex-1">
            {/* 1. HERO POSTER BANNER (CHUẨN CINEMATIC RYTOXGROUP) */}
            <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden bg-gradient-to-b from-[#141824] to-[#0c0f17] flex items-center justify-center">
              
              {/* Product Background Image */}
              <img 
                src={item.image} 
                alt={item.name}
                className="max-h-[82%] max-w-[80%] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] z-10 transition-transform duration-700 hover:scale-105"
              />

              {/* Gradient che mờ từ dưới lên để ăn khớp liền mạch với thân modal */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f17] via-[#0c0f17]/50 to-transparent z-15 pointer-events-none" />

              {/* Overlay thông tin sản phẩm và nút bấm chính ở chân Banner */}
              <div className="absolute bottom-4 left-5 sm:left-8 right-5 sm:right-8 z-20 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-white/10 backdrop-blur-md text-[10px] font-mono font-semibold tracking-wider text-white/90 uppercase border border-white/10">
                    REFUJI STUDIO
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-amber-400/30">
                    FUJIFILM JAPAN
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium text-white tracking-tight drop-shadow-md">
                  {item.name}
                </h3>

                {/* Hàng nút tương tác: Đặt giữ chỗ + Yêu thích + Chia sẻ (Chuẩn RytoxGroup) */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-2.5 rounded-full bg-white hover:bg-neutral-100 text-[#090A0F] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer"
                  >
                    <Zap size={16} className="fill-[#090A0F]" />
                    <span>Thuê ngay (Giữ chỗ 15p)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`w-10 h-10 rounded-full border border-white/20 flex items-center justify-center transition-all cursor-pointer ${
                      isFavorited 
                        ? 'bg-rose-500 text-white border-rose-500' 
                        : 'bg-black/40 hover:bg-white/15 text-white'
                    }`}
                    aria-label="Thêm vào danh sách mong muốn"
                  >
                    <Heart size={17} className={isFavorited ? 'fill-current' : ''} />
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full border border-white/20 bg-black/40 hover:bg-white/15 text-white flex items-center justify-center transition-all cursor-pointer relative"
                    aria-label="Chia sẻ thiết bị"
                  >
                    <Share2 size={17} />
                    {copiedLink && (
                      <span className="absolute -top-8 px-2 py-1 rounded bg-black/90 text-[10px] text-amber-300 whitespace-nowrap border border-white/20">
                        Đã copy link!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. DÒNG THÔNG SỐ NHANH & BADGES (CHUẨN RYTOXGROUP METADATA ROW) */}
            <div className="px-5 sm:px-8 pt-4 pb-3 flex flex-wrap items-center gap-2.5 border-b border-white/10 text-xs text-white/80">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>4.9</span>
                <span className="text-white/40 font-normal">(128 đánh giá)</span>
              </div>

              <span className="text-white/30">•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-[11px] font-medium text-white/90">
                Thế hệ 2026
              </span>

              {isCamera && (
                <>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-[11px] font-medium text-white/90">
                    {cameraItem?.resolution}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-[11px] font-medium text-white/90">
                    IBIS 5 trục
                  </span>
                </>
              )}

              {isLens && (
                <>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-[11px] font-medium text-white/90">
                    {lensItem?.aperture}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-[11px] font-medium text-white/90">
                    Ngàm {lensItem?.mount}
                  </span>
                </>
              )}

              <div className="flex items-center gap-1.5 ml-auto text-amber-400 text-[11.5px] font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 radar-pulse-amber" />
                <span>Sẵn sàng bàn giao tại cửa hàng</span>
              </div>
            </div>

            {/* 3. BỐ CỤC 2 CỘT CHÍNH (THEO PHIÊN BẢN RYTOXGROUP) */}
            <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* CỘT TRÁI (7 COLS): MÔ TẢ & CHỌN NGÀY & DỰ TOÁN TÀI CHÍNH */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-white/50 mb-2">
                    Mô tả &amp; Trải nghiệm
                  </h4>
                  <p className="text-sm text-white/75 leading-relaxed font-light mb-6">
                    {item.description || 'Thiết bị Fujifilm nguyên bản được kiểm định nghiêm ngặt theo quy chuẩn 12 bước trước khi bàn giao. Đảm bảo cảm biến sạch tuyệt đối, hoạt động mượt mà và đi kèm trọn bộ phụ kiện cao cấp.'}
                  </p>

                  {/* Chọn thời gian thuê máy */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs text-white/80 font-medium mb-2.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-amber-400" />
                        <span>Thời lượng thuê:</span>
                      </span>
                      <span className="text-amber-400 font-semibold">{days} ngày</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {[1, 3, 5, 7, 14].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDays(d)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            days === d
                              ? 'bg-white text-[#0B0F17] shadow-md font-bold scale-[1.02]'
                              : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 active:scale-95'
                          }`}
                        >
                          {d} ngày
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bảng kê khai chi phí minh bạch */}
                  <div className="bg-[#10141f] rounded-2xl p-4 sm:p-5 border border-white/10 space-y-2.5 text-xs mb-6">
                    <div className="flex justify-between text-white/70">
                      <span>Tiền thuê ({days} ngày × {item.dailyRate.toLocaleString('vi-VN')}₫):</span>
                      <span className="text-white font-medium">{totalRent.toLocaleString('vi-VN')} ₫</span>
                    </div>

                    <div className="flex justify-between text-white/70">
                      <span>Tiền đặt cọc (hoàn lại 100% khi Check-in):</span>
                      <span>
                        {discountRate > 0 ? (
                          <>
                            <span className="line-through text-white/40 mr-1.5">{item.depositRate.toLocaleString('vi-VN')} ₫</span>
                            <span className="text-amber-400 font-bold">{discountedDeposit.toLocaleString('vi-VN')} ₫ (-{discountRate * 100}%)</span>
                          </>
                        ) : (
                          <span className="text-white font-medium">{item.depositRate.toLocaleString('vi-VN')} ₫</span>
                        )}
                      </span>
                    </div>

                    <div className="w-full h-[1px] bg-white/10 my-2" />

                    <div className="flex justify-between font-semibold text-sm sm:text-base text-white">
                      <span>Tổng thanh toán tạm tính:</span>
                      <span className="text-amber-400 font-bold">{totalDue.toLocaleString('vi-VN')} ₫</span>
                    </div>

                    <p className="text-[11px] text-white/50 pt-1 leading-normal italic">
                      * Cọc sẽ được hoàn trả trực tiếp vào tài khoản ngân hàng của bạn ngay khi hoàn tất kiểm tra thiết bị lúc trả máy.
                    </p>
                  </div>
                </div>

                {/* Cam kết pháp lý & Khóa chỗ */}
                <div className="flex items-start gap-2.5 text-[11px] text-white/70 bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                  <ShieldCheck size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tuân thủ Luật Căn cước 2023:</strong> Cửa hàng chỉ đối chiếu thẻ CCCD/VNeID trực tiếp, <strong>cam kết KHÔNG giữ giấy tờ gốc</strong> của khách hàng.
                  </span>
                </div>
              </div>

              {/* CỘT PHẢI (5 COLS): THÔNG SỐ KỸ THUẬT & PHỤ KIỆN ĐI KÈM */}
              <div className="md:col-span-5 bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-white/50 mb-3.5">
                    Thông số kỹ thuật
                  </h4>

                  <div className="space-y-3 text-xs">
                    {isCamera && (
                      <>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                          <span className="text-white/40">Cảm biến:</span>
                          <span className="text-white font-medium">{cameraItem?.sensor}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                          <span className="text-white/40">Độ phân giải:</span>
                          <span className="text-white font-medium">{cameraItem?.resolution}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                          <span className="text-white/40">Dòng máy:</span>
                          <span className="text-white font-medium">{cameraItem?.series} Series</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                          <span className="text-white/40">Hệ ngàm:</span>
                          <span className="text-white font-medium">Fujifilm X Mount</span>
                        </div>
                      </>
                    )}

                    {isLens && (
                      <>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                          <span className="text-white/40">Tiêu cự:</span>
                          <span className="text-white font-medium">{lensItem?.focalLength}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                          <span className="text-white/40">Khẩu độ lớn nhất:</span>
                          <span className="text-white font-medium">{lensItem?.aperture}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                          <span className="text-white/40">Ngàm tương thích:</span>
                          <span className="text-white font-medium">{lensItem?.mount} Mount</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                          <span className="text-white/40">Trọng lượng:</span>
                          <span className="text-white font-medium">{lensItem?.weight || '187g (Siêu nhẹ)'}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between pb-2 border-b border-white/5">
                      <span className="text-white/40">Tình trạng:</span>
                      <span className="text-amber-400 font-medium">99% Like New (Serial trùng khớp)</span>
                    </div>
                  </div>

                  {/* Trọn bộ phụ kiện đi kèm theo máy */}
                  <h4 className="text-xs uppercase font-bold tracking-wider text-white/50 mt-6 mb-3">
                    Bộ phụ kiện đi kèm trọn gói
                  </h4>
                  <ul className="space-y-2 text-xs text-white/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>02 Pin chính hãng (NP-W235/NP-W126S)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>01 Sạc đôi nhanh cổng USB Type-C</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>01 Thẻ nhớ SD SanDisk Extreme 128GB</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>Dây đeo Peak Design &amp; Túi chống sốc</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={handleConfirm}
                    className="w-full py-3 bg-white text-[#0B0F17] hover:bg-neutral-100 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xl hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  >
                    Xác nhận giữ chỗ (Hold 15 phút)
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* TRẠNG THÁI GIỮ MÁY THÀNH CÔNG (SUCCESS HOLD STATE) */
          <div className="p-8 sm:p-12 text-center my-auto">
            <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto mb-5 border border-white/20 shadow-xl">
              <Check size={32} />
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl font-medium mb-3">
              Đã Giữ Máy Thành Công!
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-6 max-w-md mx-auto">
              Thiết bị <strong>{item.name}</strong> đã được hệ thống REFUJI khóa giữ chỗ độc quyền trong vòng 15 phút chống Race Condition.
            </p>
            
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-amber-400 bg-amber-400/10 px-5 py-2.5 rounded-full mb-8 border border-amber-400/25">
              <Clock size={16} />
              <span>Thời hạn thanh toán cọc: <strong>14:59</strong> còn lại</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
              <button
                onClick={onClose}
                className="w-full py-3 bg-white text-[#090A0F] hover:bg-neutral-100 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
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
