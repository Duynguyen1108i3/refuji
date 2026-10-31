import React, { useState } from 'react';
import { AuthLayout } from '../../layouts/AuthLayout.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and redirect
    window.location.href = '/';
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

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2 font-bold">
          Đăng nhập ngay
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
