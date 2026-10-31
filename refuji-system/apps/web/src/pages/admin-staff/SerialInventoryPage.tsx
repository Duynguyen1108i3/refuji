import React, { useState } from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { StatusBadge } from '../../components/badges/StatusBadge.tsx';
import { ItemStatus } from '@refuji/shared';
import { Layers, Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';

export const SerialInventoryPage: React.FC = () => {
  const [serials, setSerials] = useState([
    { id: 1, model: 'Fujifilm X-T5 Body Silver', serial: '3A014582', shutter: 4120, condition: 98, status: ItemStatus.AVAILABLE },
    { id: 2, model: 'Fujifilm X-T5 Body Silver', serial: '3A014905', shutter: 8350, condition: 95, status: ItemStatus.RENTED },
    { id: 3, model: 'Fujifilm X100VI Silver', serial: '4B008912', shutter: 2150, condition: 99, status: ItemStatus.AVAILABLE },
    { id: 4, model: 'Fujifilm X-S20 Body Black', serial: '3C029104', shutter: 6400, condition: 96, status: ItemStatus.MAINTENANCE },
    { id: 5, model: 'Fujinon XF 35mm f/1.4 R', serial: '1DA05421', shutter: 0, condition: 97, status: ItemStatus.AVAILABLE }
  ]);

  return (
    <StaffPosLayout activeKey="inventory">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">KHO CÁ THỂ THEO SERIAL (PRODUCT ITEMS)</h1>
            <p className="text-xs text-zinc-400">Quản lý định danh từng thân máy, ống kính thực tế trong kho Showroom</p>
          </div>
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Nhập Serial mới</span>
          </Button>
        </div>

        <div className="liquid-glass rounded-2xl border border-white/15 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono bg-white/5">
              <tr>
                <th className="p-4">Mã Serial</th>
                <th className="p-4">Thuộc Mẫu Máy</th>
                <th className="p-4 text-center">Số shot (Shutter)</th>
                <th className="p-4 text-center">Độ mới</th>
                <th className="p-4">Trạng thái kho</th>
                <th className="p-4 text-center">Bảo dưỡng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {serials.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 font-mono font-bold text-emerald-400 text-sm">{s.serial}</td>
                  <td className="p-4 font-semibold text-white">{s.model}</td>
                  <td className="p-4 text-center num text-white">{s.shutter > 0 ? `${s.shutter} shots` : 'N/A'}</td>
                  <td className="p-4 text-center num">{s.condition}%</td>
                  <td className="p-4"><StatusBadge status={s.status} type="item" /></td>
                  <td className="p-4 text-center">
                    <button className="text-xs text-emerald-400 hover:underline">Lập phiếu vệ sinh</button>
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
