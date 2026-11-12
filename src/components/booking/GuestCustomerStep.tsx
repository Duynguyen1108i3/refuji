// Tính năng: Bước 2 luồng Đặt nhanh Khách vãng lai - Nhập thông tin liên hệ (không cần OTP SMS/Email) & chọn giữ chỗ Online hoặc Tại quầy
import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  QrCode,
  Store,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { guestInfoSchema } from '../../schemas/guest.schema';
import {
  GuestBookingMode,
  GuestInfoPayload,
  getGuestProfileDraft,
  saveGuestProfileDraft,
} from '../../services/authApi';

export interface GuestCustomerSubmitPayload {
  guestInfo: GuestInfoPayload;
  bookingMode: GuestBookingMode;
  paymentMethod: 'VIETQR' | 'VNPAY' | 'COUNTER';
}

interface GuestCustomerStepProps {
  summaryTitle: string;
  rentalDateDisplay: string;
  days: number;
  totalRent: number;
  standardDeposit: number;
  isSubmitting: boolean;
  serverError: string | null;
  onBack: () => void;
  onSwitchToMemberLogin: () => void;
  onSubmit: (payload: GuestCustomerSubmitPayload) => void;
}

export const GuestCustomerStep: React.FC<GuestCustomerStepProps> = ({
  summaryTitle,
  rentalDateDisplay,
  days,
  totalRent,
  standardDeposit,
  isSubmitting,
  serverError,
  onBack,
  onSwitchToMemberLogin,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [bookingMode, setBookingMode] = useState<GuestBookingMode>('ONLINE_PAYMENT');
  const [onlineMethod, setOnlineMethod] = useState<'VIETQR' | 'VNPAY'>('VIETQR');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const draft = getGuestProfileDraft();
    if (draft) {
      if (draft.full_name) setFullName(draft.full_name);
      if (draft.phone) setPhone(draft.phone);
      if (draft.email) setEmail(draft.email);
      if (draft.note) setNote(draft.note);
    }
  }, []);

  const totalDue = totalRent + standardDeposit;
  // Chức năng: Loại bỏ hậu tố "(X ngày)" bị trùng khi nhận chuỗi rentalDatesText từ giỏ hàng & đồng bộ font/bo tròn
  const cleanDateDisplay = rentalDateDisplay.replace(/\s*\(\d+\s*ngày\)\s*$/i, '').trim();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const parsed = guestInfoSchema.safeParse({
      full_name: fullName,
      phone,
      email,
      note,
      privacy_consent: privacyConsent,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || 'form');
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    saveGuestProfileDraft(parsed.data);

    onSubmit({
      guestInfo: parsed.data,
      bookingMode,
      paymentMethod: bookingMode === 'COUNTER_INQUIRY' ? 'COUNTER' : onlineMethod,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header & Thanh tiến trình 3 bước Đặt nhanh Khách vãng lai */}
      <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-[#14171f]/10 bg-white shrink-0 pr-14">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-[10.5px] font-sans font-semibold uppercase tracking-wider text-neutral-500">
              Bước 2 / 3 • Đặt nhanh không cần đăng ký
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#14171f] mt-0.5">
              Thông Tin Khách Hàng &amp; Hình Thức Giữ Chỗ
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
            <Check size={13} className="shrink-0" />
            <span className="truncate">1. Chọn máy &amp; lịch</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14171f] text-white font-semibold">
            <span className="w-4 h-4 rounded-full bg-white text-[#14171f] flex items-center justify-center text-[10px] font-bold shrink-0">
              2
            </span>
            <span className="truncate">2. Thông tin khách</span>
          </div>
          {/* Chức năng: Giữ cố định nhãn Bước 3 "3. Thanh toán 15p" theo yêu cầu giao diện đồng nhất */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
            <span className="w-4 h-4 rounded-full bg-neutral-300 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              3
            </span>
            <span className="truncate">3. Thanh toán 15p</span>
          </div>
        </div>
      </div>

      {/* Vùng nội dung cuộn */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 pb-6 space-y-4">
        {/* Banner gợi ý đăng nhập thành viên */}
        <div className="p-4 rounded-3xl bg-[#14171f]/[0.03] border border-[#14171f]/12 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#14171f]">
                Đã có tài khoản thành viên ReFuji?
              </p>
              <p className="text-neutral-500 text-[11px] mt-0.5">
                Đăng nhập để tự động điền thông tin và giảm 5–15% tiền cọc thiết bị. Hoặc tiếp tục đặt ngay bên dưới không cần OTP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToMemberLogin}
            className="px-4 py-2 rounded-full bg-white border border-[#14171f]/20 hover:bg-[#14171f] hover:text-white text-[#14171f] font-semibold text-xs transition-all cursor-pointer shrink-0 shadow-xs"
          >
            Đăng nhập thành viên
          </button>
        </div>

        {/* Tóm tắt đơn đang đặt */}
        <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 num">
          <div>
            <p className="font-semibold text-[#14171f]">{summaryTitle}</p>
            <p className="text-neutral-500 mt-0.5">
              Lịch thuê: <strong className="text-[#14171f]">{cleanDateDisplay}</strong> ({days} ngày)
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-neutral-500">
              Thuê: <span className="font-sans font-semibold text-[#14171f]">{totalRent.toLocaleString('vi-VN')}₫</span>
              {' • '}
              Cọc chuẩn (100%): <span className="font-sans font-semibold text-[#14171f]">{standardDeposit.toLocaleString('vi-VN')}₫</span>
            </p>
            <p className="font-bold text-emerald-700 font-sans text-sm mt-0.5">
              Tổng: {totalDue.toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        {/* Form thông tin khách hàng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#14171f] mb-1">
              Họ và tên người nhận máy <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-full border bg-white text-[#14171f] outline-none transition-colors ${
                  fieldErrors.full_name
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-neutral-300 focus:border-[#14171f]'
                }`}
              />
            </div>
            {fieldErrors.full_name && (
              <p className="text-[11px] text-rose-600 mt-1 pl-2">{fieldErrors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14171f] mb-1">
              Số điện thoại liên hệ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-full border bg-white text-[#14171f] outline-none transition-colors font-sans num ${
                  fieldErrors.phone
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-neutral-300 focus:border-[#14171f]'
                }`}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-[11px] text-rose-600 mt-1 pl-2">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14171f] mb-1">
              Email nhận mã đơn hàng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.vn"
                className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-full border bg-white text-[#14171f] outline-none transition-colors ${
                  fieldErrors.email
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-neutral-300 focus:border-[#14171f]'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 mt-1 pl-2">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14171f] mb-1">
              Ghi chú (giờ ghé showroom, nhu cầu...)
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Ghé nhận máy lúc 9h sáng..."
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-full border border-neutral-300 bg-white text-[#14171f] outline-none focus:border-[#14171f]"
              />
            </div>
          </div>
        </div>

        {/* Lựa chọn hình thức giữ chỗ */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#14171f] uppercase tracking-wider">
            Chọn hình thức giữ chỗ thiết bị
          </label>
          {/* Chức năng: Bố cục lại tiêu đề & nhãn badge để không bị cắt chữ (...) trên khung modal 2 cột */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBookingMode('ONLINE_PAYMENT')}
              className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col ${
                bookingMode === 'ONLINE_PAYMENT'
                  ? 'border-[#14171f] bg-[#14171f] text-white shadow-sm'
                  : 'border-[#14171f]/15 bg-[#fbfcfd] text-[#14171f] hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <QrCode size={17} className="shrink-0" />
                <span
                  className={`text-[10.5px] font-sans font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 num ${
                    bookingMode === 'ONLINE_PAYMENT'
                      ? 'bg-emerald-400 text-[#14171f]'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Khóa Serial 15p
                </span>
              </div>
              <div className="font-bold text-[13px] leading-snug mb-1">
                Thanh toán giữ chỗ ngay
              </div>
              <p
                className={`text-[11px] leading-relaxed ${
                  bookingMode === 'ONLINE_PAYMENT' ? 'text-neutral-200' : 'text-neutral-500'
                }`}
              >
                Khóa ngay số Serial thực tế trên kho trong 15 phút và thanh toán VietQR / VNPAY ở bước sau để chống đặt trùng.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setBookingMode('COUNTER_INQUIRY')}
              className={`p-4 rounded-3xl border text-left transition-all cursor-pointer flex flex-col ${
                bookingMode === 'COUNTER_INQUIRY'
                  ? 'border-[#14171f] bg-[#14171f] text-white shadow-sm'
                  : 'border-[#14171f]/15 bg-[#fbfcfd] text-[#14171f] hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <Store size={17} className="shrink-0" />
                <span
                  className={`text-[10.5px] font-sans font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    bookingMode === 'COUNTER_INQUIRY'
                      ? 'bg-amber-300 text-[#14171f]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Chưa khóa máy
                </span>
              </div>
              <div className="font-bold text-[13px] leading-snug mb-1">
                Đặt tại quầy (Chờ gọi)
              </div>
              <p
                className={`text-[11px] leading-relaxed ${
                  bookingMode === 'COUNTER_INQUIRY' ? 'text-neutral-200' : 'text-neutral-500'
                }`}
              >
                Gửi yêu cầu để nhân viên gọi xác nhận trước khi chốt giữ máy. Khách thanh toán online trước vẫn được ưu tiên khóa Serial.
              </p>
            </button>
          </div>

          {bookingMode === 'ONLINE_PAYMENT' && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-neutral-500">Kênh thanh toán dự kiến:</span>
              <button
                type="button"
                onClick={() => setOnlineMethod('VIETQR')}
                className={`px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer ${
                  onlineMethod === 'VIETQR'
                    ? 'bg-[#14171f] text-white border-[#14171f]'
                    : 'bg-white text-[#14171f] border-neutral-300'
                }`}
              >
                VietQR (Khuyên dùng)
              </button>
              <button
                type="button"
                onClick={() => setOnlineMethod('VNPAY')}
                className={`px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer ${
                  onlineMethod === 'VNPAY'
                    ? 'bg-[#14171f] text-white border-[#14171f]'
                    : 'bg-white text-[#14171f] border-neutral-300'
                }`}
              >
                Cổng VNPAY
              </button>
            </div>
          )}
        </div>

        {/* Privacy consent theo Luật BVDLCN 2025 */}
        <div
          className={`p-3.5 rounded-2xl border text-xs ${
            fieldErrors.privacy_consent
              ? 'bg-rose-50/70 border-rose-300'
              : 'bg-[#f7f8fa] border-[#14171f]/10'
          }`}
        >
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-md border-neutral-300 accent-[#14171f] cursor-pointer"
            />
            <span className="text-[#3a4050] leading-relaxed">
              Tôi đồng ý để <strong>ReFuji</strong> sử dụng Họ tên, SĐT và Email để liên hệ xác nhận đơn thuê, cấp mã tra cứu và đối chiếu thông tin khi nhận máy tại quầy.
            </span>
          </label>
          {fieldErrors.privacy_consent && (
            <p className="text-[11px] text-rose-600 mt-1.5 pl-6">{fieldErrors.privacy_consent}</p>
          )}
        </div>

        <div className="flex items-start gap-2 text-[11px] text-neutral-600 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80">
          <ShieldCheck size={14} className="text-[#14171f] shrink-0 mt-0.5" />
          <span>
            Khách vãng lai thanh toán 100% tiền cọc chuẩn theo thiết bị. Nếu cần hủy đơn trước khi nhận máy, bạn có thể tự hủy bất cứ lúc nào tại mục <strong>Đăng nhập / Đăng ký → Tra cứu đơn</strong> hoặc cuối trang.
          </span>
        </div>

        {serverError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}
      </div>

      {/* Footer điều hướng */}
      <div className="px-6 sm:px-8 py-3.5 border-t border-[#14171f]/10 bg-white shrink-0 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-full border border-[#14171f]/20 hover:bg-neutral-50 text-xs font-semibold text-[#14171f] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Quay lại</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang xử lý đơn hàng...</span>
            </>
          ) : bookingMode === 'ONLINE_PAYMENT' ? (
            <>
              <Clock size={15} />
              <span>Khóa giữ chỗ 15p &amp; Sang thanh toán</span>
              <ArrowRight size={15} />
            </>
          ) : (
            <>
              <Store size={15} />
              <span>Gửi yêu cầu đặt tại quầy</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
