import React, { useState } from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { PRODUCT_FIXTURES } from '../../services/catalog-fixtures.ts';
import { formatVND, ProductModelEntity } from '@refuji/shared';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const CatalogManagePage: React.FC = () => {
  const [items, setItems] = useState<ProductModelEntity[]>(PRODUCT_FIXTURES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductModelEntity | null>(null);

  return (
    <StaffPosLayout activeKey="catalog">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">QUẢN LÝ MẪU MÃ (PRODUCT MODELS)</h1>
            <p className="text-xs text-zinc-400">Định nghĩa danh mục máy, đơn giá thuê theo ngày và tiền cọc chuẩn</p>
          </div>
          <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Thêm mẫu thiết bị mới</span>
          </Button>
        </div>

        <div className="liquid-glass rounded-2xl border border-white/15 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono bg-white/5">
              <tr>
                <th className="p-4">Hình ảnh</th>
                <th className="p-4">Tên thiết bị</th>
                <th className="p-4">Phân loại</th>
                <th className="p-4">Hệ ngàm</th>
                <th className="p-4 text-right">Giá thuê/ngày</th>
                <th className="p-4 text-right">Tiền cọc gốc</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-white/[0.02]">
                  <td className="p-4">
                    <img src={it.imageUrl} alt={it.modelName} className="w-12 h-10 object-contain bg-zinc-900 rounded p-1" />
                  </td>
                  <td className="p-4 font-bold text-white">{it.modelName}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300">{it.category}</span></td>
                  <td className="p-4 font-mono">{it.mount}</td>
                  <td className="p-4 text-right font-bold text-emerald-400 num">{formatVND(it.baseRentalPricePerDay)}</td>
                  <td className="p-4 text-right font-semibold text-zinc-200 num">{formatVND(it.depositAmount)}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => setEditingItem(it)} className="p-1.5 text-zinc-400 hover:text-white mr-2" aria-label="Sửa">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-zinc-400 hover:text-rose-400" aria-label="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </StaffPosLayout>
  );
};
