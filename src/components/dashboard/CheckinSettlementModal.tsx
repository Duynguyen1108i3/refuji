import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X,
  Check,
  Clock,
  Camera,
  Upload,
  Trash2,
  Loader2,
  AlertTriangle,
  Award,
  Printer,
} from 'lucide-react';
import {
  CheckinItemPayload,
  compressInspectionPhoto,
  fetchOrderDossier,
  previewOrderCheckin,
  submitOrderCheckin,
} from '../../services/dashboardApi';
import {
  DAMAGE_LEVEL_OPTIONS,
  DamageLevelType,
  OrderDossierData,
  SettlementCalculationResult,
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
import { GlassSelect } from './GlassSelect';

interface CheckinSettlementModalProps {
  orderCode: string | null;
  onClose: () => void;
  onCompleted: (orderCode: string, message: string) => void;
  onOpenPrintDossier: (orderCode: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const getNowLocalDatetimeStr = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

export const CheckinSettlementModal: React.FC<CheckinSettlementModalProps> = ({
  orderCode,
  onClose,
  onCompleted,
  onOpenPrintDossier,
  onNotify,
}) => {
  const [dossier, setDossier] = useState<OrderDossierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settledSummary, setSettledSummary] = useState<SettlementCalculationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [actualReturnInput, setActualReturnInput] = useState<string>(getNowLocalDatetimeStr);
  const [otherFee, setOtherFee] = useState<number>(0);
  const [otherFeeDesc, setOtherFeeDesc] = useState<string>('');
  const [staffNotes, setStaffNotes] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
  const [itemForms, setItemForms] = useState<CheckinItemPayload[]>([]);
  const [photos, setPhotos] = useState<Array<{ photo_data: string; caption: string; serial_number?: string }>>([]);
  const [previewCalc, setPreviewCalc] = useState<SettlementCalculationResult | null>(null);

  useEffect(() => {
    if (!orderCode) return;
    setIsLoading(true);
    setSettledSummary(null);
    setErrorMsg(null);
    setPhotos([]);
    setOtherFee(0);
    setOtherFeeDesc('');
    setStaffNotes('');
    setActualReturnInput(getNowLocalDatetimeStr());

    fetchOrderDossier(orderCode)
      .then((res) => {
        setDossier(res);
        const units = res.assigned_item_units;
        const unitCount = Math.max(1, units.length);
        const fallbackDepositPerUnit = Math.round((Number(res.order.deposit_amount) || 0) / unitCount);

        const initialForms: CheckinItemPayload[] =
          units.length > 0
            ? units.map((u) => ({
                serial_number: u.serial_number,
                model_name: u.model_name,
                unit_deposit: Number(u.model_deposit) || fallbackDepositPerUnit,
                condition_after: u.condition_percent || 98,
                shutter_count_after: (u.shutter_count || 0) + 120,
                damage_level: 'NONE',
                damage_description: '',
                missing_accessories_fee: 0,
                next_item_status: 'AVAILABLE',
              }))
            : [
                {
                  serial_number: res.order.assigned_serials || 'SN-MANUAL',
                  model_name: res.order.model_name,
                  unit_deposit: Number(res.order.deposit_amount) || 0,
                  condition_after: 98,
                  shutter_count_after: 0,
                  damage_level: 'NONE',
                  damage_description: '',
                  missing_accessories_fee: 0,
                  next_item_status: 'AVAILABLE',
                },
              ];
        setItemForms(initialForms);
      })
      .catch((err) => {
        setErrorMsg(err?.message || 'Không thể tải dữ liệu thu hồi đơn hàng.');
      })
      .finally(() => setIsLoading(false));
  }, [orderCode]);

  // Live call /checkin-preview whenever dates or fees change
  useEffect(() => {
    if (!orderCode || !dossier || itemForms.length === 0 || settledSummary) return;
    const timer = setTimeout(() => {
      const isoReturn = actualReturnInput ? new Date(actualReturnInput).toISOString() : new Date().toISOString();
      previewOrderCheckin(orderCode, {
        actual_return_date: isoReturn,
        other_fee: otherFee,
        item_inspections: itemForms,
      })
        .then((res) => setPreviewCalc(res.calculation))
        .catch(() => {});
    }, 180);
    return () => clearTimeout(timer);
  }, [orderCode, dossier, actualReturnInput, otherFee, itemForms, settledSummary]);

  if (!orderCode || typeof document === 'undefined') return null;

  const updateItemField = (index: number, patch: Partial<CheckinItemPayload>) => {
    setItemForms((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const next = { ...it, ...patch };
        if (patch.damage_level) {
          const rule = DAMAGE_LEVEL_OPTIONS.find((r) => r.value === patch.damage_level);
          if (rule) {
            next.next_item_status = rule.defaultNextStatus;
          }
        }
        return next;
      })
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const compressed = await Promise.all(
        files.map(async (f, idx) => ({
          photo_data: await compressInspectionPhoto(f),
          caption: f.name.replace(/\.[^.]+$/, '') || `Check-in ${idx + 1}`,
          serial_number: itemForms[0]?.serial_number,
        }))
      );
      setPhotos((prev) => [...prev, ...compressed].slice(0, 6));
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tải ảnh.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossier) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const isoReturn = actualReturnInput ? new Date(actualReturnInput).toISOString() : new Date().toISOString();
      const res = await submitOrderCheckin(orderCode, {
        actual_return_date: isoReturn,
        other_fee: otherFee,
        other_fee_description: otherFeeDesc,
        staff_inspection_notes: staffNotes,
        refund_method: refundMethod,
        item_inspections: itemForms,
        photos,
      });
      setSettledSummary(res.calculation);
      onCompleted(orderCode, res.message);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể hoàn tất Check-in quyết toán.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkoutPhotos = dossier?.inspection_photos.filter((p) => p.phase === 'CHECKOUT') || [];
  const checkoutShutters = dossier?.checkout_record?.shutter_snapshots || {};

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
        className={buildPopupFrameClass('max-w-3xl', 'h-[88vh] max-h-[90vh]')}
      >
        <div className={POPUP_INNER_CLASS}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ Check-in"
            className={POPUP_CLOSE_BUTTON_CLASS}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="pl-6 sm:pl-8 pr-16 py-5 pb-4 border-b border-[#14171f]/10 shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-serif text-xl sm:text-2xl text-[#14171f]">
                Thu Hồi &amp; Quyết Toán Cọc (Check-in)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#14171f] text-white text-[11px] font-bold num">
                #{orderCode}
              </span>
            </div>
            {dossier && (
              <p className="text-xs text-[#5a6072] mt-1 num">
                Khách: <strong className="text-[#14171f]">{dossier.order.customer_name}</strong> • Hẹn trả: {formatShortDate(dossier.order.expected_return_date)} (20:00 + 2h ân hạn) • Cọc đang giữ: <strong className="text-emerald-700">{formatVnd(dossier.order.deposit_amount)}</strong>
              </p>
            )}
          </div>

          {isLoading || !dossier ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#5a6072]">
              <Loader2 size={26} className="animate-spin text-[#14171f]" />
              <span className="text-xs">Đang đối chiếu biên bản Check-out &amp; công thức hoàn cọc...</span>
            </div>
          ) : settledSummary ? (
            /* Post-settlement view with Print action */
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 flex flex-col items-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Check size={32} />
              </div>
              <div>
                <h3 className="font-serif text-2xl text-[#14171f]">
                  Quyết Toán Check-in Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-[#5a6072] mt-1">
                  Đơn <strong className="text-[#14171f]">#{orderCode}</strong> đã chuyển sang{' '}
                  <strong>RETURNED</strong> &amp; cập nhật sổ cái giao dịch tự động.
                </p>
              </div>

              <div className="w-full max-w-md p-5 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 text-xs space-y-2 text-left num">
                <div className="flex justify-between">
                  <span className="text-[#5a6072]">Tiền cọc giữ ban đầu:</span>
                  <span className="font-semibold text-[#14171f]">{formatVnd(settledSummary.depositHeld)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5a6072]">Phí trễ hạn ({settledSummary.lateDays} ngày):</span>
                  <span className="font-semibold text-rose-700">-{formatVnd(settledSummary.totalLateFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5a6072]">Phí hư hỏng / phụ kiện / khác:</span>
                  <span className="font-semibold text-rose-700">
                    -{formatVnd(settledSummary.totalDamageFee + settledSummary.totalMissingAccFee + settledSummary.otherFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-bold">
                  <span>{settledSummary.additionalChargeAmount > 0 ? 'Khách phải bù thêm:' : 'Số tiền hoàn trả khách:'}</span>
                  <span className={settledSummary.additionalChargeAmount > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    {settledSummary.additionalChargeAmount > 0
                      ? formatVnd(settledSummary.additionalChargeAmount)
                      : formatVnd(settledSummary.refundAmount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrintDossier(orderCode);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Xem &amp; In Biên bản Quyết toán</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="glass-button px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5 space-y-5 pb-8">
                {/* Check-out Before Photos Reference */}
                {checkoutPhotos.length > 0 && (
                  <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5a6072]">
                      Ảnh đối chứng lúc bàn giao (Check-out trước đó)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {checkoutPhotos.map((ph) => (
                        <div key={ph.id} className="rounded-xl overflow-hidden border border-[#14171f]/10 aspect-square bg-white">
                          <img src={ph.photo_data} alt={ph.caption || 'Checkout'} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 1: Actual Return Timestamp + Late Fee Calculation */}
                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#14171f] flex items-center gap-1.5">
                        <Clock size={13} />
                        <span>1. Thời điểm trả thực tế &amp; Ân hạn 2 giờ</span>
                      </h4>
                      <p className="text-[11px] text-[#5a6072] mt-0.5">
                        Hẹn trả chuẩn: 20:00 ngày {formatShortDate(dossier.order.expected_return_date)} • Trễ &le; 2h miễn phí, &gt; 2h tính 1.5x giá thuê (trần 2x cọc)
                      </p>
                    </div>
                    <input
                      type="datetime-local"
                      value={actualReturnInput}
                      onChange={(e) => setActualReturnInput(e.target.value)}
                      className="px-3.5 py-2 rounded-full bg-white border border-[#14171f]/15 text-xs font-semibold text-[#14171f] num focus:outline-none"
                    />
                  </div>

                  {previewCalc && (
                    <div
                      className={`p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 num ${
                        previewCalc.withinGracePeriod
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <span>
                        {previewCalc.withinGracePeriod
                          ? `Trong thời gian hợp lệ / ân hạn 2h (trễ ${previewCalc.diffHours}h → Miễn phí trễ hạn)`
                          : `Trễ ${previewCalc.diffHours}h → Làm tròn ${previewCalc.lateDays} ngày phạt (1.5x × ${formatVnd(dossier.order.daily_rent_sum)}/ngày)`}
                      </span>
                      <span className="font-bold">
                        Phí trễ hạn: {formatVnd(previewCalc.totalLateFee)}
                        {previewCalc.lateFeeCapped ? ' (Đã chạm trần 2x cọc)' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Section 2: Per-Serial Physical Inspection */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#14171f]">
                    2. Kiểm định từng Serial vật lý &amp; Mức hư hỏng
                  </h4>

                  {itemForms.map((item, idx) => {
                    const beforeShutter = checkoutShutters[item.serial_number];
                    return (
                      <div key={item.serial_number} className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-[#14171f] num">{item.serial_number}</span>
                            <span className="ml-2 text-xs text-[#5a6072]">{item.model_name}</span>
                          </div>
                          <span className="text-[11px] text-[#5a6072] num">
                            Cọc đơn vị: <strong className="text-[#14171f]">{formatVnd(item.unit_deposit)}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                              Shutter lúc trả {beforeShutter !== undefined ? `(Trước: ${beforeShutter})` : ''}
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={item.shutter_count_after}
                              onChange={(e) =>
                                updateItemField(idx, { shutter_count_after: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className="w-full px-3.5 py-2 rounded-full bg-white border border-[#14171f]/15 text-xs font-semibold text-[#14171f] num"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                              Độ mới ngoại quan (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.condition_after}
                              onChange={(e) =>
                                updateItemField(idx, {
                                  condition_after: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                })
                              }
                              className="w-full px-3.5 py-2 rounded-full bg-white border border-[#14171f]/15 text-xs font-semibold text-[#14171f] num"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                              Trạng thái kho sau Check-in
                            </label>
                            <GlassSelect
                              value={item.next_item_status || 'AVAILABLE'}
                              onChange={(val) =>
                                updateItemField(idx, {
                                  next_item_status: val as 'AVAILABLE' | 'MAINTENANCE' | 'LOST',
                                })
                              }
                              variant="white"
                              align="right"
                              menuTitle="Trạng thái Serial sau Check-in"
                              minMenuWidth={255}
                              className="w-full"
                              ariaLabel={`Trạng thái kho sau Check-in cho ${item.serial_number}`}
                              options={[
                                { value: 'AVAILABLE', label: 'AVAILABLE (Sẵn sàng thuê)', dotClass: 'bg-emerald-500' },
                                { value: 'MAINTENANCE', label: 'MAINTENANCE (Chuyển bảo dưỡng)', dotClass: 'bg-amber-500' },
                                { value: 'LOST', label: 'LOST (Mất / Hỏng hẳn)', dotClass: 'bg-rose-500' },
                              ]}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                              Mức độ hư hỏng (Theo bảng quy định)
                            </label>
                            <GlassSelect
                              value={item.damage_level}
                              onChange={(val) =>
                                updateItemField(idx, { damage_level: val as DamageLevelType })
                              }
                              variant="white"
                              menuTitle="Bảng mức độ hư hỏng & khấu trừ cọc"
                              minMenuWidth={320}
                              className="w-full"
                              ariaLabel={`Mức độ hư hỏng của ${item.serial_number}`}
                              options={DAMAGE_LEVEL_OPTIONS.map((opt) => ({
                                value: opt.value,
                                label: opt.label,
                                description: opt.description,
                                dotClass:
                                  opt.feePercent === 0
                                    ? 'bg-emerald-500'
                                    : opt.feePercent <= 15
                                    ? 'bg-amber-500'
                                    : 'bg-rose-600',
                              }))}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                              Phí thiếu phụ kiện (nắp/pin/thẻ...) ₫
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={50000}
                              value={item.missing_accessories_fee || 0}
                              onChange={(e) =>
                                updateItemField(idx, {
                                  missing_accessories_fee: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-full px-3.5 py-2 rounded-full bg-white border border-[#14171f]/15 text-xs font-semibold text-[#14171f] num"
                            />
                          </div>
                        </div>

                        {item.damage_level !== 'NONE' && (
                          <input
                            type="text"
                            value={item.damage_description || ''}
                            onChange={(e) => updateItemField(idx, { damage_description: e.target.value })}
                            placeholder="Mô tả chi tiết vị trí trầy xước / lỗi phần cứng để lưu Biên bản..."
                            className="w-full px-4 py-2 rounded-full bg-white border border-rose-200 text-xs text-[#14171f]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Section 3: Other Fees, Notes & Check-in Photos */}
                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#14171f]">
                      3. Ảnh Check-in (Tùy chọn) &amp; Phụ phí khác
                    </h4>
                    <label className="glass-button px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                      <Upload size={12} />
                      <span>Thêm ảnh lúc trả</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {photos.map((ph, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#14171f]/15 aspect-square bg-white">
                          <img src={ph.photo_data} alt={ph.caption} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                        Phụ phí phát sinh khác (₫)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={50000}
                        value={otherFee}
                        onChange={(e) => setOtherFee(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-3.5 py-2 rounded-full bg-white border border-[#14171f]/15 text-xs font-semibold text-[#14171f] num"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#4b5262] mb-1">
                        Phương thức hoàn cọc / thu bù
                      </label>
                      <GlassSelect
                        value={refundMethod}
                        onChange={(val) => setRefundMethod(val as 'BANK_TRANSFER' | 'CASH')}
                        variant="white"
                        align="right"
                        menuTitle="Phương thức thanh toán quyết toán"
                        minMenuWidth={250}
                        className="w-full"
                        ariaLabel="Phương thức hoàn cọc hoặc thu bù"
                        options={[
                          { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng (VietQR)' },
                          { value: 'CASH', label: 'Tiền mặt tại quầy ReFuji' },
                        ]}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={staffNotes}
                    onChange={(e) => setStaffNotes(e.target.value)}
                    placeholder="Ghi chú kiểm định của nhân viên khi nhận lại máy..."
                    className="w-full px-4 py-2 rounded-full bg-white border border-[#14171f]/15 text-xs text-[#14171f]"
                  />
                </div>

                {/* Live Settlement Summary Card */}
                {previewCalc && (
                  <div className="p-4 rounded-3xl bg-[#14171f] text-white space-y-2 text-xs num">
                    <div className="flex items-center justify-between text-white/75">
                      <span>Tiền cọc đang giữ:</span>
                      <span className="font-semibold text-white">{formatVnd(previewCalc.depositHeld)}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/75">
                      <span>Tổng phí khấu trừ (Trễ hạn + Hư hỏng + Phụ kiện + Khác):</span>
                      <span className="font-semibold text-amber-300">-{formatVnd(previewCalc.totalPenalty)}</span>
                    </div>
                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-sm font-bold">
                      <span>
                        {previewCalc.additionalChargeAmount > 0 ? 'Khách phải đóng bù thêm:' : 'Số tiền hoàn cọc cho khách:'}
                      </span>
                      <span className={previewCalc.additionalChargeAmount > 0 ? 'text-rose-300' : 'text-emerald-300'}>
                        {previewCalc.additionalChargeAmount > 0
                          ? formatVnd(previewCalc.additionalChargeAmount)
                          : formatVnd(previewCalc.refundAmount)}
                      </span>
                    </div>
                    {!dossier.order.is_guest && (
                      <div className="flex items-center justify-between text-[11px] text-white/75 pt-1">
                        <span className="flex items-center gap-1">
                          <Award size={12} />
                          <span>Biến động điểm Uy tín Thành viên:</span>
                        </span>
                        <span className={previewCalc.reputationDelta >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                          {previewCalc.reputationDelta >= 0 ? `+${previewCalc.reputationDelta}` : previewCalc.reputationDelta} điểm
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{errorMsg}</span>
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
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                  <span>{isSubmitting ? 'Đang quyết toán...' : 'Chốt Quyết Toán & Hoàn Cọc'}</span>
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
