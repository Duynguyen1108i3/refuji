import React, { useState } from 'react';
import { AuthLayout } from '../../layouts/AuthLayout.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <AuthLayout
      title="KHÔI PHỤC MẬT KHẨU"
      subtitle="Nhập email đăng ký để nhận liên kết đặt lại mật khẩu bảo mật"
    >
      {isSent ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Đã gửi email khôi phục</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Liên kết đặt lại mật khẩu đã được gửi tới <strong>{email}</strong>. Vui lòng kiểm tra hòm thư (hoặc Mailpit local dev tại cổng 8025).
          </p>
          <a href="/login" className="text-xs text-emerald-400 hover:underline mt-2">
            Quay lại trang Đăng nhập
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Địa chỉ Email của bạn"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="lg" className="w-full mt-2 font-bold">
            Gửi email khôi phục
          </Button>
          <a href="/login" className="text-xs text-center text-zinc-400 hover:text-white mt-2">
            Nhớ mật khẩu? Quay lại đăng nhập
          </a>
        </form>
      )}
    </AuthLayout>
  );
};
