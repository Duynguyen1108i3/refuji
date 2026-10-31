import React from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { ScrollText, Search, ShieldCheck } from 'lucide-react';

export const AuditLogsViewerPage: React.FC = () => {
  const logs = [
    {
      id: 1042,
      action: 'UPDATE_ORDER_STATUS',
      entity: 'RentalOrder (#RFJ-20261030-9841)',
      actor: 'staff_hcm01 (ID: 3)',
      ip: '172.16.20.10',
      time: '30/10/2026 14:05:22',
      details: 'Chuyển trạng thái CONFIRMED -> DELIVERED, gán Serial 3A014582'
    },
    {
      id: 1041,
      action: 'VNPAY_IPN_WEBHOOK',
      entity: 'Payment (#TXN-901824)',
      actor: 'SYSTEM_WEBHOOK',
      ip: '113.161.42.10',
      time: '30/10/2026 13:48:15',
      details: 'Xác thực chữ ký HMAC-SHA256 thành công, ghi nhận thanh toán 6.760.000đ'
    },
    {
      id: 1040,
      action: 'PII_ENCRYPT_ID_CARD',
      entity: 'UserKyc (User ID: 15)',
      actor: 'customer_web',
      ip: '14.162.18.99',
      time: '30/10/2026 13:42:01',
      details: 'Mã hóa AES-256-GCM số CCCD, trích xuất 4 số cuối: 8832'
    }
  ];

  return (
    <StaffPosLayout activeKey="audit">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">NHẬT KÝ HỆ THỐNG (AUDIT LOGS)</h1>
        <p className="text-xs text-zinc-400 mb-8">Ghi vết bảo mật mọi thay đổi dữ liệu, sự kiện Webhook và tác vụ Cron ngầm</p>

        <div className="liquid-glass rounded-2xl border border-white/15 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono bg-white/5">
              <tr>
                <th className="p-4">Thời gian</th>
                <th className="p-4">Hành động</th>
                <th className="p-4">Thực thể</th>
                <th className="p-4">Tác nhân</th>
                <th className="p-4">Chi tiết thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-zinc-400">{log.time}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-emerald-400 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-200">{log.entity}</td>
                  <td className="p-4 text-zinc-400">{log.actor}</td>
                  <td className="p-4 text-zinc-300 font-sans">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </StaffPosLayout>
  );
};
