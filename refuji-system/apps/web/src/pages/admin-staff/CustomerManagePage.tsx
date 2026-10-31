import React, { useState } from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { MembershipTierBadge } from '../../components/badges/MembershipTierBadge.tsx';
import { MembershipTier } from '@refuji/shared';
import { Search, Lock, Unlock, AlertTriangle } from 'lucide-react';

export const CustomerManagePage: React.FC = () => {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      fullName: 'Nguyễn Hoàng Long',
      email: 'long.nh@gmail.com',
      phone: '0912345678',
      tier: MembershipTier.GOLD,
      reputationScore: 94,
      idCardLast4: '8832',
      isActive: true,
      violations: 0
    },
    {
      id: 2,
      fullName: 'Trần Minh Quang',
      email: 'quang.tm@gmail.com',
      phone: '0988776655',
      tier: MembershipTier.BRONZE,
      reputationScore: 62,
      idCardLast4: '1092',
      isActive: false,
      violations: 2 // Trả trễ 2 lần
    }
  ]);

  const toggleStatus = (id: number) => {
    setCustomers(customers.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
  };

  return (
    <StaffPosLayout activeKey="customers">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">QUẢN LÝ HỒ SƠ KHÁCH HÀNG</h1>
        <p className="text-xs text-zinc-400 mb-8">Tra cứu điểm uy tín, lịch sử vi phạm hợp đồng và quyền kích hoạt tài khoản</p>

        <div className="liquid-glass rounded-2xl border border-white/15 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono bg-white/5">
              <tr>
                <th className="p-4">Họ và tên</th>
                <th className="p-4">Liên hệ</th>
                <th className="p-4">CCCD Mask</th>
                <th className="p-4">Hạng thành viên</th>
                <th className="p-4 text-center">Điểm uy tín</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 font-bold text-white">{c.fullName}</td>
                  <td className="p-4">
                    <span className="text-zinc-200 block">{c.phone}</span>
                    <span className="text-zinc-500 text-[11px]">{c.email}</span>
                  </td>
                  <td className="p-4 font-mono text-zinc-300">**** **** {c.idCardLast4}</td>
                  <td className="p-4"><MembershipTierBadge tier={c.tier} /></td>
                  <td className="p-4 text-center">
                    <span className={`font-bold num ${c.reputationScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {c.reputationScore}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {c.isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Hoạt động</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">Đã khóa</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleStatus(c.id)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                        c.isActive
                          ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {c.isActive ? 'Khóa' : 'Mở khóa'}
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
