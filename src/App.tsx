import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hero } from './components/Hero';
import { LiquidNavbar } from './components/LiquidNavbar';
import { AvailabilityExplorer } from './components/AvailabilityExplorer';
import { AllEquipmentModal } from './components/AllEquipmentModal';
import { CalendarModal } from './components/CalendarModal';
import { FeaturedCamera } from './components/FeaturedCamera';
import { FeaturedLens } from './components/FeaturedLens';
import { BookingModal } from './components/BookingModal';
import { AccountModal, MembershipTierType } from './components/AccountModal';
import { CartModal } from './components/CartModal';
import { ScrollFadeSection } from './components/ScrollFadeSection';
import { Footer } from './components/Footer';
import { CameraModel, LensModel, AccessoryModel, EquipmentItem, CartItem } from './types';
import { fetchCatalog } from './services/api';

export const App: React.FC = () => {
  const [cameras, setCameras] = useState<CameraModel[]>([]);
  const [lenses, setLenses] = useState<LensModel[]>([]);
  const [accessories, setAccessories] = useState<AccessoryModel[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Fetch real data from backend API (GET /api/models)
  useEffect(() => {
    fetchCatalog()
      .then((data) => {
        setCameras(data.cameras);
        setLenses(data.lenses);
        setAccessories(data.accessories);
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh mục thiết bị từ API:', err);
      })
      .finally(() => {
        setIsLoadingCatalog(false);
      });
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  // Khởi tạo section và modal từ URL hash hoặc sessionStorage để reload không bị nhảy về trang chủ
  const getInitialSection = () => {
    if (typeof window === 'undefined') return 'hero';
    const hash = window.location.hash.replace('#', '');
    if (['explore', 'cameras', 'lenses', 'policies', 'hero'].includes(hash)) {
      return hash;
    }
    const saved = sessionStorage.getItem('refuji_active_section');
    if (saved && ['explore', 'cameras', 'lenses', 'policies', 'hero'].includes(saved)) {
      return saved;
    }
    return 'hero';
  };

  const getInitialModalState = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.replace('#', '');
    return hash === 'thiet-bi' || hash === 'all-equipment' || sessionStorage.getItem('refuji_all_equipment_open') === 'true';
  };

  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [selectedItem, setSelectedItem] = useState<CameraModel | LensModel | AccessoryModel | null>(null);
  const [searchNotification, setSearchNotification] = useState<string | null>(null);
  const [membershipTier, setMembershipTier] = useState<MembershipTierType>('GOLD');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Giỏ hàng thuê thiết bị với lưu trữ tự động trong localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('refuji_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('refuji_cart_items', JSON.stringify(cartItems));
    } catch (_) {}
  }, [cartItems]);

  const handleAddToCart = (item: EquipmentItem) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          item: item as any,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
      ];
    });
    setSearchNotification(`Đã thêm "${item.name}" vào giỏ hàng thuê!`);
    setTimeout(() => setSearchNotification(null), 3000);
  };

  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((ci) => (ci.id === itemId ? { ...ci, quantity: newQty } : ci))
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.id !== itemId));
    setSearchNotification('Đã xóa thiết bị khỏi giỏ hàng.');
    setTimeout(() => setSearchNotification(null), 2500);
  };

  const handleClearCart = () => {
    setCartItems([]);
    setSearchNotification('Đã xóa toàn bộ giỏ hàng.');
    setTimeout(() => setSearchNotification(null), 2500);
  };

  // 4 dòng máy ảnh Hot nhất theo yêu cầu: FUJIFILM X100VI, X-T50, X-T5, X-S20
  const featuredHotCameras = React.useMemo(() => {
    if (!cameras.length) return [];
    const targetKeys = ['X100VI', 'X-T50', 'X-T5', 'X-S20'];
    const result: CameraModel[] = [];

    for (const key of targetKeys) {
      const found = cameras.find((c) => {
        if (key === 'X-T5') {
          return c.name.includes('X-T5') && !c.name.includes('X-T50');
        }
        return c.name.includes(key);
      });
      if (found && !result.some((r) => r.id === found.id)) {
        result.push(found);
      }
    }
    return result.slice(0, 4);
  }, [cameras]);

  // 4 ống kính du lịch Hot nhất theo yêu cầu: XF 16-50mm, XF 16-80mm, XF 23mm F2, XF 35mm F1.4
  const featuredHotLenses = React.useMemo(() => {
    if (!lenses.length) return [];
    const targetKeys = ['16-50mm', '16-80mm', '23mmF2', '35mmF1.4'];
    const result: LensModel[] = [];

    for (const key of targetKeys) {
      const found = lenses.find((l) => l.name.includes(key));
      if (found && !result.some((r) => r.id === found.id)) {
        result.push(found);
      }
    }
    return result.slice(0, 4);
  }, [lenses]);

  // Trạng thái mở popup toàn bộ máy & phụ kiện kèm chế độ tìm kiếm thay thế thanh navbar
  const [isAllEquipmentModalOpen, setIsAllEquipmentModalOpen] = useState(getInitialModalState);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [filterParams, setFilterParams] = useState({
    category: 'Tất cả thiết bị',
    mount: 'Hệ ngàm X (APS-C)',
    series: 'Tất cả dòng máy',
    dates: '29/10 — 31/10 (3 ngày)',
  });

  const isManualScrolling = useRef(false);
  const scrollTimeout = useRef<number | null>(null);
  const initialRestored = useRef(false);

  const scrollToTargetSection = (targetId: string, smooth = true) => {
    if (targetId === 'hero') {
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
      return;
    }
    const elem = document.getElementById(targetId);
    if (elem) {
      const headerHeight = 84;
      const elemTop = elem.getBoundingClientRect().top + window.pageYOffset;
      const targetY = Math.max(0, elemTop - headerHeight);
      window.scrollTo({ top: targetY, behavior: smooth ? 'smooth' : 'instant' });
    }
  };

  // Quản lý mở/đóng modal toàn bộ thiết bị và đồng bộ URL hash
  const openAllEquipment = () => {
    setIsAllEquipmentModalOpen(true);
    window.history.replaceState(null, '', '#thiet-bi');
    sessionStorage.setItem('refuji_all_equipment_open', 'true');
  };

  const closeAllEquipment = () => {
    setIsAllEquipmentModalOpen(false);
    sessionStorage.removeItem('refuji_all_equipment_open');
    sessionStorage.setItem('refuji_active_section', 'explore');
    window.history.replaceState(null, '', '#explore');
    setActiveSection('explore');

    // Giữ nguyên tại section #explore mà không nhảy về hero rồi cuộn xuống
    requestAnimationFrame(() => {
      const exploreElem = document.getElementById('explore');
      if (exploreElem) {
        const headerHeight = 84;
        const elemTop = exploreElem.getBoundingClientRect().top + window.pageYOffset;
        const targetY = Math.max(0, elemTop - headerHeight);
        window.scrollTo({ top: targetY, behavior: 'instant' });
      }
    });
  };

  // Vô hiệu hóa auto scroll restoration mặc định của browser để tránh bị giật về 0 khi reload
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Khôi phục vị trí trang sau khi danh mục thiết bị đã load xong từ MySQL API
  useEffect(() => {
    if (initialRestored.current || isLoadingCatalog) return;

    const initialSec = getInitialSection();
    if (initialSec && initialSec !== 'hero') {
      setTimeout(() => {
        scrollToTargetSection(initialSec, false);
        setActiveSection(initialSec);
        initialRestored.current = true;
      }, 100);
    } else {
      const savedY = sessionStorage.getItem('refuji_scroll_y');
      if (savedY && Number(savedY) > 50) {
        setTimeout(() => {
          window.scrollTo({ top: Number(savedY), behavior: 'instant' });
          initialRestored.current = true;
        }, 100);
      } else {
        initialRestored.current = true;
      }
    }
  }, [isLoadingCatalog]);

  // Hỗ trợ nút Back / Forward trên trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'thiet-bi' || hash === 'all-equipment') {
        setIsAllEquipmentModalOpen(true);
      } else {
        setIsAllEquipmentModalOpen(false);
        if (['explore', 'cameras', 'lenses', 'policies', 'hero'].includes(hash)) {
          scrollToTargetSection(hash, true);
          setActiveSection(hash);
        } else if (!hash) {
          scrollToTargetSection('hero', true);
          setActiveSection('hero');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Scroll Trigger theo dõi vị trí cuộn và cập nhật active section trên thanh navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 40);
      sessionStorage.setItem('refuji_scroll_y', scrollY.toString());

      if (isManualScrolling.current) return;

      const sections = ['policies', 'lenses', 'cameras', 'explore', 'hero'];
      const headerHeight = 84;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= headerHeight + 120) {
            setActiveSection((prev) => {
              if (prev !== sectionId) {
                sessionStorage.setItem('refuji_active_section', sectionId);
                if (!isAllEquipmentModalOpen) {
                  if (sectionId === 'hero') {
                    if (window.location.hash) {
                      window.history.replaceState(null, '', window.location.pathname);
                    }
                  } else {
                    if (window.location.hash !== `#${sectionId}`) {
                      window.history.replaceState(null, '', `#${sectionId}`);
                    }
                  }
                }
              }
              return sectionId;
            });
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAllEquipmentModalOpen]);

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    isManualScrolling.current = true;

    scrollToTargetSection(id, true);

    // Cập nhật URL hash và sessionStorage
    if (id === 'hero') {
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      window.history.replaceState(null, '', `#${id}`);
    }
    sessionStorage.setItem('refuji_active_section', id);

    if (scrollTimeout.current) {
      window.clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = window.setTimeout(() => {
      isManualScrolling.current = false;
      sessionStorage.setItem('refuji_scroll_y', window.scrollY.toString());
    }, 850);
  };

  const handleSearch = (params: { category: string; mount: string; series: string; dates: string }) => {
    // Không hiện toast nếu chỉ đang lướt xem danh mục
    if (params.series !== 'Tất cả dòng máy' || params.mount !== 'Hệ ngàm X (APS-C)') {
      setSearchNotification(
        `Đã lọc: ${params.mount} • ${params.series}`
      );
      setTimeout(() => setSearchNotification(null), 3000);
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-[#14171f] overflow-x-hidden selection:bg-[#14171f]/10">

      {/* 
        Floating Liquid Glass Taskbar:
        - Khi bình thường: Thanh Home NavigationScrubber (Ảnh 2)
        - Khi mở Xem Thêm Popup: Tự động chuyển thành Thanh Tìm Kiếm GlassSearchBar (Ảnh 3)
      */}
      <LiquidNavbar 
        isVisible={isScrolled} 
        activeSection={activeSection}
        onOpenAuth={() => setIsAccountModalOpen(true)}
        onOpenCart={() => setIsCartModalOpen(true)}
        cartCount={cartItems.reduce((acc, c) => acc + c.quantity, 0)}
        onNavigate={handleScrollTo}
        isSearchMode={isAllEquipmentModalOpen}
        onCloseSearchMode={closeAllEquipment}
        searchFilterParams={filterParams}
        onSearchChange={(params) => {
          setFilterParams(params);
          handleSearch(params);
        }}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
      />

      {/* Search Feedback Toast with Rytox Spring Physics */}
      <AnimatePresence>
        {searchNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 md:bottom-6 right-6 z-[70] crystal-liquid-glass border border-[#14171f]/15 bg-white/95 px-5 py-3 rounded-2xl text-xs sm:text-sm text-[#14171f] shadow-[0_12px_36px_rgba(20,24,32,0.12)] flex items-center gap-2.5 font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-[#14171f]/80 radar-pulse-white" />
            <span>{searchNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Màn hình đầu tiên (Hero 100vh) */}
      <Hero onExploreClick={() => handleScrollTo('explore')} />

      {/* Main Continuous Page Flow: Cuộn lên xuống mượt mà giữa các section */}
      <main className="relative z-10 w-full">
        {/* 2. Tra cứu lịch */}
        <ScrollFadeSection>
          <AvailabilityExplorer 
            onSearch={handleSearch}
            onSelectItem={(item) => {
              closeAllEquipment();
              setSelectedItem(item as any);
            }}
            membershipTier={membershipTier}
            onOpenAllEquipment={openAllEquipment}
            filterParams={filterParams}
            onOpenCalendar={() => setIsCalendarModalOpen(true)}
            cameras={cameras}
            lenses={lenses}
            accessories={accessories}
            onAddToCart={handleAddToCart}
          />
        </ScrollFadeSection>

        {/* 3. Máy ảnh Hot (Danh sách máy ảnh du lịch hot nhất: X-T50, X-E5, X-T5, X-S20, X-M5, X-T30 III) */}
        <ScrollFadeSection>
          <FeaturedCamera 
            cameras={featuredHotCameras} 
            onSelectCamera={(cam) => setSelectedItem(cam)}
            onAddToCart={handleAddToCart}
          />
        </ScrollFadeSection>

        {/* 4. Ống kính Fujinon (Danh sách lens du lịch khuyên dùng: 16-50mm, 16-80mm, 23mm, 27mm, 35mm) */}
        <ScrollFadeSection>
          <FeaturedLens 
            lenses={featuredHotLenses} 
            onSelectLens={(lens) => setSelectedItem(lens)}
            onAddToCart={handleAddToCart}
          />
        </ScrollFadeSection>

        {/* 5. Chính sách cọc & Cam kết pháp lý */}
        <Footer isStandalonePage={true} />
      </main>

      {/* 
        POPUP CỐ ĐỊNH GỒM TOÀN BỘ MÁY VÀ PHỤ KIỆN
        - Mở khi bấm "Xem thêm"
        - Tích hợp thanh tìm kiếm ở Header phía trên
        - Animation chuyển cảnh mượt mà chuẩn iOS / macOS
      */}
      <AnimatePresence>
        {isAllEquipmentModalOpen && (
          <AllEquipmentModal
            isOpen={isAllEquipmentModalOpen}
            onClose={closeAllEquipment}
            onSelectItem={(item) => {
              closeAllEquipment();
              setSelectedItem(item as any);
            }}
            filterParams={filterParams}
            onFilterChange={(params) => {
              setFilterParams(params);
              handleSearch(params);
            }}
            membershipTier={membershipTier}
            cameras={cameras}
            lenses={lenses}
            accessories={accessories}
            onAddToCart={handleAddToCart}
          />
        )}
      </AnimatePresence>

      {/* Popup Lịch & Thời Gian Thuê Chi Tiết */}
      <AnimatePresence>
        {isCalendarModalOpen && (
          <CalendarModal
            isOpen={isCalendarModalOpen}
            onClose={() => setIsCalendarModalOpen(false)}
            initialStartDate="2026-10-29"
            initialEndDate="2026-10-31"
            onApplyDates={(rangeText) => {
              const newParams = { ...filterParams, dates: rangeText };
              setFilterParams(newParams);
              handleSearch(newParams);
            }}
          />
        )}
      </AnimatePresence>

      {/* Booking / Details Modal (15-min Reservation Hold) kèm gợi ý combo lens & phụ kiện */}
      <AnimatePresence>
        {selectedItem && (
          <BookingModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            membershipTier={membershipTier}
            allLenses={lenses}
            allAccessories={accessories}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartModalOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Giỏ Hàng Thuê Thiết Bị Liquid Glass Modal */}
      <AnimatePresence>
        {isCartModalOpen && (
          <CartModal
            isOpen={isCartModalOpen}
            onClose={() => setIsCartModalOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onOpenCalendar={() => setIsCalendarModalOpen(true)}
            rentalDatesText={filterParams.dates}
            membershipTier={membershipTier}
            allLenses={lenses}
            allAccessories={accessories}
            onAddToCart={handleAddToCart}
            onCheckoutSuccess={() => {
              setSearchNotification('Đã xác nhận giữ chỗ giỏ hàng 15 phút thành công!');
              setTimeout(() => setSearchNotification(null), 4000);
            }}
          />
        )}
      </AnimatePresence>

      {/* Account Info & Membership Tier Modal */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            currentTier={membershipTier}
            onChangeTier={(tier) => {
              setMembershipTier(tier);
              setSearchNotification(`Đã cập nhật tài khoản: ${tier === 'PLATINUM' ? 'Bạch Kim (-15% cọc)' : tier === 'GOLD' ? 'Hạng Vàng (-10% cọc)' : tier === 'SILVER' ? 'Hạng Bạc (-5% cọc)' : 'Hạng Đồng'}`);
              setTimeout(() => setSearchNotification(null), 4000);
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer / Chính sách */}
      <ScrollFadeSection>
        <Footer />
      </ScrollFadeSection>

    </div>
  );
};

export default App;
