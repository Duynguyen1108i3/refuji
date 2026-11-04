import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, Loader2, Clock, CheckCircle2, ChevronLeft } from 'lucide-react';
import { forgotPasswordSchema } from '../../schemas/auth.schema';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = window.setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setApiError(null);

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message || 'Email không hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
      setResendCooldown(60);
    } catch (err: any) {
      setApiError(err.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pt-1">
      <button
        type="button"
        onClick={onBackToLogin}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--refuji-text-secondary)] hover:text-[var(--refuji-text-primary)] transition-colors cursor-pointer mb-1"
      >
        <ChevronLeft size={16} />
        <span>Quay lại Đăng nhập</span>
      </button>

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

      {submitted ? (
        <div
          className="p-5 rounded-2xl border space-y-3 text-center"
          style={{
            backgroundColor: 'var(--refuji-input-bg)',
            borderColor: 'var(--refuji-modal-border-light)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{
              backgroundColor: 'var(--refuji-accent-emerald-bg)',
              color: 'var(--refuji-accent-emerald)',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-[var(--refuji-text-primary)]">
              Đã gửi email khôi phục!
            </h3>
            <p className="text-xs text-[var(--refuji-text-secondary)] leading-relaxed">
              Nếu địa chỉ <strong>{email}</strong> tồn tại trong hệ thống ReFuji, bạn sẽ nhận được
              hướng dẫn đặt lại mật khẩu trong ít phút.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              disabled={resendCooldown > 0 || isSubmitting}
              onClick={handleSubmit}
              className="w-full py-2.5 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: 'var(--refuji-modal-border)',
                color: 'var(--refuji-text-primary)',
              }}
            >
              <Clock size={14} />
              <span>
                {resendCooldown > 0
                  ? `Gửi lại sau (${resendCooldown}s)`
                  : 'Gửi lại email xác thực'}
              </span>
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs font-medium text-[var(--refuji-text-muted)] hover:text-[var(--refuji-text-primary)] underline cursor-pointer py-1"
            >
              Quay về màn hình Đăng nhập
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--refuji-text-secondary)]">
              Địa chỉ Email đã đăng ký <span className="text-[var(--refuji-accent-rose)]">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--refuji-text-muted)]">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="name@domain.vn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl outline-none transition-all placeholder:text-[var(--refuji-input-placeholder)]"
                style={{
                  backgroundColor: 'var(--refuji-input-bg)',
                  color: 'var(--refuji-text-primary)',
                  border: `1px solid ${
                    error ? 'var(--refuji-accent-rose)' : 'var(--refuji-input-border)'
                  }`,
                }}
              />
            </div>
            {error && (
              <p className="text-[11px] font-medium text-[var(--refuji-accent-rose)] flex items-center gap-1">
                <span>•</span> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
            style={{
              backgroundColor: 'var(--refuji-btn-primary-bg)',
              color: 'var(--refuji-btn-primary-text)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang gửi mã...</span>
              </>
            ) : (
              <>
                <span>Gửi liên kết đặt lại mật khẩu</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
