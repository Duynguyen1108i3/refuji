import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Printer, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { fetchOrderDossier } from '../../services/dashboardApi';
import {
  ACCESSORY_CHECKLIST_ITEMS,
  ORDER_STATUS_META,
  OrderDossierData,
  PAYMENT_STATUS_META,
  formatVnd,
  formatShortDate,
  formatDateTime,
} from './dashboardTypes';
import {
  POPUP_BACKDROP_CLASS,
  buildPopupFrameClass,
  POPUP_INNER_CLASS,
  POPUP_CLOSE_BUTTON_CLASS,
  getBackdropDismissProps,
} from '../ui/popupTheme';

interface OrderDossierModalProps {
  orderCode: string | null;
  onClose: () => void;
}

export const OrderDossierModal: React.FC<OrderDossierModalProps> = ({ orderCode, onClose }) => {
  const [dossier, setDossier] = useState<OrderDossierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderCode) return;
    setIsLoading(true);
    setErrorMsg(null);
    fetchOrderDossier(orderCode)
      .then(setDossier)
      .catch((err) => setErrorMsg(err?.message || 'Không thể tải hồ sơ đơn hàng.'))
      .finally(() => setIsLoading(false));
  }, [orderCode]);

  if (!orderCode || typeof document === 'undefined') return null;

  const stMeta = dossier ? ORDER_STATUS_META[dossier.order.order_status] || ORDER_STATUS_META.PENDING : null;
  const payMeta = dossier ? PAYMENT_STATUS_META[dossier.order.payment_status] || PAYMENT_STATUS_META.UNPAID : null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      {...getBackdropDismissProps(onClose)}
      className={`${POPUP_BACKDROP_CLASS} z-[230] print-dossier-backdrop`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        className={`${buildPopupFrameClass('max-w-3xl', 'h-[88vh] max-h-[90vh]')} print-dossier-frame`}
      >
        <div className={`${POPUP_INNER_CLASS} print-dossier-inner`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hồ sơ"
            className={`${POPUP_CLOSE_BUTTON_CLASS} no-print`}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="pl-6 sm:pl-8 pr-16 py-5 pb-4 border-b border-[#14171f]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-serif text-xl sm:text-2xl text-[#14171f]">
                  Biên Bản &amp; Hồ Sơ Đơn Thuê
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#14171f] text-white text-[11px] font-bold num">
                  #{orderCode}
                </span>
              </div>
              <p className="text-xs text-[#5a6072] mt-0.5">
                REFUJI Camera Rental Studio • Tuân thủ Luật Căn cước 2023 (Không giữ giấy tờ gốc)
              </p>
            </div>

            {dossier && (
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print glass-button px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>In Biên bản</span>
              </button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-[#5a6072]">
              <Loader2 size={24} className="animate-spin text-[#14171f]" />
              <span className="text-xs">Đang truy xuất toàn bộ hồ sơ đơn hàng...</span>
            </div>
          ) : errorMsg || !dossier ? (
            <div className="p-8 text-center text-sm text-rose-700">{errorMsg || 'Không có dữ liệu.'}</div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5 space-y-5 pb-8 text-xs print-dossier-scroll">
              {/* Top Meta Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5a6072]">
                    Thông tin khách thuê
                  </div>
                  <p className="text-sm font-bold text-[#14171f]">{dossier.order.customer_name}</p>
                  <p className="text-[#4b5262] num">SĐT: {dossier.order.customer_phone || '—'}</p>
                  <p className="text-[#4b5262]">Email: {dossier.order.customer_email || '—'}</p>
                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#14171f]/15 text-[10.5px] font-semibold">
                      {dossier.order.is_guest ? 'Khách Vãng Lai' : `Thành viên ${dossier.order.membership_tier}`}
                    </span>
                    {dossier.checkout_record && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-semibold num">
                        KYC: ****{dossier.checkout_record.kyc_document_last4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-1.5 num">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5a6072]">
                    Lịch thuê &amp; Trạng thái
                  </div>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {stMeta && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${stMeta.bg} ${stMeta.text} ${stMeta.border}`}>
                        {stMeta.label}
                      </span>
                    )}
                    {payMeta && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${payMeta.badgeClass}`}>
                        {payMeta.label}
                      </span>
                    )}
                  </div>
                  <p>Nhận máy: <strong className="text-[#14171f]">{formatShortDate(dossier.order.start_date)}</strong></p>
                  <p>Hẹn trả: <strong className="text-[#14171f]">{formatShortDate(dossier.order.expected_return_date)}</strong></p>
                  <p>Tiền thuê: <strong className="text-[#14171f]">{formatVnd(dossier.order.total_rent)}</strong> • Cọc: <strong className="text-[#14171f]">{formatVnd(dossier.order.deposit_amount)}</strong></p>
                </div>
              </div>

              {/* Equipment & Serials */}
              <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5a6072]">
                  Thiết bị &amp; Serial đối chứng kho
                </div>
                <p className="font-semibold text-[#14171f] text-sm">{dossier.order.model_name}</p>
                {dossier.assigned_item_units.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {dossier.assigned_item_units.map((u) => (
                      <div key={u.serial_number} className="px-3 py-1.5 rounded-2xl bg-white border border-[#14171f]/15 text-xs num">
                        <strong className="text-[#14171f]">{u.serial_number}</strong>
                        <span className="text-[#5a6072] ml-2">({u.model_name} • {u.condition_percent}%)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#7e8596] italic">Chưa gán Serial cố định.</p>
                )}
              </div>

              {/* Checkout Record */}
              {dossier.checkout_record && (
                <div className="p-4 rounded-3xl bg-white border border-[#14171f]/12 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#14171f] flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Biên Bản Bàn Giao (Check-out)</span>
                    </span>
                    <span className="text-[11px] text-[#5a6072] num">
                      {formatDateTime(dossier.checkout_record.checkout_date)} • NV: {dossier.checkout_record.staff_name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCESSORY_CHECKLIST_ITEMS.map((acc) => (
                      <span
                        key={acc.key}
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] border ${
                          dossier.checkout_record?.accessories?.[acc.key]
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-400 line-through'
                        }`}
                      >
                        {acc.label}
                      </span>
                    ))}
                  </div>
                  {dossier.checkout_record.condition_notes && (
                    <p className="text-[#4b5262] bg-[#f7f8fa] p-2.5 rounded-2xl">
                      Ghi chú ban đầu: {dossier.checkout_record.condition_notes}
                    </p>
                  )}
                </div>
              )}

              {/* Return Record & Settlement */}
              {dossier.return_record && (
                <div className="p-4 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-2.5 num">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>Biên Bản Thu Hồi &amp; Quyết Toán (Check-in)</span>
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      {formatDateTime(dossier.return_record.actual_return_date)} • NV: {dossier.return_record.staff_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-2xl bg-white border border-emerald-200/80">
                      <div className="text-[10px] text-[#5a6072]">Cọc giữ ban đầu</div>
                      <div className="font-bold text-[#14171f]">{formatVnd(dossier.return_record.deposit_held)}</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white border border-emerald-200/80">
                      <div className="text-[10px] text-[#5a6072]">Phí trễ hạn</div>
                      <div className="font-bold text-rose-700">{formatVnd(dossier.return_record.total_late_fee)}</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white border border-emerald-200/80">
                      <div className="text-[10px] text-[#5a6072]">Phí hư hỏng / PK</div>
                      <div className="font-bold text-rose-700">
                        {formatVnd(
                          dossier.return_record.total_damage_fee +
                            dossier.return_record.total_missing_acc_fee +
                            dossier.return_record.other_fee
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white border border-emerald-200/80">
                      <div className="text-[10px] text-[#5a6072]">Hoàn cọc cho khách</div>
                      <div className="font-bold text-emerald-700">{formatVnd(dossier.return_record.refund_amount)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inspection Photos */}
              {dossier.inspection_photos.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#5a6072]">
                    Ảnh đối chứng Check-out &amp; Check-in ({dossier.inspection_photos.length})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {dossier.inspection_photos.map((ph) => (
                      <div key={ph.id} className="rounded-2xl overflow-hidden border border-[#14171f]/12 bg-white">
                        <img src={ph.photo_data} alt={ph.caption || ph.phase} className="w-full h-24 object-cover" />
                        <div className="px-2.5 py-1.5 text-[10px] flex items-center justify-between text-[#5a6072]">
                          <span className="font-bold text-[#14171f]">{ph.phase}</span>
                          <span className="truncate max-w-[90px]">{ph.serial_number || ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions */}
              <div className="p-4 rounded-3xl bg-[#f7f8fa] border border-[#14171f]/10 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5a6072]">
                  Lịch sử dòng tiền giao dịch ({dossier.transactions.length})
                </div>
                {dossier.transactions.length === 0 ? (
                  <p className="text-[#7e8596]">Chưa ghi nhận giao dịch nào cho đơn này.</p>
                ) : (
                  <div className="divide-y divide-[#14171f]/8">
                    {dossier.transactions.map((t) => (
                      <div key={t.id} className="py-2 flex items-center justify-between gap-3 num">
                        <div>
                          <span className="font-bold text-[#14171f]">{t.transaction_type}</span>
                          <span className="ml-2 text-[#5a6072]">({t.payment_method})</span>
                          <p className="text-[11px] text-[#5a6072]">{t.note}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-bold ${t.transaction_type === 'REFUND' ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {t.transaction_type === 'REFUND' ? '-' : '+'}
                            {formatVnd(t.amount)}
                          </span>
                          <p className="text-[10px] text-[#7e8596]">{formatDateTime(t.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
