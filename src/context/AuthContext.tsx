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
  getAccessTokenInMemory,
  refreshAuthSession,
  getSavedUserFromStorage,
} from '../services/authApi';

export type AuthModalMode = 'login' | 'register' | 'forgot-password';

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
  const initialAuthState = getInitialAuthModalState();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(initialAuthState.isOpen);
  const [modalMode, setModalMode] = useState<AuthModalMode>(initialAuthState.mode);
  const [pendingIntent, setPendingIntent] = useState<PendingRentalIntent | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Helper to show toast with auto-dismiss
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', tierBadge?: MembershipTierType) => {
    const id = Date.now().toString();
    setToast({ id, message, type, tierBadge });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4500);
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
        const hash = window.location.hash.replace('#', '');
        if (hash === 'login' || hash === 'register' || hash === 'forgot-password' || hash === 'auth') {
          const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
          window.history.replaceState(null, '', `#${returnSec}`);
        }
      } catch (_) {}
    }
  }, [user]);

  const openAuthModal = useCallback((mode: AuthModalMode = 'login', intent: PendingRentalIntent | null = null) => {
    if (user) return; // Nếu đã có tài khoản đăng nhập thì không mở modal đăng nhập
    setModalMode(mode);
    if (intent) {
      setPendingIntent(intent);
    }
    setIsAuthModalOpen(true);
    try {
      sessionStorage.setItem('refuji_auth_modal_open', 'true');
      sessionStorage.setItem('refuji_auth_modal_mode', mode);
      window.history.replaceState(null, '', `#${mode}`);
    } catch (_) {}
  }, [user]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    try {
      sessionStorage.removeItem('refuji_auth_modal_open');
      sessionStorage.removeItem('refuji_auth_modal_mode');
      const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
      window.history.replaceState(null, '', `#${returnSec}`);
    } catch (_) {}
  }, []);

  // Lắng nghe thay đổi hash trên trình duyệt để mở modal tương ứng
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'login' || hash === 'register' || hash === 'forgot-password') {
        if (user) return; // Đã đăng nhập thì bỏ qua
        setModalMode(hash as AuthModalMode);
        setIsAuthModalOpen(true);
        sessionStorage.setItem('refuji_auth_modal_open', 'true');
        sessionStorage.setItem('refuji_auth_modal_mode', hash);
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
      try {
        const result = await loginUser(data);
        setUser(result.user);
        setIsAuthModalOpen(false);
        try {
          sessionStorage.removeItem('refuji_auth_modal_open');
          sessionStorage.removeItem('refuji_auth_modal_mode');
          const returnSec = sessionStorage.getItem('refuji_active_section') || 'explore';
          window.history.replaceState(null, '', `#${returnSec}`);
        } catch (_) {}

        showToast(
          `Chào mừng bạn trở lại, ${result.user.full_name}! (Hạng thành viên: ${result.user.membership_tier})`,
          'success',
          result.user.membership_tier
        );

        // Intent Continuation: Tiếp tục hành động thuê máy dở dang
        if (pendingIntent) {
          setTimeout(async () => {
            const currentIntent = pendingIntent;
            try {
              const orderResult = await createRentalOrder(currentIntent, result.user.id);
              showToast(
                `Đã tự động đặt giữ chỗ 15 phút cho ${currentIntent.modelName}! Mã đơn: ${orderResult.orderId}`,
                'success',
                result.user.membership_tier
              );
            } catch (e: any) {
              showToast('Lỗi khi tiếp tục luồng đặt thuê', 'error');
            } finally {
              setPendingIntent(null);
            }
          }, 400);
        }
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
    try {
      localStorage.removeItem('refuji_cart_items');
      localStorage.removeItem('refuji_cart_user_id');
      window.dispatchEvent(new CustomEvent('refuji_cart_clear'));
    } catch (_) {}
    showToast('Bạn đã đăng xuất tài khoản an toàn.', 'info');
  }, [showToast]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoadingUser,
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
