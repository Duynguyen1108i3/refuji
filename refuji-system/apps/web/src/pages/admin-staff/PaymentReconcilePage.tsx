import React from 'react';
import { StaffPosLayout } from '../../layouts/StaffPosLayout.tsx';
import { formatVND } from '@refuji/shared';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button.tsx';

export const PaymentReconcilePage: React.FC = () => {
  const transactions = [
    {
      id: 'TXN-901824',
      orderCode: 'RFJ-20261030-9841',
      type: 'RENT_DEPOSIT',
      method: 'VNPAY_IPN',
      vnpayTxn: '14829105',
      amount: 6760000,
      time: '30/10/2026 13:48',
      status: 'SUCCESS'
    },
    {
      id: 'TXN-901760',
      orderCode: 'RFJ-20261030-9820',
      type: 'SETTLEMENT_REFUND',
      method: 'CASH_RETURN',
      vnpayTxn: '-',
      amount: 3500000,
      time: '30/10/2026 12:35',
      status: 'SUCCESS'
    }
  ];

  return (
    <StaffPosLayout activeKey="reconcile">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">ĐỐI SOÁT GIAO DỊCH VNPAY & TIỀN CỌC</h1>
            <p className="text-xs text-zinc-400">Kiểm tra lịch sử Webhook IPN, thanh toán giữ chỗ và hoàn tiền tại quầy</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Đồng bộ Webhook IPN</span>
          </Button>
        </div>

        <div className="liquid-glass rounded-2xl border border-white/15 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/10 text-zinc-400 uppercase font-mono bg-white/5">
              <tr>
                <th className="p-4">Mã GD</th>
                <th className="p-4">Mã đơn hàng</th>
                <th className="p-4">Loại giao dịch</th>
                <th className="p-4">Kênh thanh toán</th>
                <th className="p-4">Mã GD VNPAY</th>
                <th className="p-4 text-right">Số tiền</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 font-mono font-bold text-white">{t.id}</td>
                  <td className="p-4 font-mono text-zinc-300">#{t.orderCode}</td>
                  <td className="p-4 text-zinc-300 font-medium">{t.type}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono">{t.method}</span></td>
                  <td className="p-4 font-mono text-zinc-400">{t.vnpayTxn}</td>
                  <td className="p-4 text-right font-bold text-emerald-400 num">{formatVND(t.amount)}</td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Thành công
                    </span>
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
