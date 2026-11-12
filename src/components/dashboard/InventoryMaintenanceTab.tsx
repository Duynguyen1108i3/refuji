import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Wrench,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  completeMaintenanceTicket,
  createAdminItem,
  createMaintenanceTicket,
  fetchAdminItems,
  fetchAdminModels,
  fetchMaintenanceData,
  updateAdminItem,
} from '../../services/dashboardApi';
import {
  ITEM_STATUS_META,
  ItemStatusType,
  MaintenanceLogRow,
  ProductItemRow,
  ProductModelRow,
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

interface InventoryMaintenanceTabProps {
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDossier?: (orderCode: string) => void;
  refreshSignal: number;
}

export const InventoryMaintenanceTab: React.FC<InventoryMaintenanceTabProps> = ({
  onNotify,
  onOpenDossier,
  refreshSignal,
}) => {
  const [subTab, setSubTab] = useState<'serials' | 'maintenance'>('serials');
  const [items, setItems] = useState<ProductItemRow[]>([]);
  const [allItemsForCounts, setAllItemsForCounts] = useState<ProductItemRow[]>([]);
  const [models, setModels] = useState<ProductModelRow[]>([]);
  const [maintLogs, setMaintLogs] = useState<MaintenanceLogRow[]>([]);
  const [dueAlerts, setDueAlerts] = useState<ProductItemRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddSerialOpen, setIsAddSerialOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItemRow | null>(null);
  const [maintTargetItem, setMaintTargetItem] = useState<ProductItemRow | null>(null);
  const [completingLog, setCompletingLog] = useState<MaintenanceLogRow | null>(null);

  // Add Serial form
  const [newModelId, setNewModelId] = useState<number>(1);
  const [newSerialCode, setNewSerialCode] = useState('');
  const [newShutter, setNewShutter] = useState(0);
  const [newCondition, setNewCondition] = useState(100);
  const [newNote, setNewNote] = useState('');

  // Edit Serial form
  const [editStatus, setEditStatus] = useState<ItemStatusType>('AVAILABLE');
  const [editShutter, setEditShutter] = useState(0);
  const [editCondition, setEditCondition] = useState(98);
  const [editNextMaint, setEditNextMaint] = useState('');
  const [editNote, setEditNote] = useState('');

  // Create Maintenance form
  const [maintType, setMaintType] = useState('SENSOR_CLEANING');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState(250000);
  const [maintVendor, setMaintVendor] = useState('ReFuji Care Center');
  const [maintNextDate, setMaintNextDate] = useState('');

  // Complete Maintenance form
  const [completeCost, setCompleteCost] = useState(0);
  const [completeCond, setCompleteCond] = useState(98);
  const [completeNextDate, setCompleteNextDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async (manual = false) => {
    setIsLoading(true);
    try {
      const allPromise = fetchAdminItems({ search: searchTerm });
      const filteredPromise =
        statusFilter === 'ALL'
          ? allPromise
          : fetchAdminItems({ status: statusFilter, search: searchTerm });

      const [allRes, itemsRes, maintRes, modelsRes] = await Promise.all([
        allPromise,
        filteredPromise,
        fetchMaintenanceData(),
        fetchAdminModels(),
        manual ? new Promise((r) => setTimeout(r, 450)) : Promise.resolve(),
      ]);
      setAllItemsForCounts(allRes);
      setItems(itemsRes);
      setMaintLogs(maintRes.logs);
      setDueAlerts(maintRes.dueAlerts);
      setModels(modelsRes);
      if (modelsRes.length > 0 && !modelsRes.some((m) => m.id === newModelId)) {
        setNewModelId(modelsRes[0].id);
      }
      if (manual) {
        onNotify(`Đã làm mới ${itemsRes.length} cá thể Serial & bảo dưỡng`, 'success');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tải dữ liệu kho Serial.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, onNotify, newModelId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadData();
    }, 150);
    return () => clearTimeout(t);
  }, [loadData, refreshSignal]);

  const handleOpenEdit = (item: ProductItemRow) => {
    setEditingItem(item);
    setEditStatus(item.status);
    setEditShutter(item.shutter_count || 0);
    setEditCondition(item.condition_percent || 98);
    setEditNextMaint(item.next_maintenance_date ? item.next_maintenance_date.slice(0, 10) : '');
    setEditNote(item.note || '');
  };

  const handleOpenMaint = (item: ProductItemRow) => {
    setMaintTargetItem(item);
    setMaintType(item.shutter_count >= 10000 ? 'SENSOR_CLEANING' : 'GENERAL_INSPECTION');
    setMaintDesc(`Vệ sinh cảm biến & cân chỉnh tổng quát (${item.model_name})`);
    setMaintCost(250000);
    setMaintVendor('ReFuji Care Center');
    setMaintNextDate(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
  };

  const handleOpenComplete = (log: MaintenanceLogRow) => {
    setCompletingLog(log);
    setCompleteCost(log.cost || 250000);
    setCompleteCond(Math.max(95, log.condition_percent || 98));
    setCompleteNextDate(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
  };

  const handleCreateSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerialCode.trim()) {
      onNotify('Vui lòng nhập mã Serial vật lý.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await createAdminItem({
        model_id: newModelId,
        serial_number: newSerialCode.trim().toUpperCase(),
        shutter_count: newShutter,
        condition_percent: newCondition,
        note: newNote,
      });
      onNotify(res.message, 'success');
      setIsAddSerialOpen(false);
      setNewSerialCode('');
      setNewShutter(0);
      setNewCondition(100);
      setNewNote('');
      await loadData();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể nhập kho Serial.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await updateAdminItem(editingItem.id, {
        status: editStatus,
        shutter_count: editShutter,
        condition_percent: editCondition,
        next_maintenance_date: editNextMaint || null,
        note: editNote,
      });
      onNotify(res.message, 'success');
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể cập nhật Serial.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintTargetItem) return;
    setIsSaving(true);
    try {
      const res = await createMaintenanceTicket({
        item_id: maintTargetItem.id,
        maintenance_type: maintType,
        description: maintDesc,
        cost: maintCost,
        external_vendor: maintVendor,
        next_maintenance_date: maintNextDate,
      });
      onNotify(res.message, 'success');
      setMaintTargetItem(null);
      await loadData();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tạo phiếu bảo dưỡng.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingLog) return;
    setIsSaving(true);
    try {
      const res = await completeMaintenanceTicket(completingLog.id, {
        cost: completeCost,
        condition_percent: completeCond,
        next_maintenance_date: completeNextDate,
      });
      onNotify(res.message, 'success');
      setCompletingLog(null);
      await loadData();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể hoàn tất bảo dưỡng.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const statusCounts = {
    ALL: allItemsForCounts.length,
    AVAILABLE: allItemsForCounts.filter(
      (i) => i.status === 'AVAILABLE' && i.booking_kind !== 'RESERVED'
    ).length,
    RENTED: allItemsForCounts.filter((i) => i.status === 'RENTED').length,
    RESERVED: allItemsForCounts.filter(
      (i) => i.status === 'AVAILABLE' && i.booking_kind === 'RESERVED'
    ).length,
    MAINTENANCE: allItemsForCounts.filter((i) => i.status === 'MAINTENANCE').length,
    LOST: allItemsForCounts.filter((i) => i.status === 'LOST').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
            <span>Quản Lý Tài Sản Theo Serial</span>
          </div>
          <h2 className="font-serif text-3xl text-[#14171f]">
            Kho Serial &amp; Phiếu Bảo Dưỡng
          </h2>
          <p className="text-xs sm:text-sm text-[#5a6072] mt-1">
            Theo dõi Shutter Count, độ mới từng cá thể và khóa bảo dưỡng khi cần vệ sinh cảm biến.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void loadData(true)}
            className="glass-button px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddSerialOpen(true)}
            className="px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Nhập kho Serial mới</span>
          </button>
        </div>
      </div>

      {/* Subtab Pill Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 bg-white p-1.5 rounded-full border border-[#14171f]/10 shadow-xs">
          <button
            type="button"
            onClick={() => setSubTab('serials')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer num ${
              subTab === 'serials' ? 'bg-[#14171f] text-white' : 'text-[#5a6072] hover:text-[#14171f]'
            }`}
          >
            Kho Serial vật lý ({allItemsForCounts.length || items.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('maintenance')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 num ${
              subTab === 'maintenance' ? 'bg-[#14171f] text-white' : 'text-[#5a6072] hover:text-[#14171f]'
            }`}
          >
            <Wrench size={12} />
            <span>Bảo dưỡng &amp; Cảnh báo ({dueAlerts.length})</span>
          </button>
        </div>
      </div>

      {subTab === 'serials' ? (
        <>
          {/* Filter Card */}
          <div className="liquid-glass rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-[#62687a]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm số Serial (SN-...) hoặc tên mẫu máy..."
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

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'Tất cả', count: statusCounts.ALL },
                { id: 'AVAILABLE', label: 'Sẵn sàng', count: statusCounts.AVAILABLE },
                { id: 'RENTED', label: 'Đang thuê', count: statusCounts.RENTED },
                { id: 'RESERVED', label: 'Giữ lịch', count: statusCounts.RESERVED },
                { id: 'MAINTENANCE', label: 'Bảo dưỡng', count: statusCounts.MAINTENANCE },
                { id: 'LOST', label: 'Mất/Hỏng', count: statusCounts.LOST },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer num ${
                    statusFilter === st.id
                      ? 'bg-[#14171f] text-white border-[#14171f]'
                      : 'bg-white text-[#5a6072] border-[#14171f]/10 hover:text-[#14171f]'
                  }`}
                >
                  {st.label} ({st.count})
                </button>
              ))}
            </div>
          </div>

          {/* Serials Table */}
          <div className="liquid-glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#14171f]/10 bg-[#f7f8fa] text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                    <th className="py-3.5 px-5">Serial Number</th>
                    <th className="py-3.5 px-4">Mẫu thiết bị</th>
                    <th className="py-3.5 px-4 text-right">Shutter Count</th>
                    <th className="py-3.5 px-4">Độ mới</th>
                    <th className="py-3.5 px-4 text-center">Lượt thuê</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14171f]/8 text-xs">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#7e8596]">
                        {isLoading
                          ? 'Đang tải danh sách Serial...'
                          : 'Không tìm thấy cá thể Serial nào phù hợp với bộ lọc.'}
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const stMeta = ITEM_STATUS_META[item.status] || ITEM_STATUS_META.AVAILABLE;
                      const highShutter = Number(item.shutter_count) >= 10000;
                      return (
                        <tr key={item.id} className="hover:bg-[#f7f8fa]/70 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-[#14171f] num">{item.serial_number}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.model_name}
                                  className="w-9 h-9 object-contain product-stage-img shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-semibold text-[#14171f]">{item.model_name}</p>
                                <p className="text-[10.5px] text-[#7e8596]">{item.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right num">
                            <span className={highShutter ? 'font-bold text-amber-700' : 'text-[#14171f]'}>
                              {Number(item.shutter_count || 0).toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 num">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.condition_percent >= 94 ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${item.condition_percent}%` }}
                                />
                              </div>
                              <span className="font-semibold">{item.condition_percent}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center num font-semibold">{item.total_rental_count || 0}</td>
                          <td className="py-3.5 px-4">
                            {item.status === 'AVAILABLE' && item.booking_kind === 'RESERVED' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border whitespace-nowrap bg-amber-50 text-amber-800 border-amber-200">
                                Đang giữ lịch
                              </span>
                            ) : (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border whitespace-nowrap ${stMeta.bg} ${stMeta.text} ${stMeta.border}`}>
                                {stMeta.label}
                              </span>
                            )}
                            {item.active_order_code && (
                              <div className="mt-1 flex flex-wrap items-center gap-1 text-[10.5px] text-[#5a6072] num">
                                {onOpenDossier ? (
                                  <button
                                    type="button"
                                    onClick={() => onOpenDossier(item.active_order_code!)}
                                    className="font-bold text-[#14171f] hover:underline cursor-pointer"
                                    title="Mở hồ sơ đơn hàng này"
                                  >
                                    #{item.active_order_code}
                                  </button>
                                ) : (
                                  <span className="font-bold text-[#14171f]">#{item.active_order_code}</span>
                                )}
                                {item.active_start_date && item.active_end_date && (
                                  <span>
                                    • {formatShortDate(item.active_start_date).slice(0, 5)} →{' '}
                                    {formatShortDate(item.active_end_date).slice(0, 5)}
                                  </span>
                                )}
                                {item.active_customer_name && (
                                  <span className="truncate max-w-[140px]">• {item.active_customer_name}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="glass-button px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <Edit3 size={11} />
                                <span>Cập nhật</span>
                              </button>
                              <button
                                type="button"
                                disabled={item.status === 'RENTED'}
                                onClick={() => handleOpenMaint(item)}
                                className="px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Wrench size={11} />
                                <span>Bảo dưỡng</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Maintenance Subtab */
        <div className="space-y-6">
          {/* Due Alerts Grid */}
          <div className="liquid-glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-amber-600" />
              <h3 className="font-serif text-xl text-[#14171f]">
                Cảnh Báo Đến Hạn Bảo Dưỡng / Shutter &ge; 10,000
              </h3>
            </div>
            {dueAlerts.length === 0 ? (
              <p className="text-xs text-[#5a6072]">Không có thiết bị nào đến hạn bảo dưỡng.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dueAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#14171f] num">
                        {item.serial_number} <span className="font-normal text-[#5a6072]">• {item.model_name}</span>
                      </div>
                      <div className="text-[11px] text-[#5a6072] num mt-0.5">
                        Shutter: {Number(item.shutter_count).toLocaleString('vi-VN')} • Độ mới: {item.condition_percent}%
                      </div>
                    </div>
                    {item.status !== 'MAINTENANCE' && item.status !== 'RENTED' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenMaint(item)}
                        className="px-3 py-1.5 rounded-full bg-[#14171f] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                      >
                        Lập phiếu ngay
                      </button>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                        {item.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Logs History */}
          <div className="liquid-glass rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#14171f]/10">
              <h3 className="font-serif text-xl text-[#14171f]">Danh Sách Phiếu Bảo Dưỡng</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#14171f]/10 bg-[#f7f8fa] text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                    <th className="py-3 px-5">Serial &amp; Mẫu</th>
                    <th className="py-3 px-4">Hạng mục &amp; Mô tả</th>
                    <th className="py-3 px-4">Đơn vị thực hiện</th>
                    <th className="py-3 px-4 text-right">Chi phí</th>
                    <th className="py-3 px-4">Bắt đầu / Hoàn tất</th>
                    <th className="py-3 px-5 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14171f]/8">
                  {maintLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#7e8596]">
                        {isLoading
                          ? 'Đang tải phiếu bảo dưỡng...'
                          : 'Chưa có phiếu bảo dưỡng nào được ghi nhận.'}
                      </td>
                    </tr>
                  ) : (
                    maintLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#f7f8fa]/70">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#14171f] num">{log.serial_number}</div>
                          <div className="text-[11px] text-[#5a6072]">{log.model_name}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-semibold text-[#14171f]">
                            {log.maintenance_type}
                          </span>
                          <p className="text-[#4b5262] mt-1 line-clamp-2">{log.description}</p>
                        </td>
                        <td className="py-3.5 px-4 text-[#4b5262]">{log.external_vendor || log.performed_by_name}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#14171f] num whitespace-nowrap">
                          {formatVnd(log.cost)}
                        </td>
                        <td className="py-3.5 px-4 num text-[#5a6072]">
                          <div>BĐ: {formatShortDate(log.started_at)}</div>
                          {log.completed_at && <div className="text-emerald-700">HT: {formatShortDate(log.completed_at)}</div>}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {!log.completed_at ? (
                            <button
                              type="button"
                              onClick={() => handleOpenComplete(log)}
                              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                            >
                              <Check size={12} />
                              <span>Hoàn tất &amp; Mở kho</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] font-semibold">
                              Đã hoàn tất
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nhập kho Serial mới */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isAddSerialOpen && (
              <motion.div
                key="add-serial-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setIsAddSerialOpen(false))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-lg', 'h-auto max-h-[88vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button
                    type="button"
                    onClick={() => setIsAddSerialOpen(false)}
                    className={POPUP_CLOSE_BUTTON_CLASS}
                  >
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">Nhập Kho Cá Thể Serial Mới</h3>
                  </div>
                  <form onSubmit={handleCreateSerial} className="p-6 space-y-4 text-xs overflow-y-auto">
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Chọn mẫu thiết bị *</label>
                      <GlassSelect
                        value={String(newModelId)}
                        onChange={(val) => setNewModelId(Number(val))}
                        variant="surface"
                        menuTitle="Danh mục thiết bị ReFuji"
                        className="w-full"
                        options={models.map((m) => ({
                          value: String(m.id),
                          label: m.model_name,
                          badge: m.category,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Mã Serial Number *</label>
                      <input
                        type="text"
                        value={newSerialCode}
                        onChange={(e) => setNewSerialCode(e.target.value.toUpperCase())}
                        placeholder="VD: SN-XT5-NEW01"
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 text-xs font-bold num uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Shutter Count đầu</label>
                        <input
                          type="number"
                          min={0}
                          value={newShutter}
                          onChange={(e) => setNewShutter(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 text-xs num"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Độ mới (%)</label>
                        <input
                          type="number"
                          min={50}
                          max={100}
                          value={newCondition}
                          onChange={(e) => setNewCondition(Math.min(100, Math.max(50, Number(e.target.value) || 100)))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 text-xs num"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Ghi chú nhập kho</label>
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Hàng mới nhập chính hãng Fujifilm VN..."
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddSerialOpen(false)}
                        className="glass-button px-4 py-2 rounded-full font-semibold cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 rounded-full bg-[#14171f] text-white font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        {isSaving && <Loader2 size={13} className="animate-spin" />}
                        <span>Lưu vào kho</span>
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

      {/* Modal: Cập nhật thông số Serial */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {editingItem && (
              <motion.div
                key="edit-serial-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setEditingItem(null))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-lg', 'h-auto max-h-[88vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button type="button" onClick={() => setEditingItem(null)} className={POPUP_CLOSE_BUTTON_CLASS}>
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">Cập Nhật Serial {editingItem.serial_number}</h3>
                  </div>
                  <form onSubmit={handleSaveEditItem} className="p-6 space-y-4 text-xs overflow-y-auto">
                    {editingItem.booking_kind === 'DELIVERED' && editingItem.active_order_code && (
                      <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-[11.5px] leading-relaxed">
                        <p className="font-bold">
                          Đang khóa bởi đơn #{editingItem.active_order_code} ({editingItem.active_order_status})
                        </p>
                        <p className="mt-0.5">
                          Khách đang giữ máy ({formatShortDate(editingItem.active_start_date)} →{' '}
                          {formatShortDate(editingItem.active_end_date)}). Hãy vào tab{' '}
                          <strong>Đơn &amp; POS → Check-in Quyết toán</strong> để trả máy về kho AVAILABLE.
                        </p>
                      </div>
                    )}
                    {editingItem.booking_kind === 'RESERVED' && editingItem.active_order_code && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11.5px] leading-relaxed">
                        <p className="font-bold">
                          Đang có lịch giữ chỗ #{editingItem.active_order_code} ({editingItem.active_order_status})
                        </p>
                        <p className="mt-0.5">
                          Lịch thuê: {formatShortDate(editingItem.active_start_date)} →{' '}
                          {formatShortDate(editingItem.active_end_date)} ({editingItem.active_customer_name}).
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Trạng thái vận hành</label>
                      {editingItem.booking_kind === 'DELIVERED' ? (
                        <div className="w-full px-4 py-2.5 rounded-full bg-sky-50/70 border border-sky-200 text-sky-800 font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          <span>RENTED (Đang cho thuê — Khóa theo đơn #{editingItem.active_order_code})</span>
                        </div>
                      ) : (
                        <GlassSelect
                          value={editStatus}
                          onChange={(val) => setEditStatus(val as ItemStatusType)}
                          variant="surface"
                          menuTitle="Trạng thái cá thể Serial"
                          className="w-full"
                          options={[
                            { value: 'AVAILABLE', label: 'AVAILABLE (Sẵn sàng cho thuê)', dotClass: 'bg-emerald-500' },
                            { value: 'RENTED', label: 'RENTED (Đang cho thuê)', dotClass: 'bg-sky-500' },
                            { value: 'MAINTENANCE', label: 'MAINTENANCE (Bảo dưỡng)', dotClass: 'bg-amber-500' },
                            { value: 'LOST', label: 'LOST (Mất / Thanh lý)', dotClass: 'bg-rose-500' },
                          ]}
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Shutter Count</label>
                        <input
                          type="number"
                          min={0}
                          value={editShutter}
                          onChange={(e) => setEditShutter(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Độ mới (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={editCondition}
                          onChange={(e) => setEditCondition(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Ngày bảo dưỡng tiếp theo</label>
                      <input
                        type="date"
                        value={editNextMaint}
                        onChange={(e) => setEditNextMaint(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Ghi chú kỹ thuật</label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setEditingItem(null)} className="glass-button px-4 py-2 rounded-full font-semibold cursor-pointer">
                        Đóng
                      </button>
                      <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-full bg-[#14171f] text-white font-semibold cursor-pointer">
                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
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

      {/* Modal: Tạo phiếu bảo dưỡng */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {maintTargetItem && (
              <motion.div
                key="create-maint-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setMaintTargetItem(null))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-lg', 'h-auto max-h-[88vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button type="button" onClick={() => setMaintTargetItem(null)} className={POPUP_CLOSE_BUTTON_CLASS}>
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">Lập Phiếu Bảo Dưỡng</h3>
                    <p className="text-xs text-[#5a6072] num mt-0.5">{maintTargetItem.serial_number} • {maintTargetItem.model_name}</p>
                  </div>
                  <form onSubmit={handleCreateMaintSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Loại bảo dưỡng</label>
                      <GlassSelect
                        value={maintType}
                        onChange={setMaintType}
                        variant="surface"
                        menuTitle="Hạng mục kỹ thuật"
                        className="w-full"
                        options={[
                          { value: 'SENSOR_CLEANING', label: 'Vệ sinh cảm biến (Sensor Cleaning)' },
                          { value: 'REPAIR', label: 'Sửa chữa phần cứng / Ngàm' },
                          { value: 'CALIBRATION', label: 'Cân chỉnh quang học / AF' },
                          { value: 'GENERAL_INSPECTION', label: 'Kiểm định định kỳ' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Mô tả chi tiết *</label>
                      <input
                        type="text"
                        value={maintDesc}
                        onChange={(e) => setMaintDesc(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Chi phí dự kiến (₫)</label>
                        <input
                          type="number"
                          min={0}
                          step={50000}
                          value={maintCost}
                          onChange={(e) => setMaintCost(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Hẹn kỳ tiếp theo</label>
                        <input
                          type="date"
                          value={maintNextDate}
                          onChange={(e) => setMaintNextDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Đơn vị / Trung tâm kỹ thuật</label>
                      <input
                        type="text"
                        value={maintVendor}
                        onChange={(e) => setMaintVendor(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setMaintTargetItem(null)} className="glass-button px-4 py-2 rounded-full font-semibold cursor-pointer">
                        Hủy
                      </button>
                      <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-full bg-[#14171f] text-white font-semibold cursor-pointer">
                        {isSaving ? 'Đang tạo...' : 'Xác nhận & Khóa máy'}
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

      {/* Modal: Hoàn tất bảo dưỡng */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {completingLog && (
              <motion.div
                key="complete-maint-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setCompletingLog(null))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-lg', 'h-auto max-h-[88vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button type="button" onClick={() => setCompletingLog(null)} className={POPUP_CLOSE_BUTTON_CLASS}>
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">Hoàn Tất Bảo Dưỡng &amp; Mở Kho</h3>
                    <p className="text-xs text-[#5a6072] num mt-0.5">{completingLog.serial_number} • {completingLog.model_name}</p>
                  </div>
                  <form onSubmit={handleCompleteMaintSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Chi phí thực tế (₫)</label>
                        <input
                          type="number"
                          min={0}
                          step={50000}
                          value={completeCost}
                          onChange={(e) => setCompleteCost(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Độ mới sau bảo dưỡng (%)</label>
                        <input
                          type="number"
                          min={50}
                          max={100}
                          value={completeCond}
                          onChange={(e) => setCompleteCond(Math.min(100, Math.max(50, Number(e.target.value) || 98)))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Hẹn bảo dưỡng định kỳ lần sau</label>
                      <input
                        type="date"
                        value={completeNextDate}
                        onChange={(e) => setCompleteNextDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setCompletingLog(null)} className="glass-button px-4 py-2 rounded-full font-semibold cursor-pointer">
                        Hủy
                      </button>
                      <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer">
                        {isSaving ? 'Đang xử lý...' : 'Mở lại AVAILABLE'}
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
