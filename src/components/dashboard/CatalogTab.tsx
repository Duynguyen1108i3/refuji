import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  createAdminModel,
  fetchAdminModels,
  toggleAdminModelStatus,
  updateAdminModel,
} from '../../services/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import { ProductModelRow, formatVnd } from './dashboardTypes';
import {
  POPUP_BACKDROP_CLASS,
  buildPopupFrameClass,
  POPUP_INNER_CLASS,
  POPUP_CLOSE_BUTTON_CLASS,
  getBackdropDismissProps,
} from '../ui/popupTheme';
import { GlassSelect } from './GlassSelect';
import { detectCameraSeries } from '../../utils/cameraSeries';

interface CatalogTabProps {
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshSignal: number;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({ onNotify, refreshSignal }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [models, setModels] = useState<ProductModelRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'BODY' | 'LENS' | 'ACCESSORY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingModel, setEditingModel] = useState<ProductModelRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState<'BODY' | 'LENS' | 'ACCESSORY'>('BODY');
  const [formMount, setFormMount] = useState<'X_MOUNT' | 'G_MOUNT' | 'NONE'>('X_MOUNT');
  const [formPrice, setFormPrice] = useState(400000);
  const [formDeposit, setFormDeposit] = useState(5000000);
  const [formImage, setFormImage] = useState('/assets/camera-xt5.png');
  const [formDesc, setFormDesc] = useState('');
  const [formInitialSerial, setFormInitialSerial] = useState('');

  const loadModels = useCallback(async (manual = false) => {
    setIsLoading(true);
    try {
      const [list] = await Promise.all([
        fetchAdminModels({ category: categoryFilter, search: searchTerm }),
        manual ? new Promise((r) => setTimeout(r, 450)) : Promise.resolve(),
      ]);
      setModels(list);
      if (manual) {
        onNotify(`Đã làm mới ${list.length} mẫu thiết bị trong danh mục`, 'success');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Không thể tải danh mục thiết bị.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, searchTerm, onNotify]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadModels();
    }, 150);
    return () => clearTimeout(t);
  }, [loadModels, refreshSignal]);

  const openCreateModal = () => {
    setEditingModel(null);
    setModalMode('create');
    setFormName('');
    setFormCat('BODY');
    setFormMount('X_MOUNT');
    setFormPrice(450000);
    setFormDeposit(6000000);
    setFormImage('/assets/camera-xt5.png');
    setFormDesc('');
    setFormInitialSerial('');
  };

  const openEditModal = (m: ProductModelRow) => {
    setEditingModel(m);
    setModalMode('edit');
    setFormName(m.model_name);
    setFormCat(m.category);
    setFormMount(m.mount_type || 'NONE');
    setFormPrice(m.base_rental_price_per_day);
    setFormDeposit(m.deposit_amount);
    setFormImage(m.image_url || '');
    setFormDesc(m.description || '');
    setFormInitialSerial('');
  };

  const handleToggleVisibility = async (m: ProductModelRow) => {
    try {
      const res = await toggleAdminModelStatus(m.id, !m.is_active);
      onNotify(res.message, 'success');
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      await loadModels();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể đổi trạng thái hiển thị.', 'error');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onNotify('Tên mẫu thiết bị không được bỏ trống.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        const res = await createAdminModel({
          model_name: formName.trim(),
          category: formCat,
          mount_type: formMount,
          base_rental_price_per_day: formPrice,
          deposit_amount: formDeposit,
          image_url: formImage.trim(),
          description: formDesc.trim(),
          initial_serial: formInitialSerial.trim() || undefined,
        });
        onNotify(res.message, 'success');
      } else if (modalMode === 'edit' && editingModel) {
        const res = await updateAdminModel(editingModel.id, {
          model_name: formName.trim(),
          category: formCat,
          mount_type: formMount,
          base_rental_price_per_day: formPrice,
          deposit_amount: formDeposit,
          image_url: formImage.trim(),
          description: formDesc.trim(),
        });
        onNotify(res.message, 'success');
      }
      window.dispatchEvent(new CustomEvent('refuji_catalog_refresh'));
      setModalMode(null);
      await loadModels();
    } catch (err: any) {
      onNotify(err?.message || 'Không thể lưu cấu hình mẫu thiết bị.', 'error');
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
            <span>Catalog Sản Phẩm Fujifilm</span>
          </div>
          <h2 className="font-serif text-3xl text-[#14171f]">
            Quản Lý Danh Mục &amp; Bảng Giá Thuê
          </h2>
          <p className="text-xs sm:text-sm text-[#5a6072] mt-1">
            {isAdmin
              ? 'Toàn quyền thêm mới, chỉnh đơn giá/tiền cọc và ẩn/hiện mẫu thiết bị trên trang khách.'
              : 'Nhân viên xem bảng giá & tồn kho thực tế (Chỉnh sửa bảng giá yêu cầu quyền ADMIN).'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void loadModels(true)}
            className="glass-button px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-full bg-[#14171f] hover:bg-[#262c3a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Thêm mẫu thiết bị</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-[#62687a]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên máy ảnh, ống kính XF/GF, phụ kiện..."
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
            { id: 'ALL', label: `Tất cả (${models.length})` },
            { id: 'BODY', label: 'Thân máy (Body)' },
            { id: 'LENS', label: 'Ống kính (Lens)' },
            { id: 'ACCESSORY', label: 'Phụ kiện' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-[#14171f] text-white border-[#14171f]'
                  : 'bg-white text-[#5a6072] border-[#14171f]/10 hover:text-[#14171f]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Models Table */}
      <div className="liquid-glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#14171f]/10 bg-[#f7f8fa] text-[11px] font-semibold uppercase tracking-wider text-[#5a6072]">
                <th className="py-3.5 px-5">Mẫu thiết bị</th>
                <th className="py-3.5 px-4">Nhóm / Ngàm</th>
                <th className="py-3.5 px-4 text-right">Giá thuê / ngày</th>
                <th className="py-3.5 px-4 text-right">Tiền cọc</th>
                <th className="py-3.5 px-4 text-center">Kho thực tế</th>
                <th className="py-3.5 px-4">Hiển thị</th>
                {isAdmin && <th className="py-3.5 px-5 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14171f]/8">
              {models.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-10 text-center text-[#7e8596]">
                    {isLoading
                      ? 'Đang tải danh mục thiết bị...'
                      : 'Không tìm thấy mẫu thiết bị nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                models.map((m) => (
                  <tr key={m.id} className={`hover:bg-[#f7f8fa]/70 ${!m.is_active ? 'opacity-60' : ''}`}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/8 flex items-center justify-center shrink-0 p-1">
                          <img
                            src={m.image_url || '/assets/camera-xt5.png'}
                            alt={m.model_name}
                            className="w-full h-full object-contain product-stage-img"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[#14171f]">{m.model_name}</p>
                          <p className="text-[11px] text-[#7e8596] num">ID #{m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-100 text-[10.5px] font-semibold text-[#14171f] whitespace-nowrap">
                        {m.category}
                      </span>
                      <span className="ml-1.5 text-[11px] text-[#5a6072] whitespace-nowrap">
                        {m.category === 'BODY'
                          ? `${detectCameraSeries(m.model_name)} Series · ${m.mount_type}`
                          : m.category === 'ACCESSORY' && m.specs_json?.type
                          ? m.specs_json.type
                          : m.mount_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#14171f] num whitespace-nowrap">
                      {formatVnd(m.base_rental_price_per_day)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#4b5262] num whitespace-nowrap">
                      {formatVnd(m.deposit_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center num whitespace-nowrap">
                      {(() => {
                        const freeNow =
                          m.storefront_available_units ??
                          Math.max(0, (m.available_units || 0) - (m.reserved_units || 0));
                        const rentedCount = m.rented_units || 0;
                        const reservedCount = m.reserved_units || 0;
                        const maintCount = m.maintenance_units || 0;
                        return (
                          <div>
                            <div>
                              <span className={`font-bold ${freeNow > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {freeNow}
                              </span>
                              <span className="text-[#7e8596]">
                                {' '}
                                / {m.total_units || 0} {m.category === 'ACCESSORY' ? 'thiết bị' : 'máy'}
                              </span>
                            </div>
                            {(rentedCount > 0 || reservedCount > 0 || maintCount > 0) && (
                              <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                                {rentedCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-semibold">
                                    {rentedCount} đang thuê
                                  </span>
                                )}
                                {reservedCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                                    {reservedCount} giữ lịch
                                  </span>
                                )}
                                {maintCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-[10px] font-semibold">
                                    {maintCount} bảo dưỡng
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border whitespace-nowrap ${
                          m.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}
                      >
                        {m.is_active ? 'Đang hiển thị' : 'Đang ẩn'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            className="glass-button px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Edit3 size={11} />
                            <span>Sửa giá</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(m)}
                            className="glass-button p-1.5 rounded-full cursor-pointer shrink-0"
                            title={m.is_active ? 'Tạm ẩn trên trang khách' : 'Bật hiển thị lại'}
                          >
                            {m.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Model Modal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {modalMode && (
              <motion.div
                key="catalog-model-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getBackdropDismissProps(() => setModalMode(null))}
                className={`${POPUP_BACKDROP_CLASS} z-[220]`}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className={buildPopupFrameClass('max-w-xl', 'h-auto max-h-[88vh]')}
              >
                <div className={POPUP_INNER_CLASS}>
                  <button type="button" onClick={() => setModalMode(null)} className={POPUP_CLOSE_BUTTON_CLASS}>
                    <X size={16} />
                  </button>
                  <div className="px-6 py-5 border-b border-[#14171f]/10 pr-14">
                    <h3 className="font-serif text-xl text-[#14171f]">
                      {modalMode === 'create' ? 'Thêm Mẫu Thiết Bị Mới' : `Chỉnh Sửa: ${editingModel?.model_name}`}
                    </h3>
                  </div>
                  <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs overflow-y-auto">
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Tên mẫu thiết bị *</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="VD: FUJIFILM X-T50 Silver"
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Phân loại</label>
                        <GlassSelect
                          value={formCat}
                          onChange={(val) => setFormCat(val as 'BODY' | 'LENS' | 'ACCESSORY')}
                          variant="surface"
                          menuTitle="Nhóm thiết bị"
                          className="w-full"
                          options={[
                            { value: 'BODY', label: 'Thân máy (BODY)' },
                            { value: 'LENS', label: 'Ống kính (LENS)' },
                            { value: 'ACCESSORY', label: 'Phụ kiện (ACCESSORY)' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Hệ ngàm</label>
                        <GlassSelect
                          value={formMount}
                          onChange={(val) => setFormMount(val as 'X_MOUNT' | 'G_MOUNT' | 'NONE')}
                          variant="surface"
                          align="right"
                          menuTitle="Hệ ngàm Fujifilm"
                          className="w-full"
                          options={[
                            { value: 'X_MOUNT', label: 'X_MOUNT (APS-C)' },
                            { value: 'G_MOUNT', label: 'G_MOUNT (Medium Format)' },
                            { value: 'NONE', label: 'NONE (Phụ kiện chung)' },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Giá thuê / ngày (₫)</label>
                        <input
                          type="number"
                          min={0}
                          step={50000}
                          value={formPrice}
                          onChange={(e) => setFormPrice(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">Tiền cọc mặc định (₫)</label>
                        <input
                          type="number"
                          min={0}
                          step={500000}
                          value={formDeposit}
                          onChange={(e) => setFormDeposit(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Đường dẫn hình ảnh</label>
                      <input
                        type="text"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15"
                      />
                    </div>
                    {modalMode === 'create' && (
                      <div>
                        <label className="block font-semibold text-[#14171f] mb-1">
                          Serial nhập kho đầu tiên (Tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={formInitialSerial}
                          onChange={(e) => setFormInitialSerial(e.target.value.toUpperCase())}
                          placeholder="VD: SN-NEW-001"
                          className="w-full px-4 py-2.5 rounded-full bg-[#f7f8fa] border border-[#14171f]/15 num uppercase"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block font-semibold text-[#14171f] mb-1">Mô tả chi tiết</label>
                      <textarea
                        rows={2}
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#f7f8fa] border border-[#14171f]/15"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setModalMode(null)} className="glass-button px-4 py-2 rounded-full font-semibold cursor-pointer">
                        Hủy
                      </button>
                      <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-full bg-[#14171f] text-white font-semibold cursor-pointer flex items-center gap-1.5">
                        {isSaving && <Loader2 size={13} className="animate-spin" />}
                        <span>{modalMode === 'create' ? 'Tạo mẫu mới' : 'Lưu cập nhật'}</span>
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
