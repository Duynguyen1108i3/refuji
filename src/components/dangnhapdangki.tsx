import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, ArrowRight, UserCheck, Trash2, ArrowLeft } from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  cccdVerified: boolean;
}

interface DangNhapDangKiProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const DangNhapDangKi: React.FC<DangNhapDangKiProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<Array<UserProfile & { password?: string }>>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existing: Array<UserProfile & { password?: string }> = JSON.parse(
        localStorage.getItem('refuji_registered_users') || '[]'
      );
      setSavedAccounts(existing);
      setSelectedEmail(null);
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getInitials = (fullName: string) => {
    const words = fullName.trim().split(' ');
    if (words.length >= 2) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    return (fullName.slice(0, 2) || 'RF').toUpperCase();
  };

  const handleSelectAccount = (acc: UserProfile) => {
    setSelectedEmail(acc.email);
    setEmail(acc.email);
    setPassword('');
    setError('');
  };

  const handleRemoveAccount = (e: React.MouseEvent, targetEmail: string) => {
    e.stopPropagation();
    const updated = savedAccounts.filter((acc) => acc.email !== targetEmail);
    setSavedAccounts(updated);
    localStorage.setItem('refuji_registered_users', JSON.stringify(updated));
    if (selectedEmail === targetEmail) {
      setSelectedEmail(null);
      setEmail('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetEmail = selectedEmail || email.trim();

    if (!targetEmail || !password.trim() || (!isLoginMode && !name.trim())) {
      setError('Vui lòng điền đầy đủ tất cả thông tin.');
      return;
    }

    const registeredUsers: Array<UserProfile & { password: string }> = JSON.parse(
      localStorage.getItem('refuji_registered_users') || '[]'
    );

    if (isLoginMode) {
      const foundUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === targetEmail.toLowerCase() && u.password === password
      );

      if (!foundUser) {
        setError('Mật khẩu không chính xác.');
        return;
      }

      const { password: _, ...profile } = foundUser;
      localStorage.setItem('refuji_current_user', JSON.stringify(profile));
      onSuccess(profile);
      onClose();
    } else {
      const isExist = registeredUsers.some(
        (u) => u.email.toLowerCase() === targetEmail.toLowerCase()
      );

      if (isExist) {
        setError('Email này đã được đăng ký trên hệ thống.');
        return;
      }

      const newUser: UserProfile = {
        name: name.trim(),
        email: targetEmail,
        tier: 'BRONZE',
        cccdVerified: true,
      };

      registeredUsers.push({ ...newUser, password });
      localStorage.setItem('refuji_registered_users', JSON.stringify(registeredUsers));
      localStorage.setItem('refuji_current_user', JSON.stringify(newUser));

      onSuccess(newUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 bg-[#0D1119] border border-white/10 rounded-2xl shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-lg transition"
        >
          <X size={18} />
        </button>

        <div className="mb-6 text-center relative">
          {selectedEmail && isLoginMode && (
            <button
              type="button"
              onClick={() => setSelectedEmail(null)}
              className="absolute left-0 top-1 text-white/60 hover:text-white flex items-center gap-1 text-xs"
            >
              <ArrowLeft size={16} />
              <span>Khác</span>
            </button>
          )}

          <h2 className="text-xl font-bold tracking-wide">
            {isLoginMode
              ? selectedEmail
                ? 'Nhập Mật Khẩu'
                : 'Đăng Nhập REFUJI'
              : 'Đăng Ký Tài Khoản'}
          </h2>
          <p className="text-xs text-white/50 mt-1">
            {isLoginMode
              ? selectedEmail
                ? `Chào mừng trở lại, ${savedAccounts.find((a) => a.email === selectedEmail)?.name || ''}`
                : 'Chọn tài khoản đã lưu hoặc nhập email mới'
              : 'Tạo tài khoản mới nhận hạng Đồng và ưu đãi giữ chỗ'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        {isLoginMode && !selectedEmail && savedAccounts.length > 0 && (
          <div className="mb-5">
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              Tài khoản đã đăng nhập trước đó
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {savedAccounts.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/30 hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold text-xs border border-white/10">
                      {getInitials(acc.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {acc.name}
                      </p>
                      <p className="text-xs text-white/40">{acc.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {acc.tier || 'BRONZE'}
                    </span>
                    <button
                      type="button"
                      title="Xóa tài khoản này khỏi máy"
                      onClick={(e) => handleRemoveAccount(e, acc.email)}
                      className="p-1.5 text-white/30 hover:text-red-400 transition rounded-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-[#0D1119] px-3 text-[11px] text-white/40 uppercase">
                Hoặc tài khoản khác
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-xs text-white/70 mb-1">Họ và tên</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-white/40" />
                <input
                  type="text"
                  placeholder="Nhập họ tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#161C2C] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>
            </div>
          )}

          {selectedEmail ? (
            <div className="p-3 bg-white/[0.05] border border-white/15 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCheck size={18} className="text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    {savedAccounts.find((a) => a.email === selectedEmail)?.name}
                  </p>
                  <p className="text-[11px] text-white/50">{selectedEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="text-[11px] text-white/50 hover:text-white underline"
              >
                Đổi
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-white/70 mb-1">Địa chỉ Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-white/40" />
                <input
                  type="email"
                  placeholder="name@refuji.stu.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#161C2C] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-white/70 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-white/40" />
              <input
                type="password"
                autoFocus={!!selectedEmail}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#161C2C] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-3 py-2.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-white/90 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {isLoginMode ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-white/60">
            {isLoginMode ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setSelectedEmail(null);
                setError('');
              }}
              className="text-white font-semibold underline underline-offset-4 hover:text-white/80"
            >
              {isLoginMode ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};