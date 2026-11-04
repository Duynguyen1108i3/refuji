import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, KeyRound, CreditCard, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChangePasswordForm } from './ChangePasswordForm';
import { ChangeCccdForm } from './ChangeCccdForm';

interface UserProfileTabProps {
  displayName: string;
  displayEmail: string;
  isAdmin: boolean;
}

export const UserProfileTab: React.FC<UserProfileTabProps> = ({
  displayName,
  displayEmail,
  isAdmin,
}) => {
  const { user } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCccdForm, setShowCccdForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Card 1: Thông tin định danh */}
      <div className="p-4 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#14171f] flex items-center gap-1.5">
            <UserIcon size={14} />
            <span>Thông Tin Định Danh Khách Hàng</span>
          </h4>
          <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-medium">
            Đã xác thực
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/60">
            <span className="text-neutral-500">Họ và tên:</span>
            <span className="font-semibold text-[#14171f]">{displayName}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/60">
            <span className="text-neutral-500">Địa chỉ Email:</span>
            <span className="font-mono text-[#14171f]">{displayEmail}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/60">
            <span className="text-neutral-500">Số điện thoại:</span>
            <span className="font-mono text-[#14171f]">{user?.phone || '0926302984'}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/60">
            <span className="text-neutral-500">Vai trò tài khoản:</span>
            <span className="font-mono font-semibold text-[#14171f]">
              {isAdmin ? 'Quản trị viên (ADMIN)' : 'Khách hàng (CUSTOMER)'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-200/60">
            <span className="text-neutral-500">Số Căn cước (CCCD):</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {user?.id_card_last4 ? `********${user.id_card_last4}` : '********0000'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-neutral-500">Phương thức đối chiếu:</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              <span>VNeID Định danh điện tử Mức 2</span>
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Khu vực Cập nhật An toàn (Đổi mật khẩu & Thay số CCCD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Nút bật Form Đổi Mật Khẩu */}
        <button
          type="button"
          onClick={() => {
            setShowPasswordForm(!showPasswordForm);
            setShowCccdForm(false);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            showPasswordForm
              ? 'bg-[#14171f] text-white border-[#14171f]'
              : 'bg-white border-[#14171f]/12 hover:border-[#14171f]/35 hover:bg-neutral-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                showPasswordForm ? 'bg-white/10 text-white' : 'bg-neutral-100 text-[#14171f]'
              }`}
            >
              <KeyRound size={15} />
            </div>
            <div>
              <p className="text-xs font-semibold">Đổi Mật Khẩu</p>
              <p className={`text-[10px] ${showPasswordForm ? 'text-white/70' : 'text-neutral-500'}`}>
                Bảo mật tài khoản
              </p>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${
              showPasswordForm ? 'rotate-180 text-white' : 'text-neutral-400'
            }`}
          />
        </button>

        {/* Nút bật Form Cập Nhật Số CCCD */}
        <button
          type="button"
          onClick={() => {
            setShowCccdForm(!showCccdForm);
            setShowPasswordForm(false);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            showCccdForm
              ? 'bg-[#14171f] text-white border-[#14171f]'
              : 'bg-white border-[#14171f]/12 hover:border-[#14171f]/35 hover:bg-neutral-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                showCccdForm ? 'bg-white/10 text-white' : 'bg-neutral-100 text-[#14171f]'
              }`}
            >
              <CreditCard size={15} />
            </div>
            <div>
              <p className="text-xs font-semibold">Đổi Số Căn Cước</p>
              <p className={`text-[10px] ${showCccdForm ? 'text-white/70' : 'text-neutral-500'}`}>
                Kèm ràng buộc đơn thuê
              </p>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${
              showCccdForm ? 'rotate-180 text-white' : 'text-neutral-400'
            }`}
          />
        </button>
      </div>

      {/* FORM 1: ĐỔI MẬT KHẨU */}
      <AnimatePresence initial={false}>
        {showPasswordForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              transition: {
                height: { type: 'spring', stiffness: 380, damping: 32 },
                opacity: { duration: 0.2 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
            }}
            className="overflow-hidden"
          >
            <ChangePasswordForm onCloseForm={() => setShowPasswordForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM 2: CẬP NHẬT SỐ CCCD */}
      <AnimatePresence initial={false}>
        {showCccdForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              transition: {
                height: { type: 'spring', stiffness: 380, damping: 32 },
                opacity: { duration: 0.2 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
            }}
            className="overflow-hidden"
          >
            <ChangeCccdForm onCloseForm={() => setShowCccdForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tuân thủ Luật BVDLCN 2025 */}
      <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 text-xs space-y-2 text-emerald-950">
        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
          <ShieldCheck size={16} />
          <span>Quyền Riêng Tư &amp; Bảo Vệ Dữ Liệu Cá Nhân 2025</span>
        </div>
        <p className="text-[11px] leading-relaxed text-emerald-900/80">
          Dữ liệu Căn cước công dân của bạn được mã hóa an toàn theo quy định của Luật Bảo vệ Dữ liệu Cá nhân 2025 và Luật Căn cước 2023. Bạn có toàn quyền yêu cầu trích xuất bản sao hoặc ẩn danh hóa dữ liệu sau khi kết thúc hợp đồng thuê thiết bị.
        </p>
      </div>
    </div>
  );
};
