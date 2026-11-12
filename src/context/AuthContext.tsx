import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserAccount,
  MembershipTierType,
  PendingRentalIntent,
  LoginFormData,
  RegisterFormData,
  loginUser,
  registerUser,
  requestForgotPassword,
  getCurrentUserProfile,
  logoutUser,
  createRentalOrder,
  refreshAuthSession,
  getSavedUserFromStorage,
} from '../services/authApi';
import { clearGuestCartStorage } from '../services/cartApi';

export type AuthModalMode = 'login' | 'register' | 'forgot-password' | 'guest-lookup';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  tierBadge?: MembershipTierType;
}

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoadingUser: boolean;
  isAuthReady: boolean;
  isResolvingCartIntent: boolean;
  loginRevision: number;
  isAuthModalOpen: boolean;
  modalMode: AuthModalMode;
  pendingIntent: PendingRentalIntent | null;
  toast: ToastNotification | null;
  openAuthModal: (mode?: AuthModalMode, intent?: PendingRentalIntent | null) => void;
  closeAuthModal: () => void;
  setModalMode: (mode: AuthModalMode) => void;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<UserAccount>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setToast: (toast: ToastNotification | null) => void;
  clearPendingIntent: () => void;
  executePendingIntent: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isDashboardUrlActive = (): boolean => {
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

// Khởi tạo trạng thái Modal Xác thực từ URL hash hoặc sessionStorage để khi F5 / Reload không bị văng ra trang chủ
const getInitialAuthModalState = (): { isOpen: boolean; mode: AuthModalMode } => {
  if (typeof window === 'undefined') return { isOpen: false, mode: 'login' };

  // NẾU ĐÃ ĐĂNG NHẬP: TUYỆT ĐỐI KHÔNG TỰ ĐỘNG BẬT MODAL LOGIN/REGISTER KHI RELOAD TRANG
  const savedUser = localStorage.getItem('refuji_auth_user');
  if (savedUser) {
    try {
      sessionStorage.removeItem('refuji_auth_modal_open');
      sessionStorage.removeItem('refuji_auth_modal_mode');
    } catch (_) {}
    return { isOpen: false, mode: 'login' };
  }

  const hash = window.location.hash.replace('#', '');
  const savedOpen = sessionStorage.getItem('refuji_auth_modal_open') === 'true';
  const savedMode = (sessionStorage.getItem('refuji_auth_modal_mode') as AuthModalMode) || 'login';

  if (hash === 'login' || hash === 'dang-nhap') {
    return { isOpen: true, mode: 'login' };
  }
  if (hash === 'register' || hash === 'dang-ky') {
    return { isOpen: true, mode: 'register' };
  }
  if (hash === 'forgot-password' || hash === 'quen-mat-khau') {
    return { isOpen: true, mode: 'forgot-password' };
  }
  if (hash === 'lookup' || hash === 'tra-cuu-don') {
    return { isOpen: true, mode: 'guest-lookup' };
  }
  if (hash === 'auth') {
    return { isOpen: true, mode: savedMode };
  }
  if (savedOpen) {
    return { isOpen: true, mode: savedMode };
  }
  return { isOpen: false, mode: 'login' };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(() => getSavedUserFromStorage());
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isResolvingCartIntent, setIsResolvingCartIntent] = useState(false);
  const [loginRevision, setLoginRevision] = useState(0);
  const initialAuthState = getInitialAuthModalState();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(initialAuthState.isOpen);
  const [modalMode, setModalMode] = useState<AuthModalMode>(initialAuthState.mode);
  const [pendingIntent, setPendingIntent] = useState<PendingRentalIntent | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Tính năng: Tự động ẩn toàn bộ thông báo Toast (kể cả qua setToast hoặc showToast) sau đúng 5 giây
  useEffect(() => {
    if (!toast) return;
    const toastId = toast.id;
    const timer = setTimeout(() => {
      setToast((current) => (current?.id === toastId ? null : current));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Helper to show toast (auto-dismiss handled globally in 5s)
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', tierBadge?: MembershipTierType) => {
    const id = Date.now().toString();
    setToast({ id, message, type, tierBadge });
  }, []);

  // Tự động khôi phục phiên làm việc (Silent Refresh) từ HttpOnly Cookie khi tải lại trang (F5/Reload)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingUser(true);

    refreshAuthSession()
      .then((res) => {
        if (isMounted) {
          if (res) {
            setUser(res.user);
          } else {
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingUser(false);
          setIsAuthReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Khóa cuộn trang nền khi modal mở (body scroll lock)
  useEffect(() => {
    if (isAuthModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAuthModalOpen]);

  // Khi có user đăng nhập: Tự động đóng modal xác thực và xóa sạch cờ sessionStorage
  useEffect(() => {
    if (user) {
      setIsAuthModalOpen(false);
      try {
        sessionStorage.removeItem('refuji_auth_modal_open');
        sessionStorage.removeItem('refuji_auth_modal_mode');
        if (!isDashboardUrlActive()) {
          const hash = window.location.hash.replace('#', '');
          if (hash === 'login' || hash === 'register' || hash === 'forgot-password' || hash === 'auth' || hash === 'lookup' || hash === 'tra-cuu-don') {
            const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
            window.history.replaceState(null, '', `#${returnSec}`);
          }
        }
      } catch (_) {}
    }
  }, [user]);

  const openAuthModal = useCallback((mode: AuthModalMode = 'login', intent: PendingRentalIntent | null = null) => {
    if (user) return; // Nếu đã có tài khoản đăng nhập thì không mở modal đăng nhập
    setModalMode(mode);
    setPendingIntent(intent ?? null);
    setIsAuthModalOpen(true);
    try {
      sessionStorage.setItem('refuji_auth_modal_open', 'true');
      sessionStorage.setItem('refuji_auth_modal_mode', mode);
      if (!isDashboardUrlActive()) {
        window.history.replaceState(null, '', `#${mode === 'guest-lookup' ? 'lookup' : mode}`);
      }
    } catch (_) {}
  }, [user]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingIntent(null);
    try {
      sessionStorage.removeItem('refuji_auth_modal_open');
      sessionStorage.removeItem('refuji_auth_modal_mode');
      if (!isDashboardUrlActive()) {
        const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
        window.history.replaceState(null, '', `#${returnSec}`);
      }
    } catch (_) {}
  }, []);

  // Lắng nghe thay đổi hash trên trình duyệt để mở modal tương ứng
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'login' || hash === 'register' || hash === 'forgot-password' || hash === 'lookup' || hash === 'tra-cuu-don') {
        if (user) return; // Đã đăng nhập thì bỏ qua
        const nextMode: AuthModalMode = (hash === 'lookup' || hash === 'tra-cuu-don') ? 'guest-lookup' : (hash as AuthModalMode);
        setModalMode(nextMode);
        setIsAuthModalOpen(true);
        sessionStorage.setItem('refuji_auth_modal_open', 'true');
        sessionStorage.setItem('refuji_auth_modal_mode', nextMode);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const clearPendingIntent = useCallback(() => {
    setPendingIntent(null);
  }, []);

  // Thực thi hành động thuê dở dang sau khi đăng nhập thành công
  const executePendingIntent = useCallback(async (): Promise<boolean> => {
    if (!pendingIntent) return false;

    try {
      const intent = pendingIntent;
      const currentUserId = user?.id || Date.now();
      const orderResult = await createRentalOrder(intent, currentUserId);

      if (intent.source === 'CART') {
        clearGuestCartStorage();
      }

      showToast(
        `Giữ chỗ 15 phút thành công cho ${intent.modelName}! Mã đơn: ${orderResult.orderId} (Hết hạn: ${orderResult.holdDeadline})`,
        'success',
        user?.membership_tier
      );

      setPendingIntent(null);
      return true;
    } catch (err: any) {
      showToast(err.message || 'Không thể tiếp tục đặt thuê tự động', 'error');
      return false;
    }
  }, [pendingIntent, user, showToast]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setUser(profile);
      }
    } catch (_) {}
  }, []);

  const login = useCallback(
    async (data: LoginFormData) => {
      setIsLoadingUser(true);
      const intentAtLogin = pendingIntent;
      const isCartIntent = intentAtLogin?.source === 'CART';

      try {
        const result = await loginUser(data);
        if (isCartIntent) {
          // Chặn useCart gộp giỏ vãng lai trong lúc đang tự động chốt đơn từ giỏ hàng
          setIsResolvingCartIntent(true);
        }
        setLoginRevision((prev) => prev + 1);
        setIsAuthReady(true);
        setUser(result.user);
        setIsAuthModalOpen(false);
        try {
          sessionStorage.removeItem('refuji_auth_modal_open');
          sessionStorage.removeItem('refuji_auth_modal_mode');
          const curHash = window.location.hash.replace('#', '').toLowerCase();
          if (
            !isDashboardUrlActive() &&
            ['login', 'register', 'forgot-password', 'auth', 'lookup', 'tra-cuu-don', 'dang-nhap', 'dang-ky'].includes(curHash)
          ) {
            const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
            window.history.replaceState(null, '', `#${returnSec}`);
          }
        } catch (_) {}

        showToast(
          `Chào mừng bạn trở lại, ${result.user.full_name}! (Hạng thành viên: ${result.user.membership_tier})`,
          'success',
          result.user.membership_tier
        );

        // Tính năng: Tiếp tục đặt giữ chỗ 15p (áp dụng hạng thành viên & cập nhật widget đếm ngược) sau khi đăng nhập
        if (intentAtLogin) {
          setTimeout(async () => {
            try {
              const orderResult = await createRentalOrder(intentAtLogin, result.user.id);
              if (intentAtLogin.source === 'CART') {
                // Giỏ vãng lai đã tạo đơn thành công -> xóa giỏ vãng lai để không lặp lại vào DB cart
                clearGuestCartStorage();
              }
              const deadlineTime = orderResult.payment_deadline
                ? new Date(orderResult.payment_deadline).getTime()
                : Date.now() + 15 * 60 * 1000;
              const serverRent = orderResult.totalRent ?? intentAtLogin.totalRent;
              const serverDeposit = orderResult.depositAmount ?? intentAtLogin.depositRate;
              const reservationData = {
                orderCode: orderResult.orderId,
                modelName: intentAtLogin.modelName,
                items: intentAtLogin.items || [],
                assignedSerials: orderResult.assignedSerials || [],
                startDate: intentAtLogin.startDate,
                expectedReturnDate: intentAtLogin.expectedReturnDate,
                days: intentAtLogin.days,
                totalRent: serverRent,
                depositAmount: serverDeposit,
                totalDue: serverRent + serverDeposit,
                createdAt: Date.now(),
                paymentDeadline: orderResult.payment_deadline || new Date(deadlineTime).toISOString(),
                expiresAt: deadlineTime,
              };
              try {
                localStorage.setItem('refuji_active_reservation', JSON.stringify(reservationData));
                window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: reservationData }));
                window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
              } catch (_) {}
              showToast(
                `Đã tự động đặt giữ chỗ 15 phút cho ${intentAtLogin.modelName}! Mã đơn: ${orderResult.orderId}`,
                'success',
                result.user.membership_tier
              );
            } catch (e: any) {
              showToast(e?.message || 'Lỗi khi tiếp tục luồng đặt thuê', 'error');
            } finally {
              setPendingIntent(null);
              if (isCartIntent) {
                setIsResolvingCartIntent(false);
              }
            }
          }, 400);
        }
      } catch (err) {
        if (isCartIntent) {
          setIsResolvingCartIntent(false);
        }
        throw err;
      } finally {
        setIsLoadingUser(false);
      }
    },
    [pendingIntent, showToast]
  );

  const register = useCallback(
    async (data: RegisterFormData): Promise<UserAccount> => {
      setIsLoadingUser(true);
      try {
        const result = await registerUser(data);
        // Lưu ý theo yêu cầu quy trình: Không tự động đóng popup ngay
        // mà để Form Đăng ký chuyển sang Form Đăng nhập và tự động điền email
        showToast(
          `Đăng ký thành công! Vui lòng nhập mật khẩu để đăng nhập.`,
          'success',
          result.user.membership_tier
        );
        return result.user;
      } finally {
        setIsLoadingUser(false);
      }
    },
    [showToast]
  );

  const forgotPassword = useCallback(async (email: string) => {
    return await requestForgotPassword({ email });
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setPendingIntent(null);
    setIsResolvingCartIntent(false);
    try {
      // Chỉ xóa giỏ local khi chủ động đăng xuất, KHÔNG xóa giỏ hàng đã lưu trên DB của tài khoản
      clearGuestCartStorage();

      // Tránh rò rỉ widget giữ chỗ 15 phút của tài khoản vừa đăng xuất sang khách vãng lai / tài khoản khác
      const rawRes = localStorage.getItem('refuji_active_reservation');
      if (rawRes) {
        try {
          const parsedRes = JSON.parse(rawRes);
          if (!parsedRes?.isGuest) {
            localStorage.removeItem('refuji_active_reservation');
            window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
          }
        } catch (_) {
          localStorage.removeItem('refuji_active_reservation');
          window.dispatchEvent(new CustomEvent('refuji_reservation_updated', { detail: null }));
        }
      }

      window.dispatchEvent(new CustomEvent('refuji_cart_clear'));
    } catch (_) {}
    showToast('Bạn đã đăng xuất tài khoản an toàn.', 'info');
  }, [showToast]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoadingUser,
    isAuthReady,
    isResolvingCartIntent,
    loginRevision,
    isAuthModalOpen,
    modalMode,
    pendingIntent,
    toast,
    openAuthModal,
    closeAuthModal,
    setModalMode,
    login,
    register,
    forgotPassword,
    logout,
    refreshProfile,
    setToast,
    clearPendingIntent,
    executePendingIntent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
