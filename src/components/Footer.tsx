import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer id="policies" className="relative w-full border-t border-white/10 pt-20 pb-16 mt-24 text-white/60 text-xs sm:text-sm">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Col 1 */}
          <div className="md:col-span-2">
            <h4 className="font-serif text-3xl text-white tracking-widest font-normal mb-4">REFUJI</h4>
            <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-md mb-5">
              Nền tảng quản lý và cho thuê máy ảnh, ống kính và phụ kiện Fujifilm hàng đầu. Lưu giữ trọn vẹn từng khoảnh khắc điện ảnh của bạn với chuẩn mực dịch vụ cao cấp nhất.
            </p>
            <div className="text-xs text-white/40">
              Chủ dự án: Tran Txi — Khoa Công nghệ Thông tin, STU
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Hệ thống</h5>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li><a href="#hero" className="hover:text-white transition-colors">Trang chủ</a></li>
              <li><a href="#cameras" className="hover:text-white transition-colors">Thân máy Hot</a></li>
              <li><a href="#lenses" className="hover:text-white transition-colors">Ống kính Fujinon</a></li>
              <li><a href="#explore" className="hover:text-white transition-colors">Tra cứu lịch trống</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Pháp lý &amp; Cọc</h5>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li><span className="hover:text-white transition-colors cursor-pointer">Chính sách cọc linh hoạt</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Tuân thủ Luật Căn cước 2023</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Bảo vệ DLCN 2025 (NĐ 356)</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Quy trình bàn giao Serial</span></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
          <span>&copy; {new Date().getFullYear()} REFUJI. All rights reserved.</span>
          <span>Thiết kế Liquid Glass theo chuẩn kiến trúc RytoxGroup &amp; Figma</span>
        </div>
      </div>
    </footer>
  );
};
