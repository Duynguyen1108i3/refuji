import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  initialEmail?: string;
  registrationSuccessMsg?: string | null;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  initialEmail = '',
  registrationSuccessMsg = null,
  onSwitchToRegister,
  onSwitchToForgot,
}) => {
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: initialEmail,
    password: '',
    remember_me: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật lại email khi nhận từ luồng đăng ký thành công
  useEffect(() => {
    if (initialEmail) {
      setFormData((prev) => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'general';
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(result.data);
    } catch (err: any) {
      setApiError(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Thông báo chúc mừng khi vừa chuyển từ Đăng ký thành công sang */}
      {registrationSuccessMsg && (
        <div
          className="p-3.5 rounded-2xl flex items-start gap-2.5 text-xs border animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            backgroundColor: 'var(--refuji-accent-emerald-bg)',
            borderColor: 'var(--refuji-accent-emerald)',
            color: 'var(--refuji-accent-emerald)',
          }}
        >
          <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{registrationSuccessMsg}</span>
        </div>
      )}

      {/* Lỗi xác thực từ Server */}
      {apiError && (
        <div
          className="p-3 rounded-2xl flex items-start gap-2.5 text-xs border"
          style={{
            backgroundColor: 'var(--refuji-accent-rose-bg)',
            borderColor: 'var(--refuji-accent-rose)',
            color: 'var(--refuji-accent-rose)',
          }}
        >
          <span className="font-medium leading-relaxed">{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>
        {/* Field: Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--refuji-text-secondary)]">
            Địa chỉ Email <span className="text-[var(--refuji-accent-rose)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--refuji-text-muted)]">
              <Mail size={16} />
            </span>
            <input
              type="email"
              id="login-email"
              name="email"
              autoComplete="username"
              required
              placeholder="name@domain.vn"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl outline-none transition-all placeholder:text-[var(--refuji-input-placeholder)]"
              style={{
                backgroundColor: 'var(--refuji-input-bg)',
                color: 'var(--refuji-text-primary)',
                border: `1px solid ${
                  errors.email ? 'var(--refuji-accent-rose)' : 'var(--refuji-input-border)'
                }`,
              }}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] font-medium text-[var(--refuji-accent-rose)] flex items-center gap-1">
              <span>•</span> {errors.email}
            </p>
          )}
        </div>

        {/* Field: Mật khẩu */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--refuji-text-secondary)]">
            Mật khẩu <span className="text-[var(--refuji-accent-rose)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--refuji-text-muted)]">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              id="login-password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="Tối thiểu 8 ký tự"
              value={formData.password}
              autoFocus={!!initialEmail}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl outline-none transition-all placeholder:text-[var(--refuji-input-placeholder)]"
              style={{
                backgroundColor: 'var(--refuji-input-bg)',
                color: 'var(--refuji-text-primary)',
                border: `1px solid ${
                  errors.password ? 'var(--refuji-accent-rose)' : 'var(--refuji-input-border)'
                }`,
              }}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--refuji-text-muted)] hover:text-[var(--refuji-text-primary)] cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-medium text-[var(--refuji-accent-rose)] flex items-center gap-1">
              <span>•</span> {errors.password}
            </p>
          )}
        </div>

        {/* Tiện ích: Ghi nhớ đăng nhập + Quên mật khẩu */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--refuji-text-secondary)]">
            <input
              type="checkbox"
              checked={formData.remember_me}
              onChange={(e) => setFormData({ ...formData, remember_me: e.target.checked })}
              className="w-4 h-4 rounded accent-[#14171f] cursor-pointer"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <button
            type="button"
            onClick={onSwitchToForgot}
            className="font-semibold text-xs hover:underline text-[var(--refuji-text-primary)] cursor-pointer"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Nút Đăng nhập */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--refuji-btn-primary-bg)',
            color: 'var(--refuji-btn-primary-text)',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Chuyển nhanh sang Tạo tài khoản & Tài khoản thử nghiệm */}
        <div className="pt-2 text-center space-y-2">
          <p className="text-xs text-[var(--refuji-text-secondary)]">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold underline text-[var(--refuji-text-primary)] hover:opacity-80 transition-opacity cursor-pointer"
            >
              Tạo tài khoản mới
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
