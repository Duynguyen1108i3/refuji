import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

// Apple iOS / macOS Transition Motion Physics
const appleTabVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 32 : -32,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      x: { type: 'spring', stiffness: 440, damping: 35, mass: 0.75 },
      opacity: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      filter: { duration: 0.16 },
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -32 : 32,
    opacity: 0,
    filter: 'blur(4px)',
    transition: {
      x: { type: 'spring', stiffness: 440, damping: 35, mass: 0.75 },
      opacity: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
      filter: { duration: 0.14 },
    },
  }),
};

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, modalMode, setModalMode, pendingIntent } = useAuth();

  // State nhận email chuyển tiếp từ Form Đăng ký sang Form Đăng nhập
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState<string | null>(null);

  // Quản lý hướng chuyển động chuẩn Apple (1 = sang phải/tạo tài khoản, -1 = sang trái/đăng nhập)
  const [authDirection, setAuthDirection] = useState<number>(1);

  const authModeIndexMap: Record<'login' | 'register' | 'forgot-password', number> = {
    'login': 0,
    'register': 1,
    'forgot-password': 2,
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'forgot-password') => {
    if (newMode === modalMode) return;
    const oldIdx = authModeIndexMap[modalMode];
    const newIdx = authModeIndexMap[newMode];
    setAuthDirection(newIdx > oldIdx ? 1 : -1);
    setModalMode(newMode);
    try {
      sessionStorage.setItem('refuji_auth_modal_mode', newMode);
      window.history.replaceState(null, '', `#${newMode}`);
    } catch (_) {}
  };

  // Xóa thông báo đăng ký khi người dùng chủ động đổi tab hoặc mở lại modal
  useEffect(() => {
    if (modalMode !== 'login') {
      setRegistrationSuccessMsg(null);
    }
  }, [modalMode]);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setRegistrationSuccessMsg(null);
      setRegisteredEmail('');
    }
  }, [isAuthModalOpen]);

  // Phím tắt ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  // Xử lý sau khi Đăng ký thành công: Tự động chuyển qua tab Đăng nhập và điền email
  const handleRegisterSuccess = (email: string) => {
    setRegisteredEmail(email);
    setRegistrationSuccessMsg('Đăng ký tài khoản thành công! Email đã được điền sẵn, vui lòng nhập mật khẩu để đăng nhập.');
    handleSwitchMode('login');
  };

  return (
    <AnimatePresence>
      <motion.div
        key="refuji-auth-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-[#14171f]/45 backdrop-blur-xl select-none"
        onClick={closeAuthModal}
      >
        {/* Khung Hộp thoại Modal Container - Chuẩn kích thước cố định như iOS / macOS Sheet */}
        <motion.div
          key="refuji-auth-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 34,
            mass: 0.8,
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[500px] h-[670px] max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-[0_24px_70px_rgba(20,24,32,0.18)] border border-[#14171f]/10 text-[#14171f] overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="refuji-auth-title"
        >
          {/* Nút đóng tròn phong cách Apple */}
          <button
            onClick={closeAuthModal}
            aria-label="Đóng cửa sổ"
            className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-all cursor-pointer active:scale-90 text-[#6e7587] hover:text-[#14171f]"
          >
            <X size={16} />
          </button>

          {/* 1. Header Thanh tiêu đề: Logo & Nút đóng - Cố định ở đầu khung modal */}
          <div className="flex items-center justify-between px-6 sm:px-7 pt-5 pb-3 border-b border-[#14171f]/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl tracking-[0.14em] font-medium text-[#14171f]">
                REFUJI
              </span>
            </div>
          </div>

          {/* Banner Giữ chỗ thiết bị dở dang (Intent Continuation) */}
          {pendingIntent && (
            <div className="px-6 sm:px-7 py-3 border-b border-amber-200 bg-amber-50/90 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Camera size={16} />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-amber-950">
                  Đang giữ yêu cầu thuê: {pendingIntent.modelName}
                </p>
                <p className="text-amber-800/80 text-[11px]">
                  Đăng nhập để giữ chỗ 15 phút mà không cần chọn lại ngày nhận/trả.
                </p>
              </div>
            </div>
          )}

          {/* 2. Thanh Tab chuyển đổi phân hệ Đăng nhập / Tạo tài khoản - Chuẩn Scrubber Home / Account */}
          {modalMode !== 'forgot-password' && (
            <div className="px-6 sm:px-7 pt-4 pb-1 shrink-0">
              <div className="relative isolate select-none flex items-center justify-center bg-white border border-[#14171f]/10 shadow-[0_4px_20px_rgba(20,24,32,0.06)] rounded-full p-1.5 gap-1">
                {[
                  { id: 'login' as const, label: 'Đăng nhập' },
                  { id: 'register' as const, label: 'Tạo tài khoản mới' },
                ].map((tab) => {
                  const isActive = modalMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSwitchMode(tab.id)}
                      className={`relative z-10 flex-1 flex items-center justify-center py-2 sm:py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer select-none active:scale-95 focus:outline-none whitespace-nowrap ${
                        isActive ? 'text-[#14171f] font-bold' : 'text-[#5a6070] hover:text-[#14171f]'
                      }`}
                    >
                      {/* Active Fluid Slider Lens (Framer Motion Spring Physics chuẩn Thanh Home) */}
                      {isActive && (
                        <motion.div
                          layoutId="active-auth-tab-pill"
                          transition={{
                            type: 'spring',
                            stiffness: 450,
                            damping: 32,
                            mass: 0.8,
                          }}
                          className="absolute inset-0 rounded-full -z-10 crystal-liquid-lens"
                        />
                      )}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. VÙNG NỘI DUNG CUỘN LINH HOẠT - Directional Spring Motion chuẩn iOS/macOS không co giật khung */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 sm:px-7 py-3 relative scrollbar-thin">
            <AnimatePresence mode="popLayout" custom={authDirection} initial={false}>
              <motion.div
                key={modalMode}
                custom={authDirection}
                variants={appleTabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full min-h-full flex flex-col justify-between"
              >
                <div>
                  {/* Tiêu đề & Mô tả canh giữa thẩm mỹ */}
                  <div className="space-y-1.5 text-center py-2 mb-2">
                    <h2
                      id="refuji-auth-title"
                      className="font-serif text-2xl sm:text-[26px] font-medium tracking-tight text-center text-[#14171f]"
                    >
                      {modalMode === 'login' && 'Chào mừng bạn trở lại'}
                      {modalMode === 'register' && 'Tạo tài khoản ReFuji'}
                      {modalMode === 'forgot-password' && 'Khôi phục mật khẩu'}
                    </h2>
                    <p className="text-xs text-[#6e7587] leading-relaxed text-center max-w-sm mx-auto">
                      {modalMode === 'login' &&
                        'Đăng nhập để đặt lịch thuê máy, quản lý đơn hàng và tích lũy hạng thành viên.'}
                      {modalMode === 'register' &&
                        'Đăng ký để nhận ngay đặc quyền Hạng Đồng (BRONZE) và tự động tích lũy thăng hạng khi hoàn thành đơn thuê.'}
                      {modalMode === 'forgot-password' &&
                        'Nhập email đã đăng ký của bạn để nhận liên kết xác thực đặt lại mật khẩu an toàn.'}
                    </p>
                  </div>

                  {/* Form tương ứng theo Single Responsibility Principle */}
                  {modalMode === 'login' && (
                    <LoginForm
                      initialEmail={registeredEmail}
                      registrationSuccessMsg={registrationSuccessMsg}
                      onSwitchToRegister={() => handleSwitchMode('register')}
                      onSwitchToForgot={() => handleSwitchMode('forgot-password')}
                    />
                  )}

                  {modalMode === 'register' && (
                    <RegisterForm
                      onSuccess={handleRegisterSuccess}
                      onSwitchToLogin={() => handleSwitchMode('login')}
                    />
                  )}

                  {modalMode === 'forgot-password' && (
                    <ForgotPasswordForm onBackToLogin={() => handleSwitchMode('login')} />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 4. Chân Modal - Cố định ở đáy chuẩn macOS Sheet Footer */}
          <div className="px-6 sm:px-7 py-3.5 border-t border-[#14171f]/10 bg-white/95 backdrop-blur-md shrink-0 flex items-center justify-between text-[11px] text-[#6e7587]">
            <span>Hệ thống quản lý &amp; cho thuê ReFuji</span>
            <span className="font-mono text-neutral-400">Bảo mật SSL 256-bit</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
