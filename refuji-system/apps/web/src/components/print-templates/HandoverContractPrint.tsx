import React from 'react';
import { formatVND } from '@refuji/shared';

interface HandoverContractPrintProps {
  orderCode: string;
  customerName: string;
  phone: string;
  idCardLast4: string;
  items: Array<{
    name: string;
    serial: string;
    shutterCount: number;
    conditionPercent: number;
    deposit: number;
  }>;
  handoverDate: string;
  expectedReturnDate: string;
  staffName: string;
}

export const HandoverContractPrint: React.FC<HandoverContractPrintProps> = ({
  orderCode,
  customerName,
  phone,
  idCardLast4,
  items,
  handoverDate,
  expectedReturnDate,
  staffName
}) => {
  return (
    <div className="print-container p-8 bg-white text-black font-sans">
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">REFUJI CAMERA RENTAL</h1>
          <p className="text-xs text-gray-600">Hệ thống cho thuê máy ảnh & ống kính Fujifilm chuyên nghiệp</p>
          <p className="text-xs text-gray-600">Địa chỉ: 180 Cao Lỗ, Phường 4, Quận 8, TP.HCM • Hotline: 0901 234 567</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-gray-900">BIÊN BẢN BÀN GIAO THIẾT BỊ</h2>
          <p className="text-sm font-semibold">Mã đơn: #{orderCode}</p>
          <p className="text-xs text-gray-600">Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {/* Thông tin khách hàng */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p><strong>Khách hàng:</strong> {customerName}</p>
          <p><strong>Số điện thoại:</strong> {phone}</p>
          <p><strong>Số CCCD / VNeID:</strong> **** **** {idCardLast4}</p>
        </div>
        <div>
          <p><strong>Thời gian nhận:</strong> {handoverDate}</p>
          <p><strong>Thời gian trả dự kiến:</strong> {expectedReturnDate}</p>
          <p><strong>Nhân viên bàn giao:</strong> {staffName}</p>
        </div>
      </div>

      {/* Bảng thiết bị */}
      <table className="w-full text-sm mb-6 border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left">STT</th>
            <th className="border border-black p-2 text-left">Tên thiết bị</th>
            <th className="border border-black p-2 text-left">Số Serial</th>
            <th className="border border-black p-2 text-center">Số shot (Shutter)</th>
            <th className="border border-black p-2 text-center">Tình trạng</th>
            <th className="border border-black p-2 text-right">Tiền cọc</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td className="border border-black p-2">{idx + 1}</td>
              <td className="border border-black p-2 font-medium">{it.name}</td>
              <td className="border border-black p-2 font-mono">{it.serial}</td>
              <td className="border border-black p-2 text-center">{it.shutterCount > 0 ? it.shutterCount : 'N/A'}</td>
              <td className="border border-black p-2 text-center">{it.conditionPercent}%</td>
              <td className="border border-black p-2 text-right">{formatVND(it.deposit)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Điều khoản */}
      <div className="text-xs text-gray-700 leading-relaxed mb-8">
        <p className="font-semibold mb-1">Cam kết của bên thuê:</p>
        <p>1. Bên thuê đã kiểm tra trực tiếp ngoại quan, cảm biến, các nút bấm và ống kính hoạt động hoàn hảo tại thời điểm nhận.</p>
        <p>2. Cam kết hoàn trả đúng thời gian quy định trước 20:00 ngày kết thúc thuê. Nếu trễ sẽ tính phí theo quy định hệ thống.</p>
        <p>3. Trong trường hợp xảy ra rơi vỡ, vào nước, hư hỏng hoặc trầy xước, chi phí khắc phục sẽ khấu trừ trực tiếp vào tiền cọc.</p>
      </div>

      {/* Chữ ký */}
      <div className="signature-zone flex justify-between mt-8 text-center text-sm">
        <div className="signature-box w-5/12">
          <p className="font-bold">ĐẠI DIỆN REFUJI</p>
          <p className="text-xs text-gray-500 italic">(Ký và ghi rõ họ tên)</p>
          <div className="h-24 flex items-end justify-center font-medium">{staffName}</div>
        </div>
        <div className="signature-box w-5/12">
          <p className="font-bold">KHÁCH HÀNG THUÊ</p>
          <p className="text-xs text-gray-500 italic">(Ký và ghi rõ họ tên)</p>
          <div className="h-24 flex items-end justify-center font-medium">{customerName}</div>
        </div>
      </div>
    </div>
  );
};
