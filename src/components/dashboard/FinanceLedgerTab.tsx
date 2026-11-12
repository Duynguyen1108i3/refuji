import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchPaymentsLedger,
  recordManualPayment,
} from '../../services/dashboardApi';
import {
  PaymentTransactionRow,
  formatVnd,
  formatDateTime,
} from './dashboardTypes';
import {
  POPUP_BACKDROP_CLASS,
  buildPopupFrameClass,
  POPUP_INNER_CLASS,
  POPUP_CLOSE_BUTTON_CLASS,
  getBackdropDismissProps,
} from '../ui/popupTheme';
import { GlassSelect } from './GlassSelect';

interface FinanceLedgerTabProps {
  onOpenDossier: (orderCode: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshSignal: number;
}

const TX_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Tiền cọc',
  RENTAL_FEE: 'Tiền thuê',
  FULL_BOOKING: 'Thu trọn đơn',
  LATE_FEE: 'Phạt trễ hạn',
  DAMAGE_FEE: 'Bồi thường hư hỏng',
  OTHER_FEE: 'Phụ phí khác',
  REFUND: 'Hoàn cọc khách',
};

export const FinanceLedgerTab: React.FC<FinanceLedgerTabProps> = ({
  onOpenDossier,
  onNotify,
  refreshSignal,
}) => {
  const [transactions, setTransactions] = useState<PaymentTransactionRow[]>([]);
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalDeposits: 0,
    totalRefunds: 0,
    totalPenalties: 0,
    netCashflow: 0,
  });
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualOrderCode, setManualOrderCode] = useState('');
  const [manualAmount, setManualAmount] = useState(500000);
  const [manualMethod, setManualMethod] = useState('CASH');
  const [manualType, setManualType] = useState('RENTAL_FEE');
  const [manualNote, setManualNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadLedger = useCallback(async (manual = false) => {
    setIsLoading(true);
    try {
      const [res] = await Promise.all([
        fetchPaymentsLedger({
          type: typeFilter,
          method: methodFilter,
          search: searchTerm,
        }),
        manual ? new Promise((r) => setTimeout(r, 450)) : Promise.resolve(),
      ]);
      setTransactions(res.transactions);
      setSummary(res.summary);
      if (manual) {
        onNotify(`Đã đối soát mới ${res.transactions.length} giao dịch sổ cái`, 'success');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tải sổ cái giao dịch.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, methodFilter, searchTerm, onNotify]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadLedger();
    }, 150);
    return () => clearTimeout(t);
  }, [loadLedger, refreshSignal]);

  const handleRecordManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderCode.trim() || manualAmount <= 0) {
      onNotify('Vui lòng nhập đúng mã đơn hàng và số tiền > 0₫.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await recordManualPayment({
        order_code: manualOrderCode.trim(),
        amount: manualAmount,
        payment_method: manualMethod,
        transaction_type: manualType,
        note: manualNote.trim(),
      });
      onNotify(res.message, 'success');
      setIsManualOpen(false);
      setManualOrderCode('');
      setManualNote('');
      await loadLedger();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể ghi nhận giao dịch.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
            <span>Sổ Cái Giao Dịch VNPAY / VietQR / Quầy</span>
          </div>
          <h2 className="font-serif text-3xl text-[#14171f]">
            Tài Chính &amp; Đối Soát Dòng Tiền
          </h2>
          <p className="text-xs sm:text-sm text-[#5a6072] mt-1">
            Mọi khoản cọc, thu tiền thuê tại quầy, phí phạt trễ/hư hỏng và lệnh hoàn cọc được đối soát tại đây.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void loadLedger(true)}
            className="glass-button px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={() => setIsManualOpen(true)}
            className="px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Ghi nhận thu / hoàn tiền tại quầy</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass rounded-3xl p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
            Tổng thu ghi nhận
          </span>
          <div className="text-2xl font-bold text-[#14171f] num mt-2 whitespace-nowrap">
            {formatVnd(summary.totalCollected)}
          </div>
        </div>
        <div className="liquid-glass rounded-3xl p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
            Tổng tiền cọc đã nhận
          </span>
          <div className="text-2xl font-bold text-amber-700 num mt-2 whitespace-nowrap">
            {formatVnd(summary.totalDeposits)}
          </div>
        </div>
        <div className="liquid-glass rounded-3xl p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
            Tổng đã hoàn cọc khách
          </span>
          <div className="text-2xl font-bold text-sky-700 num mt-2 whitespace-nowrap">
            {formatVnd(summary.totalRefunds)}
          </div>
        </div>
        <div className="liquid-glass rounded-3xl p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
            Dòng tiền ròng tại quỹ
          </span>
          <div className="text-2xl font-bold text-emerald-700 num mt-2 whitespace-nowrap">
            {formatVnd(summary.netCashflow)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-[#62687a]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã giao dịch (#TXN...), mã đơn (#ORD...), ghi chú..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full crystal-liquid-lens text-xs sm:text-sm text-[#14171f] focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#14171f]/10 hover:bg-[#14171f]/20 text-[#14171f] flex items-center justify-center cursor-pointer"
            >
              <X size={11} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GlassSelect
            value={typeFilter}
            onChange={setTypeFilter}
            menuTitle="Loại giao dịch"
            align="right"
            minMenuWidth={240}
            className="min-w-[205px]"
            ariaLabel="Lọc theo loại giao dịch"
            options={[
              { value: 'ALL', label: 'Tất cả loại giao dịch' },
              { value: 'DEPOSIT', label: 'Tiền cọc (DEPOSIT)', dotClass: 'bg-amber-500' },
              { value: 'RENTAL_FEE', label: 'Tiền thuê (RENTAL_FEE)', dotClass: 'bg-emerald-500' },
              { value: 'LATE_FEE', label: 'Phí trễ hạn (LATE_FEE)', dotClass: 'bg-rose-500' },
              { value: 'DAMAGE_FEE', label: 'Phí hư hỏng (DAMAGE_FEE)', dotClass: 'bg-rose-600' },
              { value: 'REFUND', label: 'Hoàn cọc (REFUND)', dotClass: 'bg-sky-500' },
            ]}
          />

          <GlassSelect
            value={methodFilter}
            onChange={setMethodFilter}
            menuTitle="Kênh thanh toán"
            align="right"
            minMenuWidth={220}
            className="min-w-[195px]"
            ariaLabel="Lọc theo kênh thanh toán"
            options={[
              { value: 'ALL', label: 'Tất cả kênh thanh toán' },
              { value: 'VIETQR', label: 'VietQR' },
              { value: 'VNPAY', label: 'VNPAY' },
              { value: 'CASH', label: 'Tiền mặt tại quầy' },
              { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng' },
            ]}
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="liquid-glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#14171f]/10 bg-[#f7f8fa] text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                <th className="py-3.5 px-5">Mã giao dịch</th>
                <th className="py-3.5 px-4">Đơn hàng &amp; Khách</th>
                <th className="py-3.5 px-4">Loại &amp; Kênh</th>
                <th className="py-3.5 px-4">Diễn giải</th>
                <th className="py-3.5 px-4 text-right">Số tiền</th>
                <th className="py-3.5 px-5 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14171f]/8">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#7e8596]">
                    {isLoading
                      ? 'Đang tải sổ cái giao dịch...'
                      : 'Chưa có giao dịch tài chính nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isRefund = tx.transaction_type === 'REFUND';
                  return (
                    <tr key={tx.id} className="hover:bg-[#f7f8fa]/70">
                      <td className="py-3.5 px-5 font-bold text-[#14171f] num">{tx.transaction_code}</td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onOpenDossier(tx.order_code)}
                          className="font-bold text-[#14171f] hover:underline num cursor-pointer"
                        >
                          #{tx.order_code}
                        </button>
                        <div className="text-[11px] text-[#5a6072]">{tx.customer_name}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border whitespace-nowrap ${
                              isRefund
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : 'bg-neutral-100 text-[#14171f] border-neutral-200'
                            }`}
                          >
                            {TX_TYPE_LABELS[tx.transaction_type] || tx.transaction_type}
                          </span>
                          <span className="text-[11px] text-[#5a6072] font-medium whitespace-nowrap">{tx.payment_method}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-[#4b5262]">
                        <p className="line-clamp-1">{tx.note}</p>
                        <p className="text-[10.5px] text-[#7e8596]">Xử lý: {tx.processed_by_name || 'Hệ thống'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold num whitespace-nowrap">
                        <span className={isRefund ? 'text-rose-700' : 'text-emerald-700'}>
                          {isRefund ? '-' : '+'}
                          {formatVnd(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right text-[#5a6072] num whitespace-nowrap">
                        {formatDateTime(tx.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ghi nhận giao dịch tại quầy */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isManualOpen && (
              <motion.div
                key="manual-payment-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setIsManualOpen(false))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-lg', 'h-auto max-h-[85vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button type="button" onClick={() => setIsManualOpen(false)} className={POPUP_CLOSE_BUTTON_CLASS}>
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">Ghi Nhận Giao Dịch Tại Quầy</h3>
                  </div>
                  <form onSubmit={handleRecordManual} className="p-6 space-y-4 text-xs overflow-y-auto">
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Mã đơn hàng *</label>
                      <input
                        type="text"
                        value={manualOrderCode}
                        onChange={(e) => setManualOrderCode(e.target.value.toUpperCase())}
                        placeholder="VD: ORD-123456"
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 font-bold num uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Loại giao dịch</label>
                        <GlassSelect
                          value={manualType}
                          onChange={setManualType}
                          variant="surface"
                          menuTitle="Phân loại thu / chi"
                          className="w-full"
                          options={[
                            { value: 'DEPOSIT', label: 'Thu tiền cọc' },
                            { value: 'RENTAL_FEE', label: 'Thu tiền thuê' },
                            { value: 'LATE_FEE', label: 'Thu phí trễ hạn' },
                            { value: 'DAMAGE_FEE', label: 'Thu phí hư hỏng' },
                            { value: 'REFUND', label: 'Chi hoàn tiền cọc' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Kênh thanh toán</label>
                        <GlassSelect
                          value={manualMethod}
                          onChange={setManualMethod}
                          variant="surface"
                          align="right"
                          menuTitle="Kênh thanh toán"
                          className="w-full"
                          options={[
                            { value: 'CASH', label: 'Tiền mặt (CASH)' },
                            { value: 'BANK_TRANSFER', label: 'Chuyển khoản NH' },
                            { value: 'VIETQR', label: 'VietQR' },
                            { value: 'VNPAY', label: 'VNPAY' },
                          ]}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Số tiền (₫) *</label>
                      <input
                        type="number"
                        min={1000}
                        step={50000}
                        value={manualAmount}
                        onChange={(e) => setManualAmount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Diễn giải nội dung</label>
                      <input
                        type="text"
                        value={manualNote}
                        onChange={(e) => setManualNote(e.target.value)}
                        placeholder="Khách đóng thêm / Hoàn tiền thừa tại quầy..."
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsManualOpen(false)} className="glass-button px-4 py-2 rounded-full font-semibold cursor-pointer">
                        Hủy
                      </button>
                      <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-full bg-[#14171f] text-white font-semibold cursor-pointer flex items-center gap-1.5">
                        {isSaving && <Loader2 size={13} className="animate-spin" />}
                        <span>Lưu giao dịch</span>
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
