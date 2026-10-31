import React from 'react';
import { Clock, ShieldCheck, Layers } from 'lucide-react';

export const Footer: React.FC<{ isStandalonePage?: boolean }> = ({ isStandalonePage = true }) => {
  return (
    <footer id="policies" className="relative w-full pt-8 pb-16 text-[#5a6072] text-xs sm:text-sm">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        
        {/* Banner 3 Cam Kết Vàng Về Cọc & Pháp Lý */}
        {isStandalonePage && (
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14171f]/[0.05] border border-[#14171f]/10 text-[11px] font-medium uppercase tracking-wider text-[#383e4e] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14171f]/80 radar-pulse-white" />
              <span>Chính Sách Cọc &amp; Quy Trình Bàn Giao</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#14171f] font-normal mb-8">
              Bảo Toàn Quyền Lợi Khách Hàng Chuẩn Mực v1.1
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="liquid-glass rounded-2xl p-6 border border-[#14171f]/10 shadow-sm flex items-start gap-4">
                <Clock size={24} className="text-[#14171f] flex-shrink-0 mt-1" />
                <div>
                  <h5 className="font-semibold text-sm text-[#14171f] mb-1.5">Khóa giữ chỗ 15 phút (Hold)</h5>
                  <p className="text-xs text-[#525868] leading-relaxed">
                    Đơn hàng được khóa chỗ độc quyền 15 phút chống Race Condition. Bạn có thể thanh toán cọc qua VNPAY hoặc chọn nhận máy tại quầy.
                  </p>
                </div>
              </div>

              <div className="liquid-glass rounded-2xl p-6 border border-[#14171f]/10 shadow-sm flex items-start gap-4">
                <ShieldCheck size={24} className="text-[#14171f] flex-shrink-0 mt-1" />
                <div>
                  <h5 className="font-semibold text-sm text-[#14171f] mb-1.5">Tuân thủ Luật Căn cước 2023</h5>
                  <p className="text-xs text-[#525868] leading-relaxed">
                    Cửa hàng chỉ đối chiếu Thẻ căn cước/VNeID trực tiếp khi bàn giao máy, cam kết KHÔNG giữ thẻ gốc của khách hàng.
                  </p>
                </div>
              </div>

              <div className="liquid-glass rounded-2xl p-6 border border-[#14171f]/10 shadow-sm flex items-start gap-4">
                <Layers size={24} className="text-[#14171f] flex-shrink-0 mt-1" />
                <div>
                  <h5 className="font-semibold text-sm text-[#14171f] mb-1.5">Kiểm tra Serial &amp; Biên bản 2 chiều</h5>
                  <p className="text-xs text-[#525868] leading-relaxed">
                    Mỗi thiết bị được gán đúng số Serial Number, chụp ảnh ngoại hình đối chứng lúc Check-out và hoàn cọc tức thì khi Check-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 pt-8 border-t border-[#14171f]/10">
          
          {/* Col 1 */}
          <div className="md:col-span-2">
            <h4 className="font-serif text-3xl text-[#14171f] tracking-widest font-normal mb-4">REFUJI</h4>
            <p className="text-[#5a6072] text-xs sm:text-sm leading-relaxed max-w-md mb-5 font-light">
              Nền tảng quản lý và cho thuê máy ảnh, ống kính và phụ kiện Fujifilm hàng đầu. Lưu giữ trọn vẹn từng khoảnh khắc điện ảnh của bạn với chuẩn mực dịch vụ cao cấp nhất.
            </p>
            <div className="text-xs text-[#7e8596]">
              Chủ dự án: Tran Txi — Khoa Công nghệ Thông tin, STU
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h5 className="text-xs font-semibold text-[#14171f] uppercase tracking-wider mb-4">Hệ thống</h5>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li><a href="#hero" className="hover:text-[#14171f] transition-colors">Trang chủ</a></li>
              <li><a href="#cameras" className="hover:text-[#14171f] transition-colors">Máy ảnh Hot</a></li>
              <li><a href="#lenses" className="hover:text-[#14171f] transition-colors">Ống kính Fujinon</a></li>
              <li><a href="#explore" className="hover:text-[#14171f] transition-colors">Tra cứu lịch trống</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h5 className="text-xs font-semibold text-[#14171f] uppercase tracking-wider mb-4">Pháp lý &amp; Cọc</h5>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li><span className="hover:text-[#14171f] transition-colors cursor-pointer">Chính sách cọc linh hoạt</span></li>
              <li><span className="hover:text-[#14171f] transition-colors cursor-pointer">Tuân thủ Luật Căn cước 2023</span></li>
              <li><span className="hover:text-[#14171f] transition-colors cursor-pointer">Bảo vệ DLCN 2025 (NĐ 356)</span></li>
              <li><span className="hover:text-[#14171f] transition-colors cursor-pointer">Quy trình bàn giao Serial</span></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-[#14171f]/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7e8596] gap-4">
          <span>&copy; {new Date().getFullYear()} REFUJI. All rights reserved.</span>
          <span>Thiết kế Liquid Glass theo chuẩn kiến trúc RytoxGroup &amp; Figma</span>
        </div>
      </div>
    </footer>
  );
};
