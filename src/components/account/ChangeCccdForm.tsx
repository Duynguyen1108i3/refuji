import React, { useState } from 'react';
import { CreditCard, ShieldAlert, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { updateCccdApi } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

interface ChangeCccdFormProps {
  onCloseForm: () => void;
}

export const ChangeCccdForm: React.FC<ChangeCccdFormProps> = ({ onCloseForm }) => {
  const { refreshProfile } = useAuth();
  const [newCccd, setNewCccd] = useState('');
  const [cccdPassword, setCccdPassword] = useState('');
  const [showCccdPassword, setShowCccdPassword] = useState(false);
  const [isUpdatingCccd, setIsUpdatingCccd] = useState(false);
  const [cccdError, setCccdError] = useState<string | null>(null);
  const [cccdSuccess, setCccdSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCccdError(null);
    setCccdSuccess(null);

    const cleanCccd = newCccd.trim();
    if (!/^[0-9]{12}$/.test(cleanCccd)) {
      setCccdError('Số Căn cước (CCCD) phải đúng 12 chữ số theo Luật Căn cước 2023');
      return;
    }
    if (!cccdPassword) {
      setCccdError('Vui lòng nhập mật khẩu tài khoản để xác nhận danh tính');
      return;
    }

    setIsUpdatingCccd(true);
    try {
      const result = await updateCccdApi({
        new_id_card: cleanCccd,
        password_confirmation: cccdPassword,
      });
      setCccdSuccess(result.message);
      setNewCccd('');
      setCccdPassword('');
      await refreshProfile();
      setTimeout(() => onCloseForm(), 2500);
    } catch (err: any) {
      setCccdError(err.message || 'Không thể cập nhật số CCCD');
    } finally {
      setIsUpdatingCccd(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-neutral-50 border border-[#14171f]/15 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-[#14171f] border-b pb-2">
        <CreditCard size={14} />
        <span>Cập Nhật Số Thẻ Căn Cước (CCCD)</span>
      </div>

      {/* Ràng buộc thông tin */}
      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
        <p className="font-bold flex items-center gap-1 text-amber-800">
          <ShieldAlert size={13} />
          <span>Ràng buộc pháp lý &amp; Nghiệp vụ thuê máy:</span>
        </p>
        <ul className="list-disc pl-4 space-y-0.5 text-amber-900/90 leading-relaxed">
          <li>
            Số CCCD phải đúng chuẩn <strong>12 chữ số</strong> (Luật Căn cước 2023).
          </li>
          <li>
            <strong>Không được đổi CCCD</strong> khi bạn đang có đơn thuê thiết bị đang diễn ra (giữ chỗ, đã duyệt, đang cầm máy hoặc trễ hạn).
          </li>
          <li>Bắt buộc nhập mật khẩu tài khoản để đảm bảo chính chủ thực hiện.</li>
        </ul>
      </div>

      {cccdError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{cccdError}</span>
        </div>
      )}

      {cccdSuccess && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
          <span>{cccdSuccess}</span>
        </div>
      )}

      <div className="space-y-2.5 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">
            Số Căn cước công dân mới (12 chữ số):
          </label>
          <input
            type="text"
            maxLength={12}
            value={newCccd}
            onChange={(e) => setNewCccd(e.target.value.replace(/\D/g, ''))}
            placeholder="Ví dụ: 079099012345"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 focus:outline-none focus:border-[#14171f] font-mono text-xs tracking-wider"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">
            Mật khẩu tài khoản để xác nhận:
          </label>
          <div className="relative">
            <input
              type={showCccdPassword ? 'text' : 'password'}
              value={cccdPassword}
              onChange={(e) => setCccdPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn để xác thực"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-neutral-300 focus:outline-none focus:border-[#14171f] text-xs pr-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowCccdPassword(!showCccdPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              {showCccdPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
            disabled={isUpdatingCccd}
            className="px-5 py-2 rounded-xl bg-[#14171f] hover:bg-[#252a37] text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isUpdatingCccd && <Loader2 size={13} className="animate-spin" />}
            <span>Xác nhận &amp; Cập nhật CCCD</span>
          </button>
        </div>
      </div>
    </form>
  );
};
