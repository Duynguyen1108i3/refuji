import React, { useState } from 'react';
import { AuthLayout } from '../../layouts/AuthLayout.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsent) {
      setError('Bạn bắt buộc phải đồng ý với Điều khoản xử lý dữ liệu cá nhân theo Nghị định BVDLCN 2025');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }
    setError(null);
    window.location.href = '/login';
  };

  return (
    <AuthLayout
      title="TẠO TÀI KHOẢN MỚI"
      subtitle="Đăng ký tài khoản để bắt đầu trải nghiệm dịch vụ cho thuê máy ảnh Fujifilm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Số điện thoại di động"
          placeholder="0901234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Input
          label="Mật khẩu (Tối thiểu 8 ký tự)"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Xác nhận lại mật khẩu"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Mandatory Privacy Consent Checkbox (Law on Protection of Personal Data 2025) */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 mt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              className="mt-0.5 rounded border-white/30 text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-zinc-900"
              required
            />
            <span className="leading-relaxed">
              Tôi đồng ý cho phép <strong>REFUJI</strong> thu thập, mã hóa và xử lý dữ liệu căn cước công dân (CCCD) cho mục đích bàn giao và bảo đảm tài sản theo đúng quy định của <strong>Nghị định Bảo vệ Dữ liệu Cá nhân 2025</strong>.
            </span>
          </label>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2 font-bold">
          Đăng ký tài khoản
        </Button>

        <p className="text-xs text-center text-zinc-400 mt-2">
          Đã có tài khoản?{' '}
          <a href="/login" className="text-emerald-400 hover:underline font-semibold">
            Đăng nhập ngay
          </a>
        </p>
      </form>
    </AuthLayout>
  );
};
