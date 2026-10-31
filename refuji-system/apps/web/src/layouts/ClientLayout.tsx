import React, { useState, useEffect } from 'react';
import { Camera, ShoppingBag, User as UserIcon, Menu, X, Clock, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { MembershipTierBadge } from '../components/badges/MembershipTierBadge.tsx';
import { MembershipTier } from '@refuji/shared';

interface ClientLayoutProps {
  children: React.ReactNode;
  userTier?: MembershipTier | null;
  userName?: string | null;
  onOpenAuth?: () => void;
  cartCount?: number;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({
  children,
  userTier = null,
  userName = null,
  onOpenAuth,
  cartCount = 0
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col selection:bg-emerald-500/25">
      {/* 1. Header / Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0a0d14]/90 backdrop-blur-md border-b border-white/10 py-3 shadow-xl'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#00805e] flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-wider text-white">REFUJI</span>
              <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">Fujifilm Rental</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300" aria-label="Menu chính">
            <a href="/" className="hover:text-emerald-400 transition-colors">Trang chủ</a>
            <a href="/catalog" className="hover:text-emerald-400 transition-colors">Thiết bị & Ống kính</a>
            <a href="/membership" className="hover:text-emerald-400 transition-colors">Đặc quyền Hạng</a>
            <a href="/policies" className="hover:text-emerald-400 transition-colors">Chính sách & Cọc</a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Cart / Booking Bag */}
            <a
              href="/checkout"
              aria-label={`Giỏ thiết bị: ${cartCount} món`}
              className="relative p-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center num">
                  {cartCount}
                </span>
              )}
            </a>

            {/* User Auth or Profile Button */}
            {userName ? (
              <a
                href="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-colors"
              >
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span className="max-w-[120px] truncate">{userName}</span>
                {userTier && <MembershipTierBadge tier={userTier} />}
              </a>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAuth}
                className="hidden sm:inline-flex text-xs"
              >
                <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Đăng nhập</span>
              </Button>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-white/15 bg-white/5 text-zinc-200"
              aria-label="Mở menu di động"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0d1017] px-6 py-5 flex flex-col gap-4 text-sm font-medium">
            <a href="/" className="text-zinc-200 hover:text-emerald-400">Trang chủ</a>
            <a href="/catalog" className="text-zinc-200 hover:text-emerald-400">Thiết bị & Ống kính</a>
            <a href="/membership" className="text-zinc-200 hover:text-emerald-400">Đặc quyền Hạng</a>
            <a href="/policies" className="text-zinc-200 hover:text-emerald-400">Chính sách & Cọc</a>
            <div className="pt-3 border-t border-white/10">
              <Button variant="primary" size="md" className="w-full" onClick={onOpenAuth}>
                Đăng nhập / Đăng ký
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* 2. Professional Commercial Footer */}
      <footer className="border-t border-white/10 bg-[#06080d] text-zinc-400 text-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Showroom Contact */}
          <div className="md:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <span className="font-serif text-xl font-bold text-white tracking-wide">REFUJI</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mt-1">
              Hệ thống cho thuê máy ảnh & ống kính Fujifilm chính hãng. Đặt cọc linh hoạt theo hạng thành viên, bàn giao máy kiểm định kỹ thuật 2 chiều minh bạch.
            </p>
            <div className="flex flex-col gap-2 mt-2 text-xs text-zinc-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>180 Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="num font-semibold text-white">0901 234 567 (Hotline 24/7)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@refuji.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="num text-emerald-400 font-medium">Giờ mở cửa: 08:00 — 20:00 (Hàng ngày)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Danh mục thiết bị */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs uppercase font-mono tracking-widest text-white font-semibold mb-1">Thiết bị cho thuê</h3>
            <a href="/catalog?cat=BODY" className="text-xs hover:text-emerald-400 transition-colors">Thân máy Fujifilm X-Series</a>
            <a href="/catalog?cat=BODY&mount=G" className="text-xs hover:text-emerald-400 transition-colors">Medium Format GFX System</a>
            <a href="/catalog?cat=BODY&mount=FIXED" className="text-xs hover:text-emerald-400 transition-colors">Compact Street X100 Series</a>
            <a href="/catalog?cat=LENS" className="text-xs hover:text-emerald-400 transition-colors">Ống kính Fujinon XF / GF Prime</a>
            <a href="/catalog?cat=ACCESSORY" className="text-xs hover:text-emerald-400 transition-colors">Phụ kiện Pin, Sạc kép & Kính lọc ND</a>
          </div>

          {/* Col 3: Chính sách & Pháp lý */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs uppercase font-mono tracking-widest text-white font-semibold mb-1">Chính sách & Cọc</h3>
            <a href="/policies#deposit" className="text-xs hover:text-emerald-400 transition-colors">Biểu phí cọc & Hoàn tiền ngay</a>
            <a href="/policies#late-fee" className="text-xs hover:text-emerald-400 transition-colors">Quy định trả trễ & Phí bồi thường</a>
            <a href="/policies#privacy" className="text-xs hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảo vệ Dữ liệu Cá nhân 2025</span>
            </a>
            <a href="/policies#inspection" className="text-xs hover:text-emerald-400 transition-colors">Quy trình thẩm định Serial 2 chiều</a>
            <a href="/membership" className="text-xs hover:text-emerald-400 transition-colors">Đặc quyền Thẻ Vàng & Bạch Kim</a>
          </div>

          {/* Col 4: Cam kết & Pháp lý */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase font-mono tracking-widest text-white font-semibold mb-1">Cam kết tiêu chuẩn</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              100% thiết bị Fujifilm chính hãng được kiểm tra cảm biến, nút bấm cơ học và cập nhật firmware mới nhất trước mỗi lượt bàn giao.
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
              <span className="font-semibold text-emerald-400 block mb-0.5">Giữ chỗ 15 phút an toàn</span>
              Hệ thống tự động khóa giữ máy 15 phút trong khi thanh toán cọc online qua VNPAY.
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 REFUJI Camera Rental Services. Giấy chứng nhận ĐKKD số 0318923456 do Sở KH&ĐT TP.HCM cấp.</p>
          <div className="flex items-center gap-6">
            <a href="/terms" className="hover:text-zinc-300">Điều khoản sử dụng</a>
            <a href="/privacy" className="hover:text-zinc-300">Chính sách bảo mật</a>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-500/80 font-mono">Status: All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
