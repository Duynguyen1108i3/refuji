import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  ClipboardCheck, 
  Camera, 
  FileCheck2, 
  Wrench, 
  Users, 
  Receipt, 
  ScrollText, 
  LogOut 
} from 'lucide-react';

interface StaffPosLayoutProps {
  children: React.ReactNode;
  activeKey?: string;
  staffName?: string;
}

export const StaffPosLayout: React.FC<StaffPosLayoutProps> = ({
  children,
  activeKey = 'dashboard',
  staffName = 'Nhân viên Showroom'
}) => {
  const menuItems = [
    { key: 'dashboard', label: 'Tổng quan Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { key: 'catalog', label: 'Quản lý Mẫu máy', icon: Package, path: '/staff/catalog' },
    { key: 'inventory', label: 'Kho cá thể Serial', icon: Layers, path: '/staff/inventory' },
    { key: 'approval', label: 'Duyệt đơn thuê', icon: ClipboardCheck, path: '/staff/approval' },
    { key: 'checkout', label: 'Bàn giao máy (Check-out)', icon: Camera, path: '/staff/checkout-wizard' },
    { key: 'checkin', label: 'Thu hồi & Hoàn cọc (Check-in)', icon: FileCheck2, path: '/staff/checkin-settlement' },
    { key: 'maintenance', label: 'Phiếu bảo dưỡng & Shutter', icon: Wrench, path: '/staff/maintenance' },
    { key: 'customers', label: 'Quản lý Khách hàng', icon: Users, path: '/staff/customers' },
    { key: 'reconcile', label: 'Đối soát VNPAY / Thu tiền', icon: Receipt, path: '/staff/reconcile' },
    { key: 'audit', label: 'Nhật ký Audit Logs', icon: ScrollText, path: '/staff/audit-logs' }
  ];

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 flex">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0a0d14] flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
            R
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-white">REFUJI POS</h2>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Staff & Operations</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto" aria-label="Quản trị viên">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <a
                key={item.key}
                href={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs">
          <div>
            <p className="font-medium text-white">{staffName}</p>
            <p className="text-zinc-500 text-[11px]">Showroom HCM 01</p>
          </div>
          <a href="/login" aria-label="Đăng xuất" className="p-2 text-zinc-400 hover:text-rose-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </a>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
};
