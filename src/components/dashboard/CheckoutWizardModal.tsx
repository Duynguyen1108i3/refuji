import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Upload,
  Trash2,
  Check,
  Loader2,
  CreditCard,
  Banknote,
} from 'lucide-react';
import {
  compressInspectionPhoto,
  fetchOrderDossier,
  submitOrderCheckout,
} from '../../services/dashboardApi';
import {
  ACCESSORY_CHECKLIST_ITEMS,
  OrderDossierData,
  formatVnd,
  formatShortDate,
} from './dashboardTypes';
import {
  POPUP_BACKDROP_CLASS,
  buildPopupFrameClass,
  POPUP_INNER_CLASS,
  POPUP_CLOSE_BUTTON_CLASS,
  getBackdropDismissProps,
} from '../ui/popupTheme';
import { GlassSelect, GlassSelectOption } from './GlassSelect';

interface CheckoutWizardModalProps {
  orderCode: string | null;
  onClose: () => void;
  onCompleted: (orderCode: string, message: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CheckoutWizardModal: React.FC<CheckoutWizardModalProps> = ({
  orderCode,
  onClose,
  onCompleted,
  onNotify,
}) => {
  const [dossier, setDossier] = useState<OrderDossierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [shutterMap, setShutterMap] = useState<Record<string, number>>({});
  const [kycMethod, setKycMethod] = useState<string>('CITIZEN_ID_CARD');
  const [kycLast4, setKycLast4] = useState<string>('');
  const [contractSigned, setContractSigned] = useState<boolean>(false);
  const [accessories, setAccessories] = useState<Record<string, boolean>>({
    battery: true,
    charger_cable: true,
    strap: true,
    caps: true,
    sd_card: false,
    bag: true,
  });
  const [conditionNotes, setConditionNotes] = useState<string>('');
  const [collectRemaining, setCollectRemaining] = useState<boolean>(false);
  const [rentPayMethod, setRentPayMethod] = useState<string>('CASH');
  const [photos, setPhotos] = useState<Array<{ photo_data: string; caption: string; serial_number?: string }>>([]);

  useEffect(() => {
    if (!orderCode) return;
    setIsLoading(true);
    setErrorMsg(null);
    setPhotos([]);
    setContractSigned(false);
    setCollectRemaining(false);
    setConditionNotes('');

    fetchOrderDossier(orderCode)
      .then((res) => {
        setDossier(res);
        const initialAssigned = res.order.assigned_serials
          ? res.order.assigned_serials.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        const fallbackAvail = res.warehouse_serials
          .filter((u) => u.status === 'AVAILABLE')
          .slice(0, Math.max(1, res.order.quantity || 1))
          .map((u) => u.serial_number);
        const chosen = initialAssigned.length > 0 ? initialAssigned : fallbackAvail;
        setSelectedSerials(chosen);

        const nextShutters: Record<string, number> = {};
        for (const u of [...res.assigned_item_units, ...res.warehouse_serials]) {
          nextShutters[u.serial_number] = u.shutter_count || 0;
        }
        setShutterMap(nextShutters);

        if (!res.order.is_guest && res.order.membership_tier === 'PLATINUM') {
          setKycMethod('FAST_TRACK_PLATINUM');
        } else {
          setKycMethod('CITIZEN_ID_CARD');
        }
        if (!res.order.is_guest && res.order.id_card_last4 && res.order.id_card_last4 !== '0000') {
          setKycLast4(res.order.id_card_last4);
        } else {
          setKycLast4('');
        }
        if (res.order.remaining_due === 0 || res.order.payment_status === 'PAID_FULL') {
          setCollectRemaining(true);
        }
      })
      .catch((err) => {
        setErrorMsg(err?.message || 'Không thể tải dữ liệu bàn giao đơn hàng.');
      })
      .finally(() => setIsLoading(false));
  }, [orderCode]);

  if (!orderCode || typeof document === 'undefined') return null;

  const toggleSerial = (sn: string) => {
    setSelectedSerials((prev) =>
      prev.includes(sn) ? prev.filter((s) => s !== sn) : [...prev, sn]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const compressed = await Promise.all(
        files.map(async (f, idx) => ({
          photo_data: await compressInspectionPhoto(f),
          caption: f.name.replace(/\.[^.]+$/, '') || `Ảnh đối chứng ${photos.length + idx + 1}`,
          serial_number: selectedSerials[0],
        }))
      );
      setPhotos((prev) => [...prev, ...compressed].slice(0, 8));
    } catch (err: any) {
      onNotify(err?.message || 'Không thể xử lý tệp ảnh.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier) return;
    setErrorMsg(null);

    if (selectedSerials.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 mã Serial vật lý để xuất kho bàn giao.');
      return;
    }
    if (!/^\d{4}$/.test(kycLast4.trim())) {
      setErrorMsg('Vui lòng nhập chính xác 4 chữ số cuối CCCD / Hộ chiếu đã đối chiếu.');
      return;
    }
    if (!contractSigned) {
      setErrorMsg('Khách hàng phải xác nhận ký Biên bản bàn giao trước khi nhận máy.');
      return;
    }
    if (photos.length < 2) {
      setErrorMsg('Quy định bắt buộc: Phải tải lên tối thiểu 2 ảnh chụp thực tế ngoại quan / cảm biến.');
      return;
    }
    if (dossier.order.remaining_due > 0 && !collectRemaining) {
      setErrorMsg(
        `Thiết bị chỉ được rời quầy khi đã thu đủ ${formatVnd(dossier.order.remaining_due)} còn thiếu.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedShutters: Record<string, number> = {};
      for (const sn of selectedSerials) {
        selectedShutters[sn] = Number(shutterMap[sn]) || 0;
      }

      const res = await submitOrderCheckout(orderCode, {
        kyc_verification_method: kycMethod,
        kyc_document_last4: kycLast4.trim(),
        contract_signed: contractSigned,
        assigned_serials: selectedSerials,
        accessories,
        shutter_snapshots: selectedShutters,
        condition_notes: conditionNotes,
        collect_remaining_rent: collectRemaining,
        rent_payment_method: rentPayMethod,
        photos,
      });

      onCompleted(orderCode, res.message);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi hoàn tất bàn giao thiết bị.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const candidateUnits = dossier
    ? Array.from(
        new Map(
          [...dossier.warehouse_serials, ...dossier.assigned_item_units].map((u) => [
            u.serial_number,
            u,
          ])
        ).values()
      )
    : [];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      {...getBackdropDismissProps(onClose)}
      className={`${POPUP_BACKDROP_CLASS} z-[220]`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        className={buildPopupFrameClass('max-w-3xl', 'h-[86vh] max-h-[90vh]')}
      >
        <div className={POPUP_INNER_CLASS}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ Check-out"
            className={POPUP_CLOSE_BUTTON_CLASS}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="pl-6 sm:pl-8 pr-16 py-5 pb-4 border-b border-[#14171f]/10 shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-serif text-xl sm:text-2xl text-[#14171f]">
                Quy Trình Bàn Giao (Check-out)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#14171f] text-white text-[11px] font-bold num">
                #{orderCode}
              </span>
            </div>
            {dossier && (
              <p className="text-xs text-[#5a6072] mt-1 num">
                Khách: <strong className="text-[#14171f]">{dossier.order.customer_name}</strong> ({dossier.order.customer_phone}) • Lịch: {formatShortDate(dossier.order.start_date)} → {formatShortDate(dossier.order.expected_return_date)}
              </p>
            )}
          </div>

          {/* Body */}
          {isLoading || !dossier ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#5a6072]">
              <Loader2 size={26} className="animate-spin text-[#14171f]" />
              <span className="text-xs">Đang tải thông tin kho &amp; hồ sơ KYC...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5 space-y-5 pb-8">
                {/* Guest High-Alert vs Member Fast-track Banner */}
                {dossier.order.is_guest ? (
                  <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 text-xs">
                    <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Cảnh báo Bàn giao Khách Vãng Lai (Guest Checkout)</p>
                      <p className="leading-relaxed text-amber-900">
                        Khách chưa qua định danh tài khoản thành viên. Nhân viên bắt buộc đối chiếu trực tiếp{' '}
                        <strong>CCCD gốc / VNeID định danh mức 2</strong> trước khi giao máy. Tuân thủ Luật Căn cước 2023:{' '}
                        <strong>KHÔNG thu giữ giấy tờ bản gốc</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3 text-xs">
                    <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">
                        Thành viên ReFuji ({dossier.order.membership_tier}) • Uy tín: {dossier.order.reputation_score}/100
                      </p>
                      <p className="text-emerald-800">
                        {dossier.order.id_card_last4
                          ? `Hồ sơ KYC hệ thống khớp 4 số cuối ****${dossier.order.id_card_last4}. Đối chiếu nhanh qua VNeID/CCCD và cam kết không giữ giấy tờ gốc.`
                          : 'Thành viên chưa lưu 4 số cuối CCCD — vui lòng đối chiếu trực tiếp CCCD/VNeID tại quầy.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 1: Select Physical Serials & Shutter Snapshots */}
                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#14171f]">
                      1. Chọn mã Serial vật lý &amp; Ghi nhận Shutter đầu kỳ
                    </h4>
                    <span className="text-[11px] text-[#5a6072] num">
                      Đã chọn: <strong>{selectedSerials.length}</strong> thiết bị
                    </span>
                  </div>

                  <div className="space-y-2">
                    {candidateUnits.map((unit) => {
                      const isSelected = selectedSerials.includes(unit.serial_number);
                      const isBlocked =
                        unit.status === 'RENTED' ||
                        unit.status === 'MAINTENANCE' ||
                        unit.status === 'LOST';
                      return (
                        <div
                          key={unit.serial_number}
                          className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            isSelected
                              ? 'bg-white border-[#14171f] shadow-xs'
                              : isBlocked
                              ? 'bg-neutral-100/80 border-neutral-200 opacity-60'
                              : 'bg-white border-[#14171f]/10'
                          }`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isBlocked && !isSelected}
                              onChange={() => toggleSerial(unit.serial_number)}
                              className="w-4 h-4 accent-[#14171f] rounded cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[#14171f] num">{unit.serial_number}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-[#4b5262] num">
                                  Độ mới {unit.condition_percent}%
                                </span>
                                {isBlocked && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                                    {unit.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#5a6072] truncate">{unit.model_name}</p>
                            </div>
                          </label>

                          {isSelected && (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-[#5a6072]">Shutter hiện tại:</span>
                              <input
                                type="number"
                                min={0}
                                value={shutterMap[unit.serial_number] ?? unit.shutter_count ?? 0}
                                onChange={(e) =>
                                  setShutterMap((prev) => ({
                                    ...prev,
                                    [unit.serial_number]: Math.max(0, Number(e.target.value) || 0),
                                  }))
                                }
                                className="w-24 px-3 py-1.5 rounded-full border border-[#14171f]/15 bg-[#f7f8fa] text-xs font-bold text-[#14171f] num focus:outline-none focus:border-[#14171f]"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: KYC Verification & Contract */}
                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14171f]">
                    2. Đối chiếu Căn cước (KYC) &amp; Ký Biên bản
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                        Phương thức đối chiếu
                      </label>
                      <GlassSelect
                        value={kycMethod}
                        onChange={setKycMethod}
                        variant="white"
                        menuTitle="Phương thức đối chiếu KYC"
                        minMenuWidth={280}
                        className="w-full"
                        ariaLabel="Phương thức đối chiếu giấy tờ"
                        options={(() => {
                          const opts: GlassSelectOption[] = [
                            {
                              value: 'CITIZEN_ID_CARD',
                              label: 'Thẻ CCCD gắn chip (Không giữ gốc)',
                              description: 'Kiểm tra trực tiếp bản gốc tại quầy & trả lại ngay cho khách.',
                            },
                            {
                              value: 'VNEID_APP',
                              label: 'Ứng dụng VNeID Định danh mức 2',
                              description: 'Đối chiếu trực tiếp tài khoản VNeID mức 2 đang hoạt động.',
                            },
                            {
                              value: 'PASSPORT',
                              label: 'Hộ chiếu (Passport)',
                              description: 'Áp dụng cho khách quốc tế hoặc trường hợp cần đối chiếu Passport.',
                            },
                          ];
                          if (!dossier.order.is_guest && dossier.order.membership_tier === 'PLATINUM') {
                            opts.push({
                              value: 'FAST_TRACK_PLATINUM',
                              label: 'Ưu tiên Fast-Track Bạch Kim',
                              badge: 'PLATINUM',
                              dotClass: 'bg-emerald-500',
                              description: 'Đối chiếu nhanh thành viên uy tín hạng cao.',
                            });
                          }
                          return opts;
                        })()}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                        4 chữ số cuối giấy tờ *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={kycLast4}
                        onChange={(e) => setKycLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Ví dụ: 6789"
                        className="w-full px-4 py-2.5 rounded-full bg-white border border-[#14171f]/15 text-xs font-bold text-[#14171f] tracking-widest num focus:outline-none focus:border-[#14171f]"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-[#14171f]/12 cursor-pointer text-xs text-[#14171f]">
                    <input
                      type="checkbox"
                      checked={contractSigned}
                      onChange={(e) => setContractSigned(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-[#14171f] cursor-pointer"
                    />
                    <span className="leading-relaxed">
                      Khách hàng đã kiểm tra ngoại hình máy thực tế, đồng ý quy định phạt trễ hạn/hư hỏng và đã ký Biên bản bàn giao điện tử (ReFuji chỉ đối chiếu, <strong>KHÔNG giữ CCCD gốc</strong>).
                    </span>
                  </label>
                </div>

                {/* Step 3: Accessories Checklist */}
                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14171f]">
                    3. Phụ kiện bàn giao kèm theo
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ACCESSORY_CHECKLIST_ITEMS.map((acc) => {
                      const active = !!accessories[acc.key];
                      return (
                        <button
                          key={acc.key}
                          type="button"
                          onClick={() =>
                            setAccessories((prev) => ({ ...prev, [acc.key]: !prev[acc.key] }))
                          }
                          className={`px-3 py-2 rounded-2xl border text-left text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                            active
                              ? 'bg-[#14171f] text-white border-[#14171f]'
                              : 'bg-white text-[#5a6072] border-[#14171f]/12 hover:border-[#14171f]/30'
                          }`}
                        >
                          <Check size={13} className={active ? 'opacity-100' : 'opacity-25'} />
                          <span className="truncate">{acc.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={conditionNotes}
                    onChange={(e) => setConditionNotes(e.target.value)}
                    placeholder="Ghi chú ngoại quan ban đầu (vết xước cũ nếu có, số pin kèm theo)..."
                    className="w-full px-4 py-2.5 rounded-full bg-white border border-[#14171f]/15 text-xs text-[#14171f] placeholder:text-[#8c93a4] focus:outline-none"
                  />
                </div>

                {/* Step 4: Mandatory >= 2 Inspection Photos */}
                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#14171f]">
                        4. Ảnh đối chứng ngoại quan &amp; cảm biến (Bắt buộc &ge; 2 ảnh)
                      </h4>
                      <p className="text-[11px] text-[#5a6072] mt-0.5 num">
                        Đã tải lên: <strong className={photos.length >= 2 ? 'text-emerald-700' : 'text-amber-700'}>{photos.length}/2</strong> ảnh
                      </p>
                    </div>
                    <label className="px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                      <Upload size={13} />
                      <span>Tải / Chụp ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {photos.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-[#14171f]/20 bg-white text-center text-xs text-[#7e8596] flex flex-col items-center gap-2">
                      <Camera size={22} className="text-[#8c93a4]" />
                      <span>Chụp hoặc chọn tối thiểu 2 ảnh thân máy / ngàm / mặt kính lens trước bàn giao.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {photos.map((ph, idx) => (
                        <div key={idx} className="relative group rounded-2xl overflow-hidden border border-[#14171f]/15 bg-white aspect-[4/3]">
                          <img src={ph.photo_data} alt={ph.caption} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 5: Final Payment Settlement Gate (PAID_FULL) */}
                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3 text-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14171f]">
                    5. Xác nhận tài chính (PAID_FULL trước khi giao máy)
                  </h4>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#14171f]/10 space-y-1.5 num">
                    <div className="flex justify-between">
                      <span className="text-[#5a6072]">Tiền thuê ({dossier.order.start_date} → {dossier.order.expected_return_date}):</span>
                      <span className="font-semibold text-[#14171f]">{formatVnd(dossier.order.total_rent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5a6072]">Tiền cọc thiết bị:</span>
                      <span className="font-semibold text-[#14171f]">{formatVnd(dossier.order.deposit_amount)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-neutral-200/70">
                      <span className="text-[#5a6072]">Đã thu qua cổng / trước đó:</span>
                      <span className="font-semibold text-emerald-700">
                        {formatVnd(dossier.order.paid_deposit_amount + dossier.order.paid_rent_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-sm pt-1">
                      <span className="text-[#14171f]">Còn cần thu tại quầy:</span>
                      <span className={dossier.order.remaining_due > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                        {formatVnd(dossier.order.remaining_due)}
                      </span>
                    </div>
                  </div>

                  {dossier.order.remaining_due > 0 ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        {[
                          { id: 'CASH', label: 'Tiền mặt', icon: <Banknote size={13} /> },
                          { id: 'BANK_TRANSFER', label: 'Chuyển khoản / VietQR', icon: <CreditCard size={13} /> },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setRentPayMethod(m.id)}
                            className={`px-3.5 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                              rentPayMethod === m.id
                                ? 'bg-[#14171f] text-white border-[#14171f]'
                                : 'bg-white text-[#14171f] border-[#14171f]/15'
                            }`}
                          >
                            {m.icon}
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 cursor-pointer text-emerald-950 font-semibold">
                        <input
                          type="checkbox"
                          checked={collectRemaining}
                          onChange={(e) => setCollectRemaining(e.target.checked)}
                          className="w-4 h-4 accent-emerald-700 cursor-pointer"
                        />
                        <span className="num">
                          Xác nhận đã thu đủ {formatVnd(dossier.order.remaining_due)} tại quầy (chuyển PAID_FULL)
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                      <Check size={14} />
                      <span>Đơn hàng đã thanh toán đủ 100% trước đó (PAID_FULL).</span>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 sm:px-8 py-4 border-t border-[#14171f]/10 bg-white shrink-0 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-full border border-[#14171f]/20 hover:bg-neutral-50 text-xs font-semibold text-[#14171f] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>{isSubmitting ? 'Đang bàn giao...' : 'Hoàn Tất Bàn Giao (DELIVERED)'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
