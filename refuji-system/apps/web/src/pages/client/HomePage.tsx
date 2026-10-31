import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  SlidersHorizontal, 
  Heart, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { StatusBadge } from '../../components/badges/StatusBadge.tsx';
import { MembershipTierBadge } from '../../components/badges/MembershipTierBadge.tsx';
import { PRODUCT_FIXTURES } from '../../services/catalog-fixtures.ts';
import { calcDeposit, formatVND, getDefaultRentalDates, MembershipTier, ProductModelEntity } from '@refuji/shared';

interface HomePageProps {
  userTier?: MembershipTier | null;
  onSelectModel?: (model: ProductModelEntity) => void;
  onOpenAuth?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  userTier = null,
  onSelectModel,
  onOpenAuth
}) => {
  // 1. Search Filters State
  const defaultDates = useMemo(() => getDefaultRentalDates(), []);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'BODY' | 'LENS'>('BODY');
  const [mountFilter, setMountFilter] = useState<'ALL' | 'X' | 'G' | 'FIXED'>('ALL');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedModelForModal, setSelectedModelForModal] = useState<ProductModelEntity | null>(null);

  // 2. Filter logic (Strictly eliminates X100VI when X-Mount is selected)
  const filteredModels = useMemo(() => {
    return PRODUCT_FIXTURES.filter((model) => {
      // Category filter
      if (categoryFilter !== 'ALL' && model.category !== categoryFilter) return false;
      // Mount filter
      if (mountFilter !== 'ALL' && model.mount !== mountFilter) return false;
      return true;
    });
  }, [categoryFilter, mountFilter]);

  // Featured Monthly Highlight (different from card, showing GFX 100 II Medium Format)
  const monthlySpotlight = useMemo(() => {
    return PRODUCT_FIXTURES.find((m) => m.slug === 'fujifilm-gfx100ii') || PRODUCT_FIXTURES[3];
  }, []);

  // Featured Legendary Lens
  const legendaryLens = useMemo(() => {
    return PRODUCT_FIXTURES.find((m) => m.slug === 'fujinon-xf-35mm-f14') || PRODUCT_FIXTURES[4];
  }, []);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userTier) {
      if (onOpenAuth) onOpenAuth();
      else setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="relative w-full">
      {/* =========================================================================
          1. HERO SECTION (Compact height: min-h-[70svh], Integrated Search)
          ========================================================================= */}
      <section 
        aria-labelledby="hero-heading"
        className="relative min-h-[72svh] flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-12 pb-16 overflow-hidden select-none"
      >
        {/* Background with clean mist forest & deep charcoal gradient */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-40 scale-105"
          style={{ 
            backgroundImage: `url('/assets/forest-clean.jpg')`,
            filter: 'grayscale(70%) contrast(120%) brightness(65%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07070a]/70 via-[#07070a]/90 to-[#07070a] z-0 pointer-events-none" />

        {/* Hero Headlines */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-semibold mb-3">
            Hệ thống cho thuê máy ảnh Fujifilm chính hãng
          </span>

          <h1 
            id="hero-heading"
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.12]"
          >
            LƯU GIỮ MỌI KHOẢNH KHẮC
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Trải nghiệm trọn vẹn chất ảnh điện ảnh và 20 giả lập màu phim danh tiếng. 
            Thủ tục thẩm định 2 chiều, giữ chỗ 15 phút an toàn với biểu phí cọc minh bạch.
          </p>

          {/* Integrated Modern Glass Search Bar */}
          <div className="w-full max-w-3xl liquid-glass rounded-2xl p-3 sm:p-4 border border-white/20 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Phân loại */}
              <div className="flex flex-col text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <label htmlFor="search-cat" className="text-xs font-medium text-zinc-400">Phân loại thiết bị</label>
                <select
                  id="search-cat"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="ALL" className="bg-zinc-900 text-white">Tất cả thiết bị</option>
                  <option value="BODY" className="bg-zinc-900 text-white">Thân máy (Body)</option>
                  <option value="LENS" className="bg-zinc-900 text-white">Ống kính (Lens)</option>
                </select>
              </div>

              {/* Hệ Ngàm (Mount) - Resolving Mount Filter Bug */}
              <div className="flex flex-col text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <label htmlFor="search-mount" className="text-xs font-medium text-zinc-400">Hệ ngàm / Dòng máy</label>
                <select
                  id="search-mount"
                  value={mountFilter}
                  onChange={(e) => setMountFilter(e.target.value as any)}
                  className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="ALL" className="bg-zinc-900 text-white">Tất cả hệ ngàm</option>
                  <option value="X" className="bg-zinc-900 text-white">Ngàm X (APS-C rời)</option>
                  <option value="G" className="bg-zinc-900 text-white">Ngàm G (GFX Medium Format)</option>
                  <option value="FIXED" className="bg-zinc-900 text-white">Ống kính liền (Fixed Lens)</option>
                </select>
              </div>

              {/* CTA Button: 1 Single Primary Button */}
              <div className="flex items-center">
                <Button 
                  variant="primary" 
                  size="md" 
                  className="w-full text-sm font-semibold shadow-lg shadow-emerald-950/50"
                  onClick={() => {
                    const el = document.getElementById('catalog-results');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Search className="w-4 h-4 mr-2" />
                  <span>Tìm máy trống</span>
                </Button>
              </div>
            </div>

            {/* Quick date cue & Tier incentive banner */}
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="num text-zinc-300">
                  Khung giờ nhận máy hợp lệ: 08:00 — 20:00 (Hàng ngày)
                </span>
              </div>
              
              {userTier ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bạn đang hưởng ưu đãi {userTier === 'GOLD' ? 'Hạng Vàng (-10% cọc)' : 'theo hạng'}</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-xs text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Đăng nhập để nhận ưu đãi giảm tới 15% tiền cọc</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. RESULTS CATALOG SECTION (Fix 3+1 Orphan Card -> 4 Columns Grid)
          ========================================================================= */}
      <section 
        id="catalog-results" 
        aria-labelledby="results-heading"
        className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span 
                aria-live="polite" 
                className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold"
              >
                Tìm thấy {filteredModels.length} thiết bị phù hợp
              </span>
            </div>
            <h2 id="results-heading" className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
              DANH MỤC THIẾT BỊ KHẢ DỤNG
            </h2>
          </div>

          <a 
            href="/catalog" 
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group self-start md:self-end"
          >
            <span>Xem toàn bộ kho máy & ống kính</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Responsive Grid: 1 col (mobile) -> 2 cols (tablet) -> 4 cols (desktop). NO ORPHAN CARDS! */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.slice(0, 4).map((model) => {
            const effectiveDeposit = calcDeposit(model.depositAmount, userTier);
            const isDiscounted = effectiveDeposit < model.depositAmount;

            return (
              <article 
                key={model.id}
                className="liquid-glass rounded-2xl p-4 flex flex-col justify-between h-full border border-white/15 hover:border-emerald-500/40 transition-all duration-300 group shadow-lg"
              >
                <div>
                  {/* Top Header Badge & Favorite Heart */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="label-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {model.highlightBadge || 'Chính hãng'}
                    </span>
                    <button
                      type="button"
                      onClick={handleFavoriteClick}
                      aria-label={`Thêm ${model.modelName} vào danh sách yêu thích`}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Image with fixed aspect-ratio, loading="lazy", and accessible alt */}
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 mb-4 border border-white/10 flex items-center justify-center p-2">
                    <img 
                      src={model.imageUrl} 
                      alt={`${model.modelName} - mặt trước thiết bị`}
                      width={480}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {model.mount === 'FIXED' && (
                      <span className="absolute bottom-2 left-2 text-[11px] font-medium bg-black/75 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
                        Ống kính liền
                      </span>
                    )}
                  </div>

                  {/* Title & Specs */}
                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                    {model.modelName}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                    {model.description}
                  </p>
                </div>

                {/* Bottom Section: Price & Deposit (Strictly Aligned) */}
                <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Giá thuê</span>
                      <span className="text-base font-bold text-emerald-400 num">
                        {formatVND(model.baseRentalPricePerDay)}
                      </span>
                      <span className="text-xs text-zinc-400 font-normal"> / ngày</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Tiền cọc</span>
                      <div className="flex items-center justify-end gap-1.5">
                        {isDiscounted && (
                          <span className="text-xs text-zinc-500 line-through num">
                            {formatVND(model.depositAmount)}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-zinc-200 num">
                          {formatVND(effectiveDeposit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Badge & Action Button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <StatusBadge status="AVAILABLE" type="item" />
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => {
                        if (onSelectModel) onSelectModel(model);
                        else setSelectedModelForModal(model);
                      }}
                    >
                      Đặt chỗ 15p
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          3. SPOTLIGHT SECTION (NO DUPLICATE X-T5! Highlights GFX 100 II Medium Format)
          ========================================================================= */}
      <section 
        aria-labelledby="spotlight-heading"
        className="py-20 md:py-24 border-t border-white/10 bg-[#080b12]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Image side with unified left-bottom offset frame */}
            <div className="lg:col-span-5 relative">
              {/* Offset decorative frame */}
              <div 
                aria-hidden="true" 
                className="absolute -bottom-3 -left-3 w-full h-full border-2 border-emerald-500/30 rounded-2xl pointer-events-none" 
              />
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden liquid-glass border border-white/20 p-4">
                <img 
                  src={monthlySpotlight.imageUrl} 
                  alt={`${monthlySpotlight.modelName} góc cận cảnh`}
                  width={640}
                  height={480}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Description side */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="label-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-3">
                TIÊU ĐIỂM DÒNG MÁY CAO CẤP
              </span>
              <h2 id="spotlight-heading" className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 leading-snug">
                {monthlySpotlight.modelName} — Đỉnh cao 102MP
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
                Dành cho các dự án thương mại, thời trang và in ấn khổ lớn. Khả năng tái hiện chi tiết phi thường với cảm biến Large Format lớn hơn 1.7 lần Full-frame.
              </p>

              {/* Specs Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-8">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Cảm biến</span>
                  <span className="text-xs font-semibold text-white num">102MP BSI CMOS</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Chống rung</span>
                  <span className="text-xs font-semibold text-white num">IBIS 8.0 Stops</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Video</span>
                  <span className="text-xs font-semibold text-white num">8K/30p & ProRes</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-zinc-400 block mb-0.5">Hệ ngàm</span>
                  <span className="text-xs font-semibold text-white">G-Mount rời</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={() => setSelectedModelForModal(monthlySpotlight)}
                >
                  <span>Thuê ngay từ {formatVND(monthlySpotlight.baseRentalPricePerDay)}/ngày</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <a href="/catalog?cat=BODY&mount=G" className="text-xs font-medium text-zinc-300 hover:text-white underline">
                  Xem thông số chi tiết
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. LEGENDARY LENS SECTION
          ========================================================================= */}
      <section 
        aria-labelledby="lens-heading"
        className="py-20 md:py-24 border-t border-white/10 max-w-7xl mx-auto px-4 sm:px-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 flex flex-col items-start order-2 lg:order-1">
            <span className="label-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-3">
              ỐNG KÍNH HUYỀN THOẠI FUJINON
            </span>
            <h2 id="lens-heading" className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              {legendaryLens.modelName}
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-6">
              Ống kính mang tính biểu tượng nhất của hệ máy Fujifilm X-Mount. Khẩu độ lớn f/1.4 cho độ chuyển vùng nét mượt mà và bokeh xoáy đặc trưng không thể nhầm lẫn.
            </p>

            <div className="flex items-baseline gap-4 mb-8">
              <div>
                <span className="text-xs text-zinc-400 block">Đơn giá thuê</span>
                <span className="text-xl font-bold text-emerald-400 num">
                  {formatVND(legendaryLens.baseRentalPricePerDay)}
                </span>
                <span className="text-xs text-zinc-400"> / ngày</span>
              </div>
              <div className="border-l border-white/15 pl-4">
                <span className="text-xs text-zinc-400 block">Tiền cọc chuẩn</span>
                <span className="text-sm font-semibold text-zinc-200 num">
                  {formatVND(calcDeposit(legendaryLens.depositAmount, userTier))}
                </span>
              </div>
            </div>

            <Button 
              variant="primary" 
              size="md"
              onClick={() => setSelectedModelForModal(legendaryLens)}
            >
              Đặt thuê ống kính này
            </Button>
          </div>

          <div className="lg:col-span-5 relative order-1 lg:order-2">
            <div 
              aria-hidden="true" 
              className="absolute -bottom-3 -left-3 w-full h-full border-2 border-amber-500/30 rounded-2xl pointer-events-none" 
            />
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden liquid-glass border border-white/20 p-4">
              <img 
                src={legendaryLens.imageUrl} 
                alt={`${legendaryLens.modelName} góc nghiêng`}
                width={640}
                height={480}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. MODAL BOOKING PREVIEW / DETAIL (Accessible Modal)
          ========================================================================= */}
      <Modal
        isOpen={!!selectedModelForModal}
        onClose={() => setSelectedModelForModal(null)}
        title={selectedModelForModal?.modelName}
        description="Xác nhận cấu hình và thông tin tiền cọc trước khi chuyển đến bước đặt máy"
      >
        {selectedModelForModal && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <img 
                src={selectedModelForModal.imageUrl} 
                alt={selectedModelForModal.modelName} 
                className="w-20 h-16 object-contain"
              />
              <div>
                <p className="font-bold text-white">{selectedModelForModal.modelName}</p>
                <p className="text-xs text-zinc-400">{selectedModelForModal.tagline}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-zinc-400 block mb-1">Giá thuê 1 ngày</span>
                <span className="text-base font-bold text-emerald-400 num">
                  {formatVND(selectedModelForModal.baseRentalPricePerDay)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-zinc-400 block mb-1">Tiền cọc thực nhận</span>
                <span className="text-base font-bold text-white num">
                  {formatVND(calcDeposit(selectedModelForModal.depositAmount, userTier))}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Máy được giữ chỗ trong 15 phút. Bạn chỉ cần thanh toán tiền cọc qua VNPAY hoặc chọn nhận máy trực tiếp tại Showroom.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedModelForModal(null)}>
                Đóng
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  window.location.href = `/checkout?modelId=${selectedModelForModal.id}`;
                }}
              >
                Tiếp tục đến giỏ hàng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Guest Auth prompt modal */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Đăng nhập tài khoản REFUJI"
        description="Đăng nhập để lưu danh sách yêu thích và nhận ưu đãi giảm tiền cọc lên đến 15% theo hạng thành viên."
      >
        <div className="flex flex-col gap-3">
          <Button 
            variant="primary" 
            size="md" 
            className="w-full"
            onClick={() => { window.location.href = '/login'; }}
          >
            Đến trang Đăng nhập
          </Button>
          <Button 
            variant="outline" 
            size="md" 
            className="w-full"
            onClick={() => { window.location.href = '/register'; }}
          >
            Tạo tài khoản mới
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
