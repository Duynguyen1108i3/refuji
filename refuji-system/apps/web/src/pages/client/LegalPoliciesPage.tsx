import React from 'react';
import { ShieldCheck, AlertCircle, Clock, FileCheck } from 'lucide-react';

export const LegalPoliciesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">
        CHÍNH SÁCH PHÁP LÝ & BẢO VỆ DỮ LIỆU
      </h1>
      <p className="text-sm text-zinc-400 mb-10">
        REFUJI hoạt động theo khuôn khổ pháp luật Việt Nam, tuân thủ Nghị định Bảo vệ Dữ liệu Cá nhân 2025 (BVDLCN) và quy chế đặt cọc thiết bị giá trị cao.
      </p>

      {/* 1. BVDLCN 2025 */}
      <section id="privacy" className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/15 mb-8">
        <div className="flex items-center gap-2.5 text-emerald-400 mb-4">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-xl font-bold font-serif text-white">1. Cam kết Bảo vệ Dữ liệu Cá nhân (Nghị định 2025)</h2>
        </div>
        <div className="flex flex-col gap-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            <strong>Mã hóa chuẩn AES-256-GCM:</strong> Mọi thông tin Căn cước công dân (CCCD) và mã định danh VNeID được mã hóa trước khi lưu trữ vào hệ thống cơ sở dữ liệu. Nhân viên tại quầy chỉ có quyền đối soát 4 số cuối (ví dụ: **** **** 1234).
          </p>
          <p>
            <strong>Quyền kiểm soát của chủ thể dữ liệu:</strong> Khách hàng có toàn quyền yêu cầu trích xuất dữ liệu hoặc xóa vĩnh viễn (Right to be Forgotten) thông tin cá nhân khỏi hệ thống bất cứ lúc nào thông qua trang Hồ sơ cá nhân.
          </p>
          <p>
            <strong>Không chia sẻ cho bên thứ ba:</strong> Chúng tôi cam kết tuyệt đối không bán hoặc cung cấp thông tin khách hàng cho bất kỳ đơn vị quảng cáo nào.
          </p>
        </div>
      </section>

      {/* 2. Quy tắc trả trễ & Phí bồi thường */}
      <section id="late-fee" className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/15 mb-8">
        <div className="flex items-center gap-2.5 text-amber-400 mb-4">
          <Clock className="w-6 h-6" />
          <h2 className="text-xl font-bold font-serif text-white">2. Quy định Trả trễ & Thẩm định Hư hỏng</h2>
        </div>
        <div className="flex flex-col gap-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            <strong>Khung giờ Showroom:</strong> Thiết bị phải được hoàn trả trước 20:00 ngày kết thúc thuê. Nếu trả sau 20:00 mà không thông báo trước, hệ thống tính phí phát sinh 50.000đ/giờ trễ.
          </p>
          <p>
            <strong>Biên bản đối chứng 2 chiều:</strong> Trước khi bàn giao và khi thu hồi, nhân viên cùng khách hàng chụp tối thiểu 2 bức ảnh độ nét cao ghi nhận tình trạng cảm biến, ngoại quan và mã Serial.
          </p>
          <p>
            <strong>Biểu phí hư hỏng:</strong>
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-xs text-zinc-400">
            <li>Xước nhẹ ngoài vỏ không ảnh hưởng quang học: Khấu trừ 5% cọc.</li>
            <li>Trầy xước rõ / Cấn viền: Khấu trừ 15% cọc.</li>
            <li>Ố kính / Hỏng chi tiết ngoài: Khấu trừ 35% cọc.</li>
            <li>Móp méo / Lỗi cơ quang / Hỏng cảm biến: Khấu trừ 70% cọc.</li>
            <li>Mất mát thiết bị / Rơi vỡ không thể khắc phục: Bồi hoàn 100% cọc & giá trị thiết bị.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
