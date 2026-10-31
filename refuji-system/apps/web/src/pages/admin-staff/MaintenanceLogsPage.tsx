import React from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Wrench, Plus, CheckCircle2, Clock } from 'lucide-react';

export const MaintenanceLogsPage: React.FC = () => {
  const logs = [
    {
      id: 'MT-202610-01',
      serial: '3C029104',
      model: 'Fujifilm X-S20 Body Black',
      type: 'Vệ sinh cảm biến & Cập nhật Firmware v1.30',
      shutterAtService: 6400,
      technician: 'Lê Hoàng Nam',
      status: 'IN_PROGRESS',
      date: '28/10/2026'
    },
    {
      id: 'MT-202609-12',
      serial: '3A014582',
      model: 'Fujifilm X-T5 Body Silver',
      type: 'Bảo dưỡng định kỳ mốc 5.000 shots',
      shutterAtService: 4120,
      technician: 'Trần Văn An',
      status: 'COMPLETED',
      date: '15/09/2026'
    }
  ];

  return (
    <StaffPosLayout activeKey="maintenance">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">PHIẾU BẢO DƯỠNG & VỆ SINH CẢM BIẾN</h1>
            <p className="text-xs text-zinc-400">Theo dõi chu kỳ bảo dưỡng 10.000 shots và kiểm định độ sạch cảm biến</p>
          </div>
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tạo phiếu bảo dưỡng mới</span>
          </Button>
        </div>

        <div className="liquid-glass rounded-2xl border border-white/15 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono bg-white/5">
              <tr>
                <th className="p-4">Mã phiếu</th>
                <th className="p-4">Số Serial & Thiết bị</th>
                <th className="p-4">Nội dung bảo dưỡng</th>
                <th className="p-4 text-center">Số shot</th>
                <th className="p-4">Kỹ thuật viên</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 font-mono font-bold text-white">{log.id}</td>
                  <td className="p-4">
                    <span className="font-mono text-emerald-400 font-bold block">{log.serial}</span>
                    <span className="text-zinc-400 text-[11px]">{log.model}</span>
                  </td>
                  <td className="p-4 text-zinc-200">{log.type}</td>
                  <td className="p-4 text-center num text-white">{log.shutterAtService}</td>
                  <td className="p-4 text-zinc-300">{log.technician}</td>
                  <td className="p-4 text-center">
                    {log.status === 'COMPLETED' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Đang bảo dưỡng
                      </span>
                    )}
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
