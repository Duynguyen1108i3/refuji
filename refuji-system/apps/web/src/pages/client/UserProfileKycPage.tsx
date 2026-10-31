import React, { useState } from 'react';
import { ShieldCheck, Lock, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';

export const UserProfileKycPage: React.FC = () => {
  const [fullName, setFullName] = useState('Trần Văn An');
  const [phone, setPhone] = useState('0901234567');
  const [email, setEmail] = useState('an.tran@example.com');
  const [idCardLast4, setIdCardLast4] = useState('8832');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleDeletePii = () => {
    if (confirm('Bạn có chắc chắn muốn yêu cầu hủy và xóa toàn bộ dữ liệu Căn cước công dân (PII) theo Luật BVDLCN 2025? Sau khi xóa, bạn cần định danh lại để thuê máy.')) {
      setIdCardLast4('');
      alert('Đã xóa dữ liệu PII thành công.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-white mb-2">HỒ SƠ CÁ NHÂN & ĐỊNH DANH KYC</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Quản lý thông tin định danh và thực hiện quyền kiểm soát dữ liệu cá nhân theo Nghị định Bảo vệ Dữ liệu Cá nhân 2025.
      </p>

      <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/15 mb-8">
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <Input label="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Địa chỉ Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Số CCCD / VNeID (Mã hóa AES-256-GCM)</span>
              </span>
              <span className="text-xs text-emerald-400 font-medium">Đã xác minh</span>
            </div>
            <p className="text-sm font-mono text-white tracking-widest num">
              {idCardLast4 ? `**** **** ${idCardLast4}` : 'Chưa có thông tin'}
            </p>
            <p className="text-[11px] text-zinc-500">
              Chỉ 4 số cuối được hiển thị cho đối soát tại quầy. Toàn bộ chuỗi gốc được mã hóa an toàn trên hệ thống.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeletePii}
              className="text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Yêu cầu xóa dữ liệu CCCD (Quyền PII 2025)</span>
            </Button>

            <Button type="submit" variant="primary" size="md">
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>

        {isSaved && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Hồ sơ đã được lưu thành công!</span>
          </div>
        )}
      </div>
    </div>
  );
};
