import { CameraModel, LensModel, AccessoryModel } from '../types';

export const CAMERAS: CameraModel[] = [
  {
    id: 'fuji-xt5',
    name: 'Fujifilm X-T5',
    category: 'BODY',
    series: 'X-T',
    tagline: 'như người bạn đồng hành',
    sensor: 'X-Trans CMOS 5 HR',
    resolution: '40.2 MP',
    image: '/assets/camera-xt5.png',
    dailyRate: 500000,
    depositRate: 5000000,
    availableCount: 2,
    highlightBadge: '🔥 Được thuê nhiều nhất',
    description: 'Khám phá nghệ thuật nhiếp ảnh phong cảnh cùng chất màu phim huyền thoại. Cảm biến 40.2MP đỉnh cao cùng hệ thống chống rung 7-stops.',
    specs: ['40.2MP X-Trans CMOS 5 HR', 'IBIS chống rung 5 trục 7-stops', '20 Giả lập màu phim', 'Quay phim 6.2K/30p']
  },
  {
    id: 'fuji-x100vi',
    name: 'Fujifilm X100VI',
    category: 'BODY',
    series: 'X100',
    tagline: 'Biểu tượng đường phố',
    sensor: 'X-Trans CMOS 5 HR',
    resolution: '40.2 MP',
    image: '/assets/camera-xt5.png',
    dailyRate: 550000,
    depositRate: 6000000,
    availableCount: 1,
    highlightBadge: '✨ Hot Trend 2026',
    description: 'Ống kính cố định 23mm f/2 thế hệ II sắc nét, tích hợp kính lọc ND 4-stops và khả năng chống rung IBIS 6-stops trong thân máy compact.',
    specs: ['Ống kính 23mm F2 II sắc nét', 'Chống rung IBIS 6-stops', 'Cảm biến 40.2MP', 'Giả lập phim Reala ACE']
  },
  {
    id: 'fuji-xh2s',
    name: 'Fujifilm X-H2S',
    category: 'BODY',
    series: 'X-H',
    tagline: 'Tốc độ thể thao & Điện ảnh',
    sensor: 'X-Trans CMOS 5 HS Stacked',
    resolution: '26.1 MP',
    image: '/assets/camera-xt5.png',
    dailyRate: 600000,
    depositRate: 7000000,
    availableCount: 3,
    highlightBadge: '⚡ Tốc độ chụp 40fps',
    description: 'Cảm biến xếp chồng tốc độ siêu cao, loại bỏ hoàn toàn Rolling Shutter, quay ProRes nội bộ chuẩn Hollywood.',
    specs: ['Stacked CMOS 26.1MP', 'Chụp liên tục 40fps blackout-free', 'Apple ProRes 422HQ', 'Hỗ trợ thẻ CFexpress Type B']
  },
  {
    id: 'fuji-gfx50s2',
    name: 'Fujifilm GFX 50S II',
    category: 'BODY',
    series: 'GFX',
    tagline: 'Đỉnh cao Medium Format',
    sensor: 'Medium Format CMOS (43.8 x 32.9mm)',
    resolution: '51.4 MP',
    image: '/assets/camera-xt5.png',
    dailyRate: 900000,
    depositRate: 12000000,
    availableCount: 1,
    highlightBadge: '👑 Cảm biến lớn gấp 1.7x Fullframe',
    description: 'Chiều sâu quang học vượt trội, dải dynamic range mở rộng và độ chuyển vùng nét mượt mà độc nhất vô nhị.',
    specs: ['Cảm biến 51.4MP Medium Format', 'Chống rung IBIS 6.5-stops', 'Trọng lượng chỉ 900g', 'Pixel Shift Multi-Shot 205MP']
  }
];

export const LENSES: LensModel[] = [
  {
    id: 'xf-35mm-f14',
    name: 'Fujinon XF 35mm f/1.4 R',
    category: 'LENS',
    mount: 'X',
    focalLength: '35mm (tương đương 53mm)',
    aperture: 'f/1.4 - f/16',
    image: '/assets/lens-35mm.png',
    dailyRate: 180000,
    depositRate: 2000000,
    availableCount: 4,
    highlightBadge: 'Ống kính huyền thoại',
    description: 'Tuyệt tác quang học cổ điển với chất ảnh có chiều sâu tự nhiên, hiệu ứng xóa phông mượt mà được cộng đồng thuê nhiều nhất cho các chuyến đi.',
    features: ['Khẩu độ lớn F1.4 bắt sáng tối ưu', 'Vòng chỉnh khẩu độ vật lý', 'Bokeh mềm mại độc bản', 'Gọn nhẹ chỉ 187g']
  },
  {
    id: 'xf-56mm-f12',
    name: 'Fujinon XF 56mm f/1.2 R WR',
    category: 'LENS',
    mount: 'X',
    focalLength: '56mm (tương đương 85mm)',
    aperture: 'f/1.2 - f/16',
    image: '/assets/lens-35mm.png',
    dailyRate: 250000,
    depositRate: 3500000,
    availableCount: 2,
    highlightBadge: 'Vua Chân Dung',
    description: 'Độ sắc nét kinh ngạc ngay tại f/1.2 với 11 lá khẩu tròn cho bokeh mịn như kem và khả năng kháng thời tiết WR bền bỉ.',
    features: ['Khẩu độ siêu lớn f/1.2', 'Kháng thời tiết Weather Resistant', 'Khoảng cách lấy nét gần 50cm', 'Lớp phủ HT-EBC chống flare']
  },
  {
    id: 'xf-16-55mm-f28',
    name: 'Fujinon XF 16-55mm f/2.8 R LM WR',
    category: 'LENS',
    mount: 'X',
    focalLength: '16-55mm (tương đương 24-84mm)',
    aperture: 'f/2.8 toàn dải',
    image: '/assets/lens-35mm.png',
    dailyRate: 280000,
    depositRate: 4000000,
    availableCount: 3,
    highlightBadge: 'Đa Dụng Đỉnh Cao',
    description: 'Chất lượng quang học tương đương ống kính một tiêu cự trên toàn dải zoom, động cơ lấy nét tuyến tính siêu êm cho phong cảnh và sự kiện.',
    features: ['Khẩu độ không đổi f/2.8', 'Motor lấy nét Twin Linear', 'Kháng bụi ẩm đến -10°C', 'Chống quang sai tối tân']
  }
];

export const ACCESSORIES: AccessoryModel[] = [
  {
    id: 'acc-battery-combo',
    name: 'Combo 2 Pin NP-W235 + Sạc kép Dual Charger',
    category: 'ACCESSORY',
    image: '/assets/camera-xt5.png',
    dailyRate: 60000,
    depositRate: 600000,
    availableCount: 8,
    highlightBadge: 'Năng lượng cả ngày',
    description: 'Hai viên pin chính hãng Fujifilm NP-W235 dung lượng cao kèm dock sạc kép màn hình LCD báo phần trăm pin.',
    specs: ['Dung lượng 2200mAh x 2', 'Tương thích X-T5, X-H2, X-T4, GFX', 'Dock sạc kép Type-C nhanh', 'Bao đựng chống sốc']
  },
  {
    id: 'acc-sd-v90',
    name: 'Thẻ nhớ SanDisk Extreme PRO SDXC 128GB UHS-II V90',
    category: 'ACCESSORY',
    image: '/assets/camera-xt5.png',
    dailyRate: 50000,
    depositRate: 800000,
    availableCount: 6,
    highlightBadge: 'Tốc độ 300MB/s',
    description: 'Chuẩn tốc độ V90 cao nhất, đáp ứng quay 6.2K ProRes và chụp liên tục 40fps không lo tràn bộ đệm Buffer.',
    specs: ['Tốc độ đọc 300MB/s', 'Tốc độ ghi 260MB/s', 'Chuẩn V90 / C10 / U3', 'Kèm hộp chống sốc & chống nước']
  },
  {
    id: 'acc-tripod-carbon',
    name: 'Chân máy Peak Design Carbon Travel Tripod',
    category: 'ACCESSORY',
    image: '/assets/camera-xt5.png',
    dailyRate: 80000,
    depositRate: 1500000,
    availableCount: 4,
    highlightBadge: 'Siêu nhẹ 1.27kg',
    description: 'Thiết kế chân tam giác siêu gọn không khoảng trống, vật liệu sợi Carbon cao cấp chịu tải đến 9.1kg cho phơi sáng ban đêm.',
    specs: ['Chất liệu 100% Carbon Fiber', 'Tải trọng tối đa 9.1kg', 'Chiều dài thu gọn chỉ 39cm', 'Đầu bi ballhead siêu mượt']
  }
];
