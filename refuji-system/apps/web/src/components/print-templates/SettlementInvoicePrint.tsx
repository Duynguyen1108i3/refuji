import React from 'react';
import { formatVND } from '@refuji/shared';

interface SettlementInvoicePrintProps {
  orderCode: string;
  customerName: string;
  phone: string;
  returnDate: string;
  totalDeposit: number;
  lateHours: number;
  lateFee: number;
  damageFee: number;
  refundAmount: number;
  staffName: string;
  notes?: string;
}

export const SettlementInvoicePrint: React.FC<SettlementInvoicePrintProps> = ({
  orderCode,
  customerName,
  phone,
  returnDate,
  totalDeposit,
  lateHours,
  lateFee,
  damageFee,
  refundAmount,
  staffName,
  notes
}) => {
  return (
    <div className="print-container p-8 bg-white text-black font-sans">
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">REFUJI CAMERA RENTAL</h1>
          <p className="text-xs text-gray-600">Hệ thống cho thuê máy ảnh & ống kính Fujifilm chuyên nghiệp</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-gray-900">PHIẾU QUYẾT TOÁN & HOÀN CỌC</h2>
          <p className="text-sm font-semibold">Đơn hàng: #{orderCode}</p>
          <p className="text-xs text-gray-600">Thời gian thu hồi: {returnDate}</p>
        </div>
      </div>

      <div className="mb-6 text-sm">
        <p><strong>Khách hàng:</strong> {customerName} • <strong>SĐT:</strong> {phone}</p>
        <p><strong>Nhân viên nghiệm thu:</strong> {staffName}</p>
        {notes && <p className="mt-1 text-gray-700"><strong>Ghi chú:</strong> {notes}</p>}
      </div>

      <table className="w-full text-sm mb-6 border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left">Nội dung quyết toán</th>
            <th className="border border-black p-2 text-right">Chi tiết</th>
            <th className="border border-black p-2 text-right">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2 font-medium">1. Tổng tiền cọc ban đầu đã nhận</td>
            <td className="border border-black p-2 text-right">Theo biên nhận Check-out</td>
            <td className="border border-black p-2 text-right font-semibold text-emerald-700">
              +{formatVND(totalDeposit)}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-medium">2. Phí trả trễ (Late fee)</td>
            <td className="border border-black p-2 text-right">Trễ: {lateHours} giờ</td>
            <td className="border border-black p-2 text-right text-rose-700">
              -{formatVND(lateFee)}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-medium">3. Phí bồi hoàn hao mòn / hư hại</td>
            <td className="border border-black p-2 text-right">Biên bản thẩm định tình trạng</td>
            <td className="border border-black p-2 text-right text-rose-700">
              -{formatVND(damageFee)}
            </td>
          </tr>
          <tr className="bg-gray-50 text-base font-bold">
            <td className="border border-black p-3" colSpan={2}>
              TỔNG TIỀN CỌC HOÀN TRẢ KHÁCH HÀNG:
            </td>
            <td className="border border-black p-3 text-right text-emerald-800">
              {formatVND(refundAmount)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="signature-zone flex justify-between mt-12 text-center text-sm">
        <div className="signature-box w-5/12">
          <p className="font-bold">ĐẠI DIỆN THU HỒI</p>
          <div className="h-20 flex items-end justify-center font-medium">{staffName}</div>
        </div>
        <div className="signature-box w-5/12">
          <p className="font-bold">XÁC NHẬN NHẬN LẠI CỌC</p>
          <div className="h-20 flex items-end justify-center font-medium">{customerName}</div>
        </div>
      </div>
    </div>
  );
};
