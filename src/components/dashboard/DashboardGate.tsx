import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, ArrowLeft, Loader2, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  buildPopupFrameClass,
  POPUP_INNER_CLASS,
} from '../ui/popupTheme';

interface DashboardGateProps {
  onExitToStorefront: () => void;
}

export const DashboardGate: React.FC<DashboardGateProps> = ({ onExitToStorefront }) => {
  const { user, isAuthReady, isLoadingUser, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu tài khoản Quản trị / Nhân viên.');
      return;
    }
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-[#14171f] flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none">
      {/* Forest mist background echoing storefront Hero.tsx */}
      <div
        className="fixed inset-0 bg-cover bg-top bg-no-repeat z-0 opacity-45"
        style={{
          backgroundImage: `url('/assets/forest-clean.jpg')`,
          filter: 'grayscale(65%) contrast(106%) brightness(120%)',
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-white/75 via-white/90 to-white z-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 ${buildPopupFrameClass('max-w-lg', 'h-auto max-h-none')}`}
      >
        <div className={`${POPUP_INNER_CLASS} p-6 sm:p-9 space-y-6`}>
          {/* Top Brand */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-2xl sm:text-3xl tracking-[0.16em] text-[#14171f]">
                REFUJI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[10px] font-semibold uppercase tracking-widest text-[#4b5262]">
                Operations
              </span>
            </div>

            <button
              type="button"
              onClick={onExitToStorefront}
              className="glass-button px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Trang chủ</span>
            </button>
          </div>

          {!isAuthReady ? (
            <div className="py-14 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 size={28} className="animate-spin text-[#14171f]" />
              <p className="text-sm font-medium text-[#4b5262]">
                Đang xác thực phiên làm việc quản trị...
              </p>
            </div>
          ) : user && user.role !== 'ADMIN' && user.role !== 'STAFF' ? (
            <div className="space-y-5">
              <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Lock size={20} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-950 space-y-1">
                  <p className="font-bold">Tài khoản chưa được cấp quyền Vận hành / POS</p>
                  <p className="text-amber-900/90 leading-relaxed">
                    Bạn đang đăng nhập bằng tài khoản{' '}
                    <span className="font-semibold">{user.email}</span> (Vai trò:{' '}
                    <span className="font-semibold">{user.role}</span>). Phân hệ Quản trị chỉ mở
                    cho <span className="font-semibold">ADMIN</span> hoặc{' '}
                    <span className="font-semibold">STAFF</span>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onExitToStorefront}
                  className="flex-1 py-3 px-5 rounded-full bg-[#14171f] hover:bg-[#252a37] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={15} />
                  <span>Quay lại Cửa hàng</span>
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="py-3 px-5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất để đổi tài khoản</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.04] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e]">
                  <ShieldCheck size={13} className="text-[#14171f]" />
                  <span>Xác thực nội bộ RBAC</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#14171f]">
                  Đăng Nhập Quản Trị Studio
                </h1>
                <p className="text-xs sm:text-sm text-[#5a6072] leading-relaxed">
                  Vui lòng sử dụng tài khoản <strong className="text-[#14171f]">ADMIN</strong> hoặc{' '}
                  <strong className="text-[#14171f]">STAFF</strong> để quản lý Check-out, Quyết toán
                  Check-in, Kho Serial và Sổ cái tài chính.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 select-text">
                <div>
                  <label className="block text-xs font-semibold text-[#14171f] mb-1.5">
                    Email tài khoản quản trị
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="fuji@refuji.vn"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-full crystal-liquid-lens text-sm text-[#14171f] placeholder:text-[#8c93a4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14171f] mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-11 rounded-full crystal-liquid-lens text-sm text-[#14171f] placeholder:text-[#8c93a4] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#62687a] hover:text-[#14171f] cursor-pointer"
                      aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoadingUser}
                  className="w-full py-3.5 px-6 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-sm font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoadingUser ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Truy cập Dashboard Studio</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
