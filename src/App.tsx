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
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CameraModel, LensModel, AccessoryModel, EquipmentItem, ActiveReservation } from './types';
import { fetchCatalog } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { useCart } from './hooks/useCart';
import {
  getAccessTokenInMemory,
  cancelGuestOrder,
  cancelMyOrder,
  lookupGuestOrder,
  GuestLookupOrderResponse,
  updateRecentGuestOrderStatus,
} from './services/authApi';

// Kiểm tra đường dẫn hoặc hash thuộc phân hệ Quản trị Studio / POS tách biệt
const isDashboardLocation = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.replace('#', '').toLowerCase();
  return (
    path === '/dashboard' ||
    path === '/admin' ||
    hash === 'dashboard' ||
    hash === 'admin' ||
    hash === 'quan-tri' ||
    hash === 'pos'
  );
};

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
  const { user, isAuthReady, toast, setToast, openAuthModal } = useAuth();
  const [isDashboardRoute, setIsDashboardRoute] = useState<boolean>(isDashboardLocation);
  const [cameras, setCameras] = useState<CameraModel[]>([]);
  const [lenses, setLenses] = useState<LensModel[]>([]);
  const [accessories, setAccessories] = useState<AccessoryModel[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [rentalDates, setRentalDates] = useState(getInitialDates);

  // Tính năng: Tải danh mục theo khoảng ngày thuê đang chọn để lọc máy trùng lịch theo thời gian thực
  const loadCatalog = useCallback(() => {
    fetchCatalog(rentalDates.startDate, rentalDates.endDate)
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
  }, [rentalDates.startDate, rentalDates.endDate]);

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

  // Đồng bộ Hạng thành viên từ tài khoản người dùng (Khách chưa đăng nhập luôn về BRONZE)
  useEffect(() => {
    if (user?.membership_tier) {
      setMembershipTier(user.membership_tier);
    } else {
      setMembershipTier('BRONZE');
    }
  }, [user]);

  const effectiveTier = user ? (user.membership_tier || membershipTier) : 'BRONZE';
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(getInitialAccountModalState);
  const [accountInitialTab, setAccountInitialTab] = useState<'tiers' | 'orders' | 'profile'>('tiers');
  const [isCartModalOpen, setIsCartModalOpen] = useState(getInitialCartModalState);
  const [isPhotoViewOnly, setIsPhotoViewOnly] = useState(false);

  // Tính năng: Tự động ẩn toàn bộ thông báo searchNotification đúng 5 giây
  useEffect(() => {
    if (!searchNotification) return;
    const timer = window.setTimeout(() => setSearchNotification(null), 5000);
    return () => window.clearTimeout(timer);
  }, [searchNotification]);

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

  // Tính năng: Đồng bộ giữ chỗ 15p (Thành viên gọi /my-orders có JWT; Khách vãng lai đối soát qua /guest-lookup)
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

    const token = getAccessTokenInMemory();
    if (user && isAuthReady && token) {
      fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
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
                expiresAt: deadlineTime,
              };
              setActiveReservation(resData);
              try {
                localStorage.setItem('refuji_active_reservation', JSON.stringify(resData));
              } catch (_) {}
            } else {
              setActiveReservation(null);
              try {
                localStorage.removeItem('refuji_active_reservation');
              } catch (_) {}
            }
          } else {
            // Tài khoản hiện tại không có đơn PENDING_PAYMENT -> dọn cache giữ chỗ của tài khoản khác nếu còn sót
            try {
              const saved = localStorage.getItem('refuji_active_reservation');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed?.isGuest) {
                  localStorage.removeItem('refuji_active_reservation');
                  setActiveReservation(null);
                }
              }
            } catch (_) {}
          }
        })
        .catch(() => {});
    } else if (!user && isAuthReady) {
      try {
        const saved = localStorage.getItem('refuji_active_reservation');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.isGuest && parsed?.orderCode && parsed?.guestPhone) {
            lookupGuestOrder(parsed.orderCode, parsed.guestPhone)
              .then((serverOrder) => {
                const deadlineTime = serverOrder.payment_deadline
                  ? new Date(serverOrder.payment_deadline).getTime()
                  : 0;
                if (serverOrder.order_status !== 'PENDING_PAYMENT' || deadlineTime <= Date.now()) {
                  localStorage.removeItem('refuji_active_reservation');
                  setActiveReservation(null);
                  updateRecentGuestOrderStatus(serverOrder.order_code, serverOrder.order_status);
                }
              })
              .catch(() => {});
          } else if (!parsed?.isGuest) {
            localStorage.removeItem('refuji_active_reservation');
            setActiveReservation(null);
          }
        }
      } catch (_) {}
    }

    return () => {
      window.removeEventListener('refuji_reservation_updated', handleReservationUpdate);
    };
  }, [user, isAuthReady]);

  const allCatalogItems = React.useMemo<EquipmentItem[]>(
    () => [...cameras, ...lenses, ...accessories],
    [cameras, lenses, accessories]
  );

  // Quản lý giỏ hàng qua Custom Hook (2 tầng: vãng lai lưu localStorage, thành viên lưu DB & tự động gộp giỏ khi đăng nhập)
  const {
    cartItems,
    cartCount,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveFromCart,
    handleClearCart,
  } = useCart({
    onNotification: (msg) => {
      setSearchNotification(msg);
    },
    startDate: rentalDates.startDate,
    endDate: rentalDates.endDate,
    catalogItems: allCatalogItems,
  });

  // 4 dòng máy ảnh Hot nhất sắp xếp theo thứ tự Series: X100 -> X-S -> X-T
  const featuredHotCameras = React.useMemo(() => {
    if (!cameras.length) return [];
    const targetKeys = ['X100VI', 'X-S20', 'X-T5', 'X-T50'];
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
  const [filterParams, setFilterParams] = useState<{
    category: string;
    mount: string;
    series: string;
    dates: string;
    priceRange?: string;
  }>(() => {
    const init = getInitialDates();
    return {
      category: 'Tất cả thiết bị',
      mount: 'Tất cả hệ ngàm',
      series: 'Tất cả dòng máy',
      dates: init.datesText,
      priceRange: 'Tất cả mức giá',
    };
  });

  const isManualScrolling = useRef(false);
  const scrollTimeout = useRef<number | null>(null);
  const initialRestored = useRef(false);
  const isDashboardRouteRef = useRef<boolean>(isDashboardLocation());

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

  // Quản lý mở/đóng modal Hồ sơ / Hạng thành viên (AccountModal) theo tab chỉ định
  const openAccountModal = useCallback((tab: 'tiers' | 'orders' | 'profile' = 'tiers') => {
    setAccountInitialTab(tab);
    setIsAccountModalOpen(true);
    sessionStorage.setItem('refuji_account_modal_open', 'true');
    sessionStorage.setItem('refuji_account_active_tab', tab);
    window.history.replaceState(null, '', '#account');
  }, []);

  // Tính năng: Mở tra cứu đơn thống nhất (thành viên -> Dashboard tab Đơn thuê; khách -> Popup Tài khoản tab Tra cứu)
  const openOrderLookup = useCallback(() => {
    if (user) {
      openAccountModal('orders');
    } else {
      openAuthModal('guest-lookup');
    }
  }, [user, openAccountModal, openAuthModal]);

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

  // Mở/đóng Phân hệ Quản trị Studio độc lập (#dashboard / /dashboard)
  const openDashboard = useCallback(() => {
    isDashboardRouteRef.current = true;
    setIsDashboardRoute(true);
    if (window.location.hash !== '#dashboard') {
      window.history.pushState(null, '', '#dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const closeDashboard = useCallback(() => {
    isDashboardRouteRef.current = false;
    setIsDashboardRoute(false);
    const returnSec = sessionStorage.getItem('refuji_active_section') || 'hero';
    const targetUrl = returnSec === 'hero' ? '/' : `/#${returnSec}`;
    window.history.replaceState(null, '', targetUrl);
    loadCatalog();
    requestAnimationFrame(() => {
      scrollToTargetSection(returnSec, false);
    });
  }, [loadCatalog]);

  // Khôi phục vị trí trang sau khi danh mục thiết bị đã load xong từ MySQL API
  useEffect(() => {
    if (isDashboardRoute || initialRestored.current || isLoadingCatalog) return;

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
  }, [isDashboardRoute, isLoadingCatalog]);

  // Hỗ trợ nút Back / Forward và chuyển route #dashboard trên trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      if (isDashboardLocation()) {
        isDashboardRouteRef.current = true;
        setIsDashboardRoute(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      isDashboardRouteRef.current = false;
      setIsDashboardRoute(false);

      const hash = window.location.hash.replace('#', '');
      if (hash === 'thiet-bi' || hash === 'all-equipment') {
        setIsAllEquipmentModalOpen(true);
      } else if (hash === 'account' || hash === 'ho-so') {
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
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [cameras, lenses, accessories]);

  // Scroll Trigger theo dõi vị trí cuộn và cập nhật active section trên thanh navbar
  useEffect(() => {
    const handleScroll = () => {
      if (isDashboardRoute || isDashboardRouteRef.current || isDashboardLocation()) return;
      const scrollY = window.scrollY;
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
  }, [isDashboardRoute, isAllEquipmentModalOpen, isAccountModalOpen, isCartModalOpen, isCalendarModalOpen, selectedItem]);

  // Tính năng: Hủy giữ chỗ 15p đang chờ (hỗ trợ cả Thành viên qua /cancel và Khách vãng lai qua /guest-cancel)
  const handleCancelActiveReservation = useCallback(async () => {
    if (!activeReservation) return;
    try {
      if (activeReservation.isGuest && activeReservation.guestPhone) {
        await cancelGuestOrder(activeReservation.orderCode, activeReservation.guestPhone);
        updateRecentGuestOrderStatus(activeReservation.orderCode, 'CANCELLED');
      } else {
        await cancelMyOrder(activeReservation.orderCode);
      }
    } catch (err: any) {
      const msg = String(err?.message || '');
      const alreadyFinalized =
        msg.includes('đã được hủy') || msg.includes('Không tìm thấy') || msg.includes('hết hạn');
      if (!alreadyFinalized) {
        if (setToast) {
          setToast({
            id: Date.now().toString(),
            message: msg || 'Không thể hủy giữ chỗ đơn hàng. Vui lòng thử lại.',
            type: 'error',
          });
        }
        throw err;
      }
    }

    setActiveReservation(null);
    setIsReservationModalOpen(false);
    try {
      localStorage.removeItem('refuji_active_reservation');
      window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
    setSearchNotification(`Đã hủy giữ chỗ đơn #${activeReservation.orderCode} và trả máy về kho`);
  }, [activeReservation, setToast]);

  // Tính năng: Lắng nghe sự kiện thanh toán tiếp từ tab Tra cứu đơn (AuthModal / Dashboard AccountModal)
  useEffect(() => {
    const handleResumeGuestPayment = (evt: Event) => {
      const customEvt = evt as CustomEvent<GuestLookupOrderResponse>;
      const order = customEvt.detail;
      if (!order) return;
      let itemsDetail: any[] = [];
      try {
        itemsDetail = order.items_detail ? JSON.parse(order.items_detail) : [];
      } catch (_) {}
      const deadlineMs = order.payment_deadline
        ? new Date(order.payment_deadline).getTime()
        : Date.now() + 15 * 60 * 1000;
      const days = Math.max(
        1,
        Math.round(
          (new Date(order.expected_return_date).getTime() - new Date(order.start_date).getTime()) /
            86400000
        )
      );
      const resData: ActiveReservation = {
        orderCode: order.order_code,
        modelName: order.model_name || 'Thiết bị Fujifilm',
        items: itemsDetail,
        assignedSerials: order.assigned_serials
          ? order.assigned_serials.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        startDate: order.start_date,
        expectedReturnDate: order.expected_return_date,
        days,
        totalRent: Number(order.total_rent || 0),
        depositAmount: Number(order.deposit_amount || 0),
        totalDue: Number(order.total_rent || 0) + Number(order.deposit_amount || 0),
        createdAt: new Date(order.created_at || Date.now()).getTime(),
        paymentDeadline: order.payment_deadline || new Date(deadlineMs).toISOString(),
        expiresAt: deadlineMs,
        isGuest: true,
        guestPhone: order.guest_phone,
      };
      setActiveReservation(resData);
      try {
        localStorage.setItem('refuji_active_reservation', JSON.stringify(resData));
        window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: resData }));
      } catch (_) {}
      setIsReservationModalOpen(true);
    };
    window.addEventListener('refuji_resume_guest_payment', handleResumeGuestPayment);
    return () => window.removeEventListener('refuji_resume_guest_payment', handleResumeGuestPayment);
  }, []);

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

  // Tính năng: Thông báo bộ lọc hiện hành (bao gồm bộ lọc mức giá mới)
  const handleSearch = (params: { category: string; mount: string; series: string; dates: string; priceRange?: string }) => {
    const hasPriceFilter = Boolean(params.priceRange && params.priceRange !== 'Tất cả mức giá');
    if (params.series !== 'Tất cả dòng máy' || params.mount !== 'Tất cả hệ ngàm' || hasPriceFilter) {
      const parts = [params.mount, params.series, ...(hasPriceFilter ? [params.priceRange!] : [])];
      setSearchNotification(`Đã lọc: ${parts.join(' • ')}`);
    }
  };

  if (isDashboardRoute) {
    return <DashboardPage onExitToStorefront={closeDashboard} />;
  }

  return (
    <div className="relative min-h-screen bg-white text-[#14171f] overflow-x-hidden selection:bg-[#14171f]/10">

      {/* 
        Floating Liquid Glass Taskbar:
        - Khi bình thường: Thanh Home NavigationScrubber (Ảnh 2)
        - Khi mở Xem Thêm Popup: Tự động chuyển thành Thanh Tìm Kiếm GlassSearchBar (Ảnh 3)
      */}
      <LiquidNavbar 
        activeSection={activeSection}
        onOpenAuth={() => openAccountModal('tiers')}
        onOpenOrdersTab={() => openAccountModal('orders')}
        onOpenDashboard={openDashboard}
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

      {/* Search Feedback Toast with Spring Physics */}
      <AnimatePresence>
        {searchNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed ${
              activeReservation && toast
                ? 'bottom-52 md:bottom-36'
                : activeReservation || toast
                ? 'bottom-36 md:bottom-20'
                : 'bottom-20 md:bottom-6'
            } right-4 sm:right-6 z-[135] crystal-liquid-glass border border-[#14171f]/10 bg-white/95 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-[13px] text-[#14171f] shadow-[0_8px_30px_rgba(20,24,32,0.08)] flex items-center gap-2.5 font-medium w-fit max-w-[calc(100vw-2rem)] sm:max-w-[92vw] num`}
          >
            <span className="w-2 h-2 rounded-full shrink-0 bg-[#14171f]/80 radar-pulse-white" />
            <span className="leading-snug sm:whitespace-nowrap truncate">{searchNotification}</span>
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
          <Footer
            isStandalonePage={true}
            onOpenOrderLookup={openOrderLookup}
            onOpenDashboard={openDashboard}
          />
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
            onApplyDates={(rangeText, _totalDays, startStr, endStr) => {
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
            onAddToCart={handleAddToCart}
            initialStartDate={rentalDates.startDate}
            initialEndDate={rentalDates.endDate}
            onOpenCalendar={openCalendarModal}
            onOpenGuestLookup={openOrderLookup}
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
            onOpenGuestLookup={openOrderLookup}
            onCheckoutSuccess={() => {
              setSearchNotification('Đã xác nhận giữ chỗ giỏ hàng 15 phút thành công!');
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
            initialTab={accountInitialTab}
            onChangeTier={(tier) => {
              setMembershipTier(tier);
              setSearchNotification(`Đã cập nhật tài khoản: ${tier === 'PLATINUM' ? 'Bạch Kim (-15% cọc)' : tier === 'GOLD' ? 'Hạng Vàng (-10% cọc)' : tier === 'SILVER' ? 'Hạng Bạc (-5% cọc)' : 'Hạng Đồng'}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* REFUJI AUTHENTICATION & ORDER LOOKUP MODAL POPUP (Đăng nhập ⇋ Tạo tài khoản ⇋ Tra cứu đơn) */}
      <AuthModal />

      {/* Tính năng: Thanh Toast bo tròn 1 dòng giống thanh Home NavigationBar & tự động ẩn sau đúng 5 giây */}
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
              activeReservation ? 'bottom-36 md:bottom-20' : 'bottom-20 md:bottom-6'
            } right-4 sm:right-6 z-[140] crystal-liquid-glass border border-[#14171f]/10 bg-white/95 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-[13px] text-[#14171f] shadow-[0_8px_30px_rgba(20,24,32,0.08)] flex items-center gap-2.5 font-medium w-fit max-w-[calc(100vw-2rem)] sm:max-w-[92vw] num ${
              activeReservation && (toast.message.includes('giữ chỗ') || toast.message.includes('Serial'))
                ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-50/50'
                : ''
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                toast.type === 'error'
                  ? 'bg-rose-500'
                  : toast.type === 'info'
                  ? 'bg-blue-500'
                  : 'bg-emerald-500'
              } radar-pulse-white`}
            />
            <span className="leading-snug sm:whitespace-nowrap truncate">{toast.message}</span>
            {activeReservation && (toast.message.includes('giữ chỗ') || toast.message.includes('Serial')) && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
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
          onCancelHold={handleCancelActiveReservation}
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
          isGuest={activeReservation.isGuest}
          guestPhone={activeReservation.guestPhone}
          onCancelHold={handleCancelActiveReservation}
          onPaymentSuccess={() => {
            setActiveReservation(null);
            try {
              localStorage.removeItem('refuji_active_reservation');
              window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
            } catch (_) {}
            setIsReservationModalOpen(false);
            setSearchNotification(`Đã cập nhật thanh toán cho đơn #${activeReservation.orderCode}!`);
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
