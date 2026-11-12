import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, RefreshCw, Eye } from 'lucide-react';
import { fetchAuditLogs } from '../../services/dashboardApi';
import { AuditLogRow, formatDateTime } from './dashboardTypes';
import {
  POPUP_BACKDROP_CLASS,
  buildPopupFrameClass,
  POPUP_INNER_CLASS,
  POPUP_CLOSE_BUTTON_CLASS,
  getBackdropDismissProps,
} from '../ui/popupTheme';
import { GlassSelect } from './GlassSelect';

interface AuditLogsTabProps {
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshSignal: number;
}

const formatJsonPretty = (raw: string | null): string => {
  if (!raw) return '— (Không có dữ liệu trước đó)';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ onNotify, refreshSignal }) => {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [actorFilter, setActorFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [inspectLog, setInspectLog] = useState<AuditLogRow | null>(null);

  const loadLogs = useCallback(async (manual = false) => {
    setIsLoading(true);
    try {
      const [list] = await Promise.all([
        fetchAuditLogs({
          actor_type: actorFilter,
          entity_type: entityFilter,
          search: searchTerm,
        }),
        manual ? new Promise((r) => setTimeout(r, 450)) : Promise.resolve(),
      ]);
      setLogs(list);
      if (manual) {
        onNotify(`Đã làm mới ${list.length} bản ghi Audit Log`, 'success');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tải nhật ký kiểm toán.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [actorFilter, entityFilter, searchTerm, onNotify]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadLogs();
    }, 150);
    return () => clearTimeout(t);
  }, [loadLogs, refreshSignal]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
            <span>Nhật Ký Kiểm Toán &amp; Truy Vết Hệ Thống</span>
          </div>
          <h2 className="font-serif text-3xl text-[#14171f]">
            Audit Logs (User • Cron • Gateway)
          </h2>
          <p className="text-xs sm:text-sm text-[#5a6072] mt-1">
            Ghi nhận bất biến mọi thao tác duyệt đơn, xuất kho Check-out, quyết toán Check-in, đổi giá và tác vụ Cron ngầm.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs(true)}
          className="glass-button px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filters */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-[#62687a]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm hành động, mã đối tượng (#ORD..., SN...), diễn giải..."
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
            value={actorFilter}
            onChange={setActorFilter}
            menuTitle="Tác nhân thực hiện"
            align="right"
            minMenuWidth={250}
            className="min-w-[205px]"
            ariaLabel="Lọc theo tác nhân"
            options={[
              { value: 'ALL', label: 'Tất cả tác nhân' },
              { value: 'USER', label: 'Nhân viên / Khách (USER)', dotClass: 'bg-[#14171f]' },
              { value: 'SYSTEM_CRON', label: 'Tác vụ tự động (CRON)', dotClass: 'bg-amber-500' },
              { value: 'PAYMENT_WEBHOOK', label: 'Cổng thanh toán (WEBHOOK)', dotClass: 'bg-sky-500' },
            ]}
          />

          <GlassSelect
            value={entityFilter}
            onChange={setEntityFilter}
            menuTitle="Loại thực thể"
            align="right"
            minMenuWidth={255}
            className="min-w-[205px]"
            ariaLabel="Lọc theo thực thể"
            options={[
              { value: 'ALL', label: 'Tất cả thực thể' },
              { value: 'RentalOrder', label: 'Đơn thuê (RentalOrder)' },
              { value: 'ProductModel', label: 'Mẫu thiết bị (ProductModel)' },
              { value: 'ProductItem', label: 'Kho Serial (ProductItem)' },
              { value: 'User', label: 'Tài khoản (User)' },
              { value: 'PaymentTransaction', label: 'Giao dịch (PaymentTransaction)' },
            ]}
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="liquid-glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#14171f]/10 bg-[#f7f8fa] text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                <th className="py-3.5 px-5">Thời gian</th>
                <th className="py-3.5 px-4">Tác nhân</th>
                <th className="py-3.5 px-4">Hành động &amp; Đối tượng</th>
                <th className="py-3.5 px-4">Diễn giải nghiệp vụ</th>
                <th className="py-3.5 px-5 text-right">Dữ liệu Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14171f]/8">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#7e8596]">
                    {isLoading
                      ? 'Đang tải nhật ký kiểm toán...'
                      : 'Không có bản ghi nhật ký kiểm toán nào phù hợp bộ lọc.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f7f8fa]/70">
                    <td className="py-3.5 px-5 text-[#5a6072] num whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.actor_type === 'SYSTEM_CRON'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : log.actor_type === 'PAYMENT_WEBHOOK'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-neutral-100 text-[#14171f] border-neutral-200'
                        }`}
                      >
                        {log.actor_type}
                      </span>
                      <div className="text-[11px] font-medium text-[#14171f] mt-0.5">
                        {log.actor_user_name || log.actor_label || 'Hệ thống'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#14171f]">{log.action}</span>
                      <div className="text-[11px] text-[#5a6072] num mt-0.5">
                        {log.entity_type} #{log.entity_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-md text-[#4b5262]">
                      {log.description || '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectLog(log)}
                        className="glass-button px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={11} />
                        <span>Soi Diff</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Inspector Modal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {inspectLog && (
              <motion.div
                key="audit-diff-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setInspectLog(null))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-2xl', 'h-auto max-h-[85vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button type="button" onClick={() => setInspectLog(null)} className={POPUP_CLOSE_BUTTON_CLASS}>
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">Chi Tiết Thay Đổi: {inspectLog.action}</h3>
                    <p className="text-xs text-[#5a6072] num mt-0.5">
                      {inspectLog.entity_type} #{inspectLog.entity_id} • {formatDateTime(inspectLog.created_at)}
                    </p>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4 text-xs">
                    {inspectLog.description && (
                      <div className="p-3 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 text-[#14171f]">
                        {inspectLog.description}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                          Giá trị cũ (Old Value)
                        </span>
                        <pre className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200/70 text-[11px] text-[#14171f] overflow-x-auto whitespace-pre-wrap">
                          {formatJsonPretty(inspectLog.old_value)}
                        </pre>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                          Giá trị mới (New Value)
                        </span>
                        <pre className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 text-[11px] text-[#14171f] overflow-x-auto whitespace-pre-wrap">
                          {formatJsonPretty(inspectLog.new_value)}
                        </pre>
                      </div>
                    </div>
                  </div>
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
