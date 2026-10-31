import React, { useState } from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { InspectionPhotoZone } from '../../components/uploaders/InspectionPhotoZone.tsx';
import { CheckCircle2, ShieldCheck, Printer } from 'lucide-react';

export const CheckoutWizardPage: React.FC = () => {
  const [orderCode, setOrderCode] = useState('RFJ-20261030-9841');
  const [idCardLast4Input, setIdCardLast4Input] = useState('');
  const [assignedSerial, setAssignedSerial] = useState('3A014582');
  const [shutterCount, setShutterCount] = useState('4120');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCompleteHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (idCardLast4Input !== '8832') {
      alert('4 số cuối CCCD/VNeID không khớp với hồ sơ đặt trước (yêu cầu 8832)! Vui lòng kiểm tra lại.');
      return;
    }
    if (photos.length < 2) {
      alert('Bắt buộc chụp tối thiểu 2 ảnh đối chứng ngoại quan và cảm biến trước khi bàn giao!');
      return;
    }
    setIsCompleted(true);
  };

  return (
    <StaffPosLayout activeKey="checkout">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">QUY TRÌNH BÀN GIAO MÁY (CHECK-OUT)</h1>
        <p className="text-xs text-zinc-400 mb-8">Đối chiếu căn cước công dân VNeID, gán mã Serial thực tế và chụp ảnh thẩm định</p>

        {isCompleted ? (
          <div className="liquid-glass rounded-2xl p-8 border border-emerald-500/30 text-center flex flex-col items-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">BÀN GIAO THIẾT BỊ HOÀN TẤT</h2>
            <p className="text-sm text-zinc-300">
              Đơn hàng <strong>#{orderCode}</strong> đã chuyển sang trạng thái DELIVERED. Mã Serial <strong>{assignedSerial}</strong> đã được gán.
            </p>
            <Button variant="primary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              <span>In Biên bản bàn giao ký tươi</span>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCompleteHandover} className="liquid-glass rounded-2xl p-6 border border-white/15 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Mã đơn đặt chỗ" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} required />
              <Input
                label="Đối chiếu 4 số cuối CCCD / VNeID của khách"
                placeholder="Nhập 4 số cuối (VD: 8832)"
                maxLength={4}
                value={idCardLast4Input}
                onChange={(e) => setIdCardLast4Input(e.target.value)}
                required
              />
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Gán mã Serial thân máy trong kho</label>
                <select
                  value={assignedSerial}
                  onChange={(e) => setAssignedSerial(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white focus:outline-none"
                >
                  <option value="3A014582">Fujifilm X-T5 Silver - Serial: 3A014582 (4.120 shots)</option>
                  <option value="3A014905">Fujifilm X-T5 Silver - Serial: 3A014905 (8.350 shots)</option>
                </select>
              </div>
              <Input
                label="Ghi nhận số shot hiện tại (Shutter Count)"
                type="number"
                value={shutterCount}
                onChange={(e) => setShutterCount(e.target.value)}
                required
              />
            </div>

            <InspectionPhotoZone
              label="Ảnh chụp ngoại quan máy & số Serial thực tế tại quầy (Tối thiểu 2 ảnh)"
              requiredCount={2}
              onPhotosChange={setPhotos}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full font-bold">
              Xác nhận bàn giao thiết bị
            </Button>
          </form>
        )}
      </div>
    </StaffPosLayout>
  );
};
