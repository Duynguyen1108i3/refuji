import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { registerSchema, RegisterFormData } from '../../schemas/auth.schema';
import { useAuth } from '../../context/AuthContext';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface RegisterFormProps {
  onSuccess: (registeredEmail: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    privacy_consent: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    const result = registerSchema.safeParse(formData);
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
      await register(result.data);
      // Quy trình mượt mà: Thông báo thành công -> Chuyển sang form Đăng nhập và dán sẵn Email
      onSuccess(result.data.email);
    } catch (err: any) {
      setApiError(err.message || 'Đăng ký tài khoản không thành công');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Lỗi phản hồi từ Backend */}
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

      <form onSubmit={handleSubmit} className="space-y-3.5 pt-1" noValidate>
        {/* Field: Họ và tên */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[var(--refuji-text-secondary)]">
            Họ và tên đầy đủ <span className="text-[var(--refuji-accent-rose)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--refuji-text-muted)]">
              <User size={16} />
            </span>
            <input
              type="text"
              id="register-fullname"
              name="name"
              autoComplete="name"
              required
              placeholder="Nguyễn Văn A (theo Căn cước)"
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                if (errors.full_name) setErrors((prev) => ({ ...prev, full_name: '' }));
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl outline-none transition-all placeholder:text-[var(--refuji-input-placeholder)]"
              style={{
                backgroundColor: 'var(--refuji-input-bg)',
                color: 'var(--refuji-text-primary)',
                border: `1px solid ${
                  errors.full_name ? 'var(--refuji-accent-rose)' : 'var(--refuji-input-border)'
                }`,
              }}
            />
          </div>
          {errors.full_name && (
            <p className="text-[11px] font-medium text-[var(--refuji-accent-rose)] flex items-center gap-1">
              <span>•</span> {errors.full_name}
            </p>
          )}
        </div>

        {/* Field: Email */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[var(--refuji-text-secondary)]">
            Địa chỉ Email <span className="text-[var(--refuji-accent-rose)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--refuji-text-muted)]">
              <Mail size={16} />
            </span>
            <input
              type="email"
              id="register-email"
              name="email"
              autoComplete="email"
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

        {/* Field: Số điện thoại */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[var(--refuji-text-secondary)]">
            Số điện thoại <span className="text-[var(--refuji-accent-rose)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--refuji-text-muted)]">
              <Phone size={16} />
            </span>
            <input
              type="tel"
              id="register-phone"
              name="tel"
              autoComplete="tel"
              required
              placeholder="0901234567 (10 chữ số)"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl outline-none transition-all placeholder:text-[var(--refuji-input-placeholder)]"
              style={{
                backgroundColor: 'var(--refuji-input-bg)',
                color: 'var(--refuji-text-primary)',
                border: `1px solid ${
                  errors.phone ? 'var(--refuji-accent-rose)' : 'var(--refuji-input-border)'
                }`,
              }}
            />
          </div>
          {errors.phone && (
            <p className="text-[11px] font-medium text-[var(--refuji-accent-rose)] flex items-center gap-1">
              <span>•</span> {errors.phone}
            </p>
          )}
        </div>

        {/* Field: Mật khẩu */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[var(--refuji-text-secondary)]">
            Mật khẩu bảo mật <span className="text-[var(--refuji-accent-rose)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--refuji-text-muted)]">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              id="register-password"
              name="new-password"
              autoComplete="new-password"
              required
              placeholder="Tối thiểu 8 ký tự, gồm hoa, thường, số, ký tự đặc biệt"
              value={formData.password}
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

          <PasswordStrengthMeter password={formData.password} />

          {errors.password && (
            <p className="text-[11px] font-medium text-[var(--refuji-accent-rose)] flex items-center gap-1 pt-1">
              <span>•</span> {errors.password}
            </p>
          )}
        </div>

        {/* Field: Xác nhận mật khẩu */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[var(--refuji-text-secondary)]">
            Xác nhận lại mật khẩu <span className="text-[var(--refuji-accent-rose)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--refuji-text-muted)]">
              <Lock size={16} />
            </span>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="register-confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              required
              placeholder="Nhập lại chính xác mật khẩu"
              value={formData.confirm_password}
              onChange={(e) => {
                setFormData({ ...formData, confirm_password: e.target.value });
                if (errors.confirm_password)
                  setErrors((prev) => ({ ...prev, confirm_password: '' }));
              }}
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl outline-none transition-all placeholder:text-[var(--refuji-input-placeholder)]"
              style={{
                backgroundColor: 'var(--refuji-input-bg)',
                color: 'var(--refuji-text-primary)',
                border: `1px solid ${
                  errors.confirm_password
                    ? 'var(--refuji-accent-rose)'
                    : 'var(--refuji-input-border)'
                }`,
              }}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--refuji-text-muted)] hover:text-[var(--refuji-text-primary)] cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-[11px] font-medium text-[var(--refuji-accent-rose)] flex items-center gap-1">
              <span>•</span> {errors.confirm_password}
            </p>
          )}
        </div>

        {/* Checkbox bắt buộc: Luật Bảo vệ DLCN 2025 */}
        <div
          className="p-3.5 rounded-2xl border space-y-2"
          style={{
            backgroundColor: 'var(--refuji-input-bg)',
            borderColor: errors.privacy_consent
              ? 'var(--refuji-accent-rose)'
              : 'var(--refuji-modal-border-light)',
          }}
        >
          <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed select-none">
            <input
              type="checkbox"
              required
              checked={formData.privacy_consent}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  privacy_consent: e.target.checked,
                });
                if (errors.privacy_consent)
                  setErrors((prev) => ({ ...prev, privacy_consent: '' }));
              }}
              className="w-4 h-4 rounded accent-[#14171f] mt-0.5 shrink-0 cursor-pointer"
            />
            <span className="text-[var(--refuji-text-secondary)]">
              Tôi đã đọc, hiểu rõ và tự nguyện đồng ý với{' '}
              <span className="font-semibold underline text-[var(--refuji-text-primary)]">
                Chính sách xử lý & Bảo vệ Dữ liệu Cá nhân của ReFuji
              </span>{' '}
              theo quy định của Luật Bảo vệ DLCN 2025.
            </span>
          </label>

          <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--refuji-text-muted)] pl-6">
            <ShieldCheck size={13} className="text-[var(--refuji-accent-emerald)] shrink-0" />
            <span>
              Dữ liệu Căn cước được mã hóa AES-256-GCM và không chia sẻ cho bên thứ ba.
            </span>
          </div>

          {errors.privacy_consent && (
            <p className="text-[11px] font-medium text-[var(--refuji-accent-rose)] pl-6">
              {errors.privacy_consent}
            </p>
          )}
        </div>

        {/* Nút Đăng ký */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.privacy_consent}
          className="w-full py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--refuji-btn-primary-bg)',
            color: 'var(--refuji-btn-primary-text)',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Đăng ký thành viên ReFuji</span>
            </>
          )}
        </button>

        {/* Chuyển nhanh sang Đăng nhập */}
        <div className="pt-2 text-center">
          <p className="text-xs text-[var(--refuji-text-secondary)]">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold underline text-[var(--refuji-text-primary)] hover:opacity-80 transition-opacity cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
