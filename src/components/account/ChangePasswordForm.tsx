import React, { useState } from 'react';
import { KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { changePasswordApi } from '../../services/authApi';

interface ChangePasswordFormProps {
  onCloseForm: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onCloseForm }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsChangingPass(true);
    try {
      const result = await changePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      setPasswordSuccess(result.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => onCloseForm(), 2500);
    } catch (err: any) {
      setPasswordError(err.message || 'Không thể đổi mật khẩu');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-neutral-50 border border-[#14171f]/15 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-[#14171f] border-b pb-2">
        <KeyRound size={14} />
        <span>Thay Đổi Mật Khẩu Đăng Nhập</span>
      </div>

      {passwordError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{passwordError}</span>
        </div>
      )}

      {passwordSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
          <span>{passwordSuccess}</span>
        </div>
      )}

      <div className="space-y-2.5 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">
            Mật khẩu hiện tại:
          </label>
          <div className="relative">
            <input
              type={showCurrentPass ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu đang dùng"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 focus:outline-none focus:border-[#14171f] text-xs pr-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPass(!showCurrentPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">
            Mật khẩu mới (tối thiểu 8 ký tự, có chữ hoa, thường, số &amp; ký tự đặc biệt):
          </label>
          <div className="relative">
            <input
              type={showNewPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 focus:outline-none focus:border-[#14171f] text-xs pr-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">
            Xác nhận mật khẩu mới:
          </label>
          <div className="relative">
            <input
              type={showConfirmPass ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 focus:outline-none focus:border-[#14171f] text-xs pr-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCloseForm}
            className="px-4 py-2 rounded-xl bg-neutral-200/80 hover:bg-neutral-300 font-medium text-xs text-neutral-700 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isChangingPass}
            className="px-5 py-2 rounded-xl bg-[#14171f] hover:bg-[#252a37] text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isChangingPass && <Loader2 size={13} className="animate-spin" />}
            <span>Lưu mật khẩu mới</span>
          </button>
        </div>
      </div>
    </form>
  );
};
