import React from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { DollarSign, Package, AlertTriangle, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { formatVND } from '@refuji/shared';

export const DashboardReportPage: React.FC = () => {
  return (
    <StaffPosLayout activeKey="dashboard">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">TỔNG QUAN TÌNH TRẠNG SHOWROOM</h1>
            <p className="text-xs text-zinc-400">Dữ liệu thời gian thực cập nhật mốc 30/10/2026</p>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="liquid-glass rounded-2xl p-5 border border-white/15">
            <span className="text-xs text-zinc-400 block mb-1">Doanh thu thuê tháng 10</span>
            <span className="text-2xl font-bold text-emerald-400 num">128.450.000đ</span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% so với tháng trước</span>
            </div>
          </div>

          <div className="liquid-glass rounded-2xl p-5 border border-white/15">
            <span className="text-xs text-zinc-400 block mb-1">Tỷ lệ lấp đầy kho (Occupancy)</span>
            <span className="text-2xl font-bold text-white num">84.2%</span>
            <p className="text-[11px] text-zinc-400 mt-2">32/38 thiết bị đang được thuê</p>
          </div>

          <div className="liquid-glass rounded-2xl p-5 border border-white/15">
            <span className="text-xs text-zinc-400 block mb-1">Đơn cần duyệt hôm nay</span>
            <span className="text-2xl font-bold text-amber-400 num">5 đơn</span>
            <p className="text-[11px] text-amber-300 mt-2">Khách hẹn nhận trước 16:00</p>
          </div>

          <div className="liquid-glass rounded-2xl p-5 border border-rose-500/30 bg-rose-950/10">
            <span className="text-xs text-zinc-400 block mb-1">Cảnh báo quá hạn (Overdue)</span>
            <span className="text-2xl font-bold text-rose-400 num">1 thiết bị</span>
            <div className="flex items-center gap-1 text-[11px] text-rose-400 mt-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Trễ 3 giờ - Đang liên hệ khách</span>
            </div>
          </div>
        </div>

        {/* Recent Operations Activity */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/15">
          <h2 className="text-base font-bold text-white mb-4">Hoạt động bàn giao & thu hồi gần nhất</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono">
                <tr>
                  <th className="py-2.5">Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Thiết bị & Serial</th>
                  <th>Trạng thái</th>
                  <th>Mốc giờ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-3 font-mono font-bold text-white">#RFJ-20261030-9841</td>
                  <td>Nguyễn Hoàng Long</td>
                  <td>Fujifilm X-T5 (3A014582)</td>
                  <td><span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Đã bàn giao</span></td>
                  <td className="num text-zinc-400">30/10 14:05</td>
                </tr>
                <tr>
                  <td className="py-3 font-mono font-bold text-white">#RFJ-20261030-9820</td>
                  <td>Vũ Minh Tuấn</td>
                  <td>Fujinon XF 16-55mm (4LA01120)</td>
                  <td><span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">Đã thu hồi - Hoàn cọc</span></td>
                  <td className="num text-zinc-400">30/10 12:30</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StaffPosLayout>
  );
};
