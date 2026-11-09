import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { PaymentModal } from './components/PaymentModal';
import { ReservationFloatingWidget } from './components/ReservationFloatingWidget';
import { ScrollFadeSection } from './components/ScrollFadeSection';
import { Footer } from './components/Footer';
import { CameraModel, LensModel, AccessoryModel, EquipmentItem, CartItem, ActiveReservation } from './types';
import { fetchCatalog } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { useCart } from './hooks/useCart';
import { getAccessTokenInMemory } from './services/authApi';

// Helper tính toán ngày thuê mặc định động từ hôm nay
const getInitialDates = () => {
  const now = new Date();
  const d3 = new Date();
  d3.setDate(d3.getDate() + 3);
  const startD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const endD = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-${String(d3.getDate()).padStart(2, '0')}`;
  const startShort = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const endShort = `${String(d3.getDate()).padStart(2, '0')}/${String(d3.getMonth() + 1).padStart(2, '0')}`;
  return {
    startDate: startD,
    endDate: endD,
    datesText: `${startShort} — ${endShort} (3 ngày)`,
  };
};

const MainApp: React.FC = () => {
  const { user, toast } = useAuth();
  const [cameras, setCameras] = useState<CameraModel[]>([]);
  const [lenses, setLenses] = useState<LensModel[]>([]);
  const [accessories, setAccessories] = useState<AccessoryModel[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Fetch real data from backend API (GET /api/models)
  const loadCatalog = useCallback(() => {
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

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Tự động làm mới số lượng khả dụng kho khi có sự kiện đặt đơn / giữ chỗ
  useEffect(() => {
    const handleRefresh = () => {
      loadCatalog();
    };
    window.addEventListener('refuji_catalog_refresh', handleRefresh);
    window.addEventListener('refuji_reservation_updated', handleRefresh);
    return () => {
      window.removeEventListener('refuji_catalog_refresh', handleRefresh);
      window.removeEventListener('refuji_reservation_updated', handleRefresh);
    };
  }, [loadCatalog]);

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

  const getInitialAccountModalState = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.replace('#', '');
    return (
      hash === 'account' ||
      hash === 'dashboard' ||
      hash === 'ho-so' ||
      sessionStorage.getItem('refuji_account_modal_open') === 'true'
    );
  };

  const getInitialCartModalState = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.replace('#', '');
    return (
      hash === 'cart' ||
      hash === 'gio-hang' ||
      sessionStorage.getItem('refuji_cart_modal_open') === 'true'
    );
  };

  const getInitialCalendarModalState = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.replace('#', '');
    return (
      hash === 'calendar' ||
      hash === 'lich' ||
      sessionStorage.getItem('refuji_calendar_modal_open') === 'true'
    );
  };

  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [selectedItem, setSelectedItem] = useState<CameraModel | LensModel | AccessoryModel | null>(null);
  const [searchNotification, setSearchNotification] = useState<string | null>(null);
  const [membershipTier, setMembershipTier] = useState<MembershipTierType>('BRONZE');

  // Đồng bộ Hạng thành viên từ tài khoản người dùng khi đăng nhập
  useEffect(() => {
    if (user?.membership_tier) {
      setMembershipTier(user.membership_tier);
    }
  }, [user]);

  const effectiveTier = user?.membership_tier || membershipTier;
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(getInitialAccountModalState);
  const [isCartModalOpen, setIsCartModalOpen] = useState(getInitialCartModalState);
  const [isPhotoViewOnly, setIsPhotoViewOnly] = useState(false);

  // Quản lý đơn giữ chỗ 15 phút chống đặt trùng (Persistent 15-Minute Reservation Hold)
  const [activeReservation, setActiveReservation] = useState<ActiveReservation | null>(() => {
    try {
      const saved = localStorage.getItem('refuji_active_reservation');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          return parsed;
        } else {
          localStorage.removeItem('refuji_active_reservation');
        }
      }
    } catch (_) {}
    return null;
  });
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  // Đồng bộ đơn giữ chỗ 15 phút với máy chủ và các sự kiện đặt thuê
  useEffect(() => {
    const handleReservationUpdate = (e: any) => {
      if (e.detail) {
        setActiveReservation(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('refuji_active_reservation');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
              setActiveReservation(parsed);
              return;
            }
          }
          setActiveReservation(null);
        } catch (_) {
          setActiveReservation(null);
        }
      }
    };
    window.addEventListener('refuji_reservation_updated', handleReservationUpdate);

    // Kiểm tra đơn giữ chỗ 15 phút từ Backend nếu local chưa có
    const token = getAccessTokenInMemory();
    fetch('/api/orders/my-orders', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((orders: any[]) => {
        if (!Array.isArray(orders)) return;
        const pending = orders.find((o) => o.order_status === 'PENDING_PAYMENT');
        if (pending) {
          const assignedSerials = pending.assigned_serials
            ? pending.assigned_serials.split(',').map((s: string) => s.trim())
            : [];
          const deadlineTime = pending.payment_deadline
            ? new Date(pending.payment_deadline).getTime()
            : 0;

          // Chỉ nhận đơn nếu THỜI GIAN GIỮ CHỖ THỰC TẾ TRÊN MÁY CHỦ CHƯA HẾT HẠN
          if (deadlineTime > Date.now()) {
            let itemsDetail: any[] = [];
            if (pending.items_detail) {
              try {
                itemsDetail = JSON.parse(pending.items_detail);
              } catch (_) {}
            }

            const createdTime = new Date(pending.created_at || Date.now()).getTime();
            const resData: ActiveReservation = {
              orderCode: pending.order_code,
              modelName: pending.model_name || 'Thiết bị Fujifilm',
              items: itemsDetail,
              assignedSerials,
              startDate: pending.start_date,
              expectedReturnDate: pending.expected_return_date,
              days: Math.max(
                1,
                Math.round(
                  (new Date(pending.expected_return_date).getTime() - new Date(pending.start_date).getTime()) /
                    (1000 * 3600 * 24)
                )
              ),
              totalRent: pending.total_rent,
              depositAmount: pending.deposit_amount,
              totalDue: (pending.total_rent || 0) + (pending.deposit_amount || 0),
              createdAt: createdTime,
              paymentDeadline: pending.payment_deadline,
              expiresAt: deadlineTime, // Sử dụng chính xác thời gian thực từ database
            };
            setActiveReservation(resData);
            try {
              localStorage.setItem('refuji_active_reservation', JSON.stringify(resData));
            } catch (_) {}
          } else {
            // Đã hết hạn -> xóa khỏi local để không hiện nút cũ
            setActiveReservation(null);
            try {
              localStorage.removeItem('refuji_active_reservation');
            } catch (_) {}
          }
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('refuji_reservation_updated', handleReservationUpdate);
    };
  }, []);

  // Quản lý giỏ hàng qua Custom Hook (đồng bộ trạng thái tài khoản & tự động xóa khi đăng xuất)
  const {
    cartItems,
    cartCount,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveFromCart,
    handleClearCart,
  } = useCart((msg) => {
    setSearchNotification(msg);
    setTimeout(() => setSearchNotification(null), 3000);
  }, user?.id);

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
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(getInitialCalendarModalState);
  const [rentalDates, setRentalDates] = useState(getInitialDates);
  const [filterParams, setFilterParams] = useState(() => {
    const init = getInitialDates();
    return {
      category: 'Tất cả thiết bị',
      mount: 'Hệ ngàm X (APS-C)',
      series: 'Tất cả dòng máy',
      dates: init.datesText,
    };
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
      // Riêng phân hệ #cameras và #lenses, cuộn sát mép trên cùng (headerHeight = 0)
      // để phân hệ chiếm trọn màn hình từ y = 0, không bị lộ phần đuôi ảnh của section phía trước
      const headerHeight = (targetId === 'cameras' || targetId === 'lenses') ? 0 : 84;
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

  // Quản lý mở/đóng modal Hồ sơ / Hạng thành viên (AccountModal)
  const openAccountModal = () => {
    setIsAccountModalOpen(true);
    sessionStorage.setItem('refuji_account_modal_open', 'true');
    window.history.replaceState(null, '', '#account');
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    sessionStorage.removeItem('refuji_account_modal_open');
    const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
    window.history.replaceState(null, '', `#${returnSec}`);
    setActiveSection(returnSec);
  };

  // Quản lý mở/đóng modal Giỏ hàng (CartModal)
  const openCartModal = () => {
    setIsCartModalOpen(true);
    sessionStorage.setItem('refuji_cart_modal_open', 'true');
    window.history.replaceState(null, '', '#cart');
  };

  const closeCartModal = () => {
    setIsCartModalOpen(false);
    sessionStorage.removeItem('refuji_cart_modal_open');
    const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
    window.history.replaceState(null, '', `#${returnSec}`);
    setActiveSection(returnSec);
  };

  // Quản lý mở/đóng modal Chọn ngày (CalendarModal)
  const openCalendarModal = () => {
    setIsCalendarModalOpen(true);
    sessionStorage.setItem('refuji_calendar_modal_open', 'true');
    window.history.replaceState(null, '', '#calendar');
  };

  const closeCalendarModal = () => {
    setIsCalendarModalOpen(false);
    sessionStorage.removeItem('refuji_calendar_modal_open');
    const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
    window.history.replaceState(null, '', `#${returnSec}`);
    setActiveSection(returnSec);
  };

  // Quản lý mở/đóng modal Chi tiết thiết bị / Đặt máy (BookingModal)
  const handleSelectItem = (item: CameraModel | LensModel | AccessoryModel) => {
    setSelectedItem(item);
    try {
      sessionStorage.setItem('refuji_selected_item_id', String(item.id));
      window.history.replaceState(null, '', `#item-${item.id}`);
    } catch (_) {}
  };

  const handleCloseItemModal = () => {
    setSelectedItem(null);
    try {
      sessionStorage.removeItem('refuji_selected_item_id');
      const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
      window.history.replaceState(null, '', `#${returnSec}`);
      setActiveSection(returnSec);
    } catch (_) {}
  };

  // Tự động khôi phục thiết bị đang xem khi F5 / Reload
  useEffect(() => {
    if (!isLoadingCatalog) {
      const hash = window.location.hash.replace('#', '');
      const savedItemId = sessionStorage.getItem('refuji_selected_item_id');
      const targetId = hash.startsWith('item-') ? hash.replace('item-', '') : savedItemId;

      if (targetId) {
        const all = [...cameras, ...lenses, ...accessories];
        const found = all.find((i) => String(i.id) === String(targetId));
        if (found) {
          setSelectedItem(found);
        }
      }
    }
  }, [isLoadingCatalog, cameras, lenses, accessories]);

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
      } else if (hash === 'account' || hash === 'dashboard' || hash === 'ho-so') {
        setIsAccountModalOpen(true);
      } else if (hash === 'cart' || hash === 'gio-hang') {
        setIsCartModalOpen(true);
      } else if (hash === 'calendar' || hash === 'lich') {
        setIsCalendarModalOpen(true);
      } else if (hash.startsWith('item-')) {
        const id = hash.replace('item-', '');
        const all = [...cameras, ...lenses, ...accessories];
        const found = all.find((i) => String(i.id) === id);
        if (found) setSelectedItem(found);
      } else {
        setIsAllEquipmentModalOpen(false);
        setIsAccountModalOpen(false);
        setIsCartModalOpen(false);
        setIsCalendarModalOpen(false);
        setSelectedItem(null);
        sessionStorage.removeItem('refuji_account_modal_open');
        sessionStorage.removeItem('refuji_all_equipment_open');
        sessionStorage.removeItem('refuji_cart_modal_open');
        sessionStorage.removeItem('refuji_calendar_modal_open');
        sessionStorage.removeItem('refuji_selected_item_id');
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
  }, [cameras, lenses, accessories]);

  // Scroll Trigger theo dõi vị trí cuộn và cập nhật active section trên thanh navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 40);
      sessionStorage.setItem('refuji_scroll_y', scrollY.toString());

      if (isManualScrolling.current) return;

      // Nếu đang mở bất kỳ Modal nào (Auth, Account, Cart, Calendar, Booking, AllEquipment), KHÔNG ghi đè hash của Modal
      const isAnyModalActive =
        isAllEquipmentModalOpen ||
        isAccountModalOpen ||
        isCartModalOpen ||
        isCalendarModalOpen ||
        selectedItem !== null ||
        sessionStorage.getItem('refuji_auth_modal_open') === 'true' ||
        sessionStorage.getItem('refuji_account_modal_open') === 'true' ||
        sessionStorage.getItem('refuji_cart_modal_open') === 'true' ||
        sessionStorage.getItem('refuji_all_equipment_open') === 'true';

      if (isAnyModalActive) return;

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
              return sectionId;
            });
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAllEquipmentModalOpen, isAccountModalOpen, isCartModalOpen, isCalendarModalOpen, selectedItem]);

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
        onOpenAuth={openAccountModal}
        onOpenCart={openCartModal}
        cartCount={cartCount}
        onNavigate={handleScrollTo}
        isSearchMode={isAllEquipmentModalOpen}
        onCloseSearchMode={closeAllEquipment}
        searchFilterParams={filterParams}
        onSearchChange={(params) => {
          setFilterParams(params);
          handleSearch(params);
        }}
        onOpenCalendar={openCalendarModal}
        isPhotoViewOnly={isPhotoViewOnly}
        onOpenReservation={() => setIsReservationModalOpen(true)}
        hasActiveReservation={!!activeReservation}
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
              handleSelectItem(item as any);
            }}
            membershipTier={effectiveTier}
            onOpenAllEquipment={openAllEquipment}
            filterParams={filterParams}
            onOpenCalendar={openCalendarModal}
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
            onSelectCamera={(cam) => handleSelectItem(cam)}
            onAddToCart={handleAddToCart}
            onPhotoViewChange={setIsPhotoViewOnly}
          />
        </ScrollFadeSection>

        {/* 4. Ống kính Fujinon (Danh sách lens du lịch khuyên dùng: 16-50mm, 16-80mm, 23mm, 27mm, 35mm) */}
        <ScrollFadeSection>
          <FeaturedLens 
            lenses={featuredHotLenses} 
            onSelectLens={(lens) => handleSelectItem(lens)}
            onAddToCart={handleAddToCart}
          />
        </ScrollFadeSection>

        {/* 5. Chính sách cọc & Cam kết pháp lý */}
        <ScrollFadeSection>
          <Footer isStandalonePage={true} />
        </ScrollFadeSection>
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
              handleSelectItem(item as any);
            }}
            filterParams={filterParams}
            onFilterChange={(params) => {
              setFilterParams(params);
              handleSearch(params);
            }}
            membershipTier={effectiveTier}
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
            onClose={closeCalendarModal}
            initialStartDate={rentalDates.startDate}
            initialEndDate={rentalDates.endDate}
            onApplyDates={(rangeText, totalDays, startStr, endStr) => {
              const newParams = { ...filterParams, dates: rangeText };
              setFilterParams(newParams);
              if (startStr && endStr) {
                setRentalDates({
                  startDate: startStr,
                  endDate: endStr,
                  datesText: rangeText,
                });
              }
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
            onClose={handleCloseItemModal} 
            membershipTier={effectiveTier}
            allLenses={lenses}
            allAccessories={accessories}
            onAddToCart={handleAddToCart}
            onOpenCart={openCartModal}
            initialStartDate={rentalDates.startDate}
            initialEndDate={rentalDates.endDate}
            onOpenCalendar={openCalendarModal}
          />
        )}
      </AnimatePresence>

      {/* Giỏ Hàng Thuê Thiết Bị Liquid Glass Modal */}
      <AnimatePresence>
        {isCartModalOpen && (
          <CartModal
            isOpen={isCartModalOpen}
            onClose={closeCartModal}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onOpenCalendar={openCalendarModal}
            rentalDatesText={filterParams.dates}
            startDate={rentalDates.startDate}
            expectedReturnDate={rentalDates.endDate}
            membershipTier={effectiveTier}
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
            onClose={closeAccountModal}
            currentTier={effectiveTier}
            onChangeTier={(tier) => {
              setMembershipTier(tier);
              setSearchNotification(`Đã cập nhật tài khoản: ${tier === 'PLATINUM' ? 'Bạch Kim (-15% cọc)' : tier === 'GOLD' ? 'Hạng Vàng (-10% cọc)' : tier === 'SILVER' ? 'Hạng Bạc (-5% cọc)' : 'Hạng Đồng'}`);
              setTimeout(() => setSearchNotification(null), 4000);
            }}
          />
        )}
      </AnimatePresence>

      {/* REFUJI AUTHENTICATION MODAL POPUP (Login ⇋ Register ⇋ Forgot Password) */}
      <AuthModal />

      {/* Auth Success/Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            onClick={() => {
              // Bấm vào thông báo giữ chỗ để mở ngay giao diện xem lại
              if (activeReservation && (toast.message.includes('giữ chỗ') || toast.message.includes('Serial'))) {
                setIsReservationModalOpen(true);
              }
            }}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed ${
              activeReservation ? 'bottom-36 md:bottom-32' : 'bottom-20 md:bottom-6'
            } right-6 z-[140] crystal-liquid-glass border border-[#14171f]/15 bg-white/95 px-5 py-3.5 rounded-2xl text-xs sm:text-sm text-[#14171f] shadow-[0_16px_40px_rgba(20,24,32,0.16)] flex items-center gap-3 font-medium max-w-md ${
              activeReservation && (toast.message.includes('giữ chỗ') || toast.message.includes('Serial'))
                ? 'cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/50'
                : ''
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                toast.type === 'error'
                  ? 'bg-rose-500'
                  : toast.type === 'info'
                  ? 'bg-blue-500'
                  : 'bg-emerald-500'
              } radar-pulse-white`}
            />
            <span className="leading-relaxed flex-1">{toast.message}</span>
            {activeReservation && (toast.message.includes('giữ chỗ') || toast.message.includes('Serial')) && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full underline shrink-0">
                Mở xem
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nút / Widget Giữ chỗ 15 phút cố định ở góc dưới bên phải */}
      {activeReservation && (
        <ReservationFloatingWidget
          reservation={activeReservation}
          onOpenModal={() => setIsReservationModalOpen(true)}
          onCancelHold={() => {
            setActiveReservation(null);
            try {
              localStorage.removeItem('refuji_active_reservation');
              window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
            } catch (_) {}
            setSearchNotification('Đã hủy giữ chỗ thiết bị');
            setTimeout(() => setSearchNotification(null), 3000);
          }}
        />
      )}

      {/* Giao diện Xem lại giữ chỗ 15 phút & Thanh toán cọc */}
      {isReservationModalOpen && activeReservation && (
        <PaymentModal
          isOpen={isReservationModalOpen}
          onClose={() => setIsReservationModalOpen(false)}
          orderCode={activeReservation.orderCode}
          modelName={activeReservation.modelName}
          startDate={activeReservation.startDate}
          expectedReturnDate={activeReservation.expectedReturnDate}
          days={activeReservation.days}
          totalRent={activeReservation.totalRent}
          depositAmount={activeReservation.depositAmount}
          totalDue={activeReservation.totalDue}
          assignedSerials={activeReservation.assignedSerials}
          itemsDetail={activeReservation.items as any}
          initialTimeLeft={Math.max(0, Math.floor((activeReservation.expiresAt - Date.now()) / 1000))}
          onPaymentSuccess={() => {
            setActiveReservation(null);
            try {
              localStorage.removeItem('refuji_active_reservation');
              window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
            } catch (_) {}
            setIsReservationModalOpen(false);
            setSearchNotification(`Thanh toán thành công đơn hàng #${activeReservation.orderCode}!`);
            setTimeout(() => setSearchNotification(null), 4000);
          }}
        />
      )}

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
