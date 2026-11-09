import React, { useState } from 'react';
import { AuthLayout } from '../../layouts/AuthLayout.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Email hoặc mật khẩu không chính xác');
      }

      if (data.accessToken) {
        localStorage.setItem('refuji_token', data.accessToken);
        localStorage.setItem('refuji_auth_user', JSON.stringify(data.user));
      }

      window.location.href = data.user?.role === 'STAFF' || data.user?.role === 'ADMIN' ? '/staff/dashboard' : '/';
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="ĐĂNG NHẬP"
      subtitle="Truy cập tài khoản để xem đơn thuê và hưởng đặc quyền hạng thành viên"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end mt-1">
            <a href="/forgot-password" className="text-xs text-zinc-400 hover:text-emerald-400">
              Quên mật khẩu?
            </a>
          </div>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2 font-bold" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
        </Button>

        <p className="text-xs text-center text-zinc-400 mt-4">
          Chưa có tài khoản?{' '}
          <a href="/register" className="text-emerald-400 hover:underline font-semibold">
            Đăng ký tài khoản mới
          </a>
        </p>
      </form>
    </AuthLayout>
  );
};
