import { ProductModelEntity } from '@refuji/shared';

// Single source of truth for products & accessories
export const PRODUCT_FIXTURES: ProductModelEntity[] = [
  {
    id: 1,
    modelName: 'Fujifilm X-T5 Body Silver',
    slug: 'fujifilm-xt5-silver',
    category: 'BODY',
    mount: 'X', // X-Mount
    brand: 'Fujifilm',
    tagline: 'Độ phân giải 40.2MP & 20 Giả lập màu phim',
    baseRentalPricePerDay: 450000,
    depositAmount: 5900000, // Cọc gốc duy nhất: 5.900.000đ (Gold 10% -> 5.310.000đ)
    availableCount: 2,
    highlightBadge: 'Được thuê nhiều nhất',
    imageUrl: '/assets/catalog/fujifilm-xt5-silver.webp',
    description: 'Thân máy Mirrorless APS-C 40.2MP X-Trans CMOS 5 HR thế hệ mới, chống rung IBIS 7-stops, hỗ trợ quay video 6.2K/30p 4:2:2 10-bit nội bộ.',
    specsJson: {
      sensor: '40.2MP X-Trans CMOS 5 HR (APS-C)',
      mount: 'Fujifilm X-Mount',
      ibis: 'Chống rung 5 trục 7.0 stops',
      video: '6.2K/30p 10-bit 4:2:2',
      weight: '557g'
    }
  },
  {
    id: 2,
    modelName: 'Fujifilm X100VI Silver',
    slug: 'fujifilm-x100vi-silver',
    category: 'BODY',
    mount: 'FIXED', // Ống kính liền (Không thuộc ngàm X rời)
    brand: 'Fujifilm',
    tagline: 'Biểu tượng nhiếp ảnh đường phố',
    baseRentalPricePerDay: 500000,
    depositAmount: 6000000, // Cọc gốc: 6.000.000đ (Gold 10% -> 5.400.000đ)
    availableCount: 1,
    highlightBadge: 'Xu hướng 2026',
    imageUrl: '/assets/catalog/fujifilm-x100vi-silver.webp',
    description: 'Dòng máy compact cao cấp ống kính cố định Fujinon 23mm F2 II, cảm biến 40.2MP, tích hợp kính lọc ND 4-stops và giả lập màu Reala ACE độc quyền.',
    specsJson: {
      sensor: '40.2MP X-Trans CMOS 5 HR',
      lens: 'Fujinon 23mm F2 II cố định',
      mount: 'Ống kính liền (Fixed Lens)',
      ibis: 'Chống rung 6.0 stops',
      weight: '521g'
    }
  },
  {
    id: 3,
    modelName: 'Fujifilm X-S20 Body Black',
    slug: 'fujifilm-xs20-black',
    category: 'BODY',
    mount: 'X',
    brand: 'Fujifilm',
    tagline: 'Nhỏ gọn chuyên quay vlog & du lịch',
    baseRentalPricePerDay: 320000,
    depositAmount: 3500000, // Cọc gốc: 3.500.000đ (Gold 10% -> 3.150.000đ)
    availableCount: 2,
    highlightBadge: 'Pin lớn NP-W235',
    imageUrl: '/assets/catalog/fujifilm-xs20-black.webp',
    description: 'Thân máy Mirrorless cảm biến 26.1MP X-Trans CMOS 4 kết hợp X-Processor 5, chống rung 7.0 stops và thời lượng pin vượt trội 750 tấm.',
    specsJson: {
      sensor: '26.1MP X-Trans CMOS 4',
      mount: 'Fujifilm X-Mount',
      ibis: 'Chống rung 7.0 stops',
      video: '6.2K/30p Open Gate 3:2',
      weight: '491g'
    }
  },
  {
    id: 4,
    modelName: 'Fujifilm GFX 100 II Flagship',
    slug: 'fujifilm-gfx100ii',
    category: 'BODY',
    mount: 'G', // G-Mount Medium Format
    brand: 'Fujifilm',
    tagline: 'Medium Format 102MP đỉnh cao thương mại',
    baseRentalPricePerDay: 950000,
    depositAmount: 15000000, // Cọc gốc: 15.000.000đ (Gold 10% -> 13.500.000đ)
    availableCount: 1,
    highlightBadge: 'Medium Format 102MP',
    imageUrl: '/assets/catalog/fujifilm-gfx100ii.webp',
    description: 'Cảm biến Medium Format 102MP siêu nét, tốc độ chụp 8.0fps, ghi video 8K/30p và quay định dạng Apple ProRes trực tiếp vào SSD.',
    specsJson: {
      sensor: '102MP High-Speed Medium Format 43.8 x 32.9mm',
      mount: 'Fujifilm G-Mount',
      ibis: 'Chống rung 8.0 stops',
      video: '8K/30p & ProRes 422HQ',
      weight: '1030g'
    }
  },
  {
    id: 5,
    modelName: 'Fujinon XF 35mm f/1.4 R',
    slug: 'fujinon-xf-35mm-f14',
    category: 'LENS',
    mount: 'X',
    brand: 'Fujifilm',
    tagline: 'Ống kính huyền thoại với bokeh ma mị',
    baseRentalPricePerDay: 150000,
    depositAmount: 2000000, // Cọc gốc: 2.000.000đ (Gold 10% -> 1.800.000đ)
    availableCount: 3,
    highlightBadge: 'Ống kính huyền thoại',
    imageUrl: '/assets/catalog/fujinon-xf-35mm-f14.webp',
    description: 'Ống kính tiêu cự chuẩn 35mm (tương đương 53mm Full-frame) khẩu độ lớn f/1.4 mang lại độ nổi khối và hiệu ứng xoá phông huyền thoại.',
    specsJson: {
      focalLength: '35mm (tương đương 53mm)',
      maxAperture: 'f/1.4',
      filterSize: '52mm',
      weight: '187g'
    }
  },
  {
    id: 6,
    modelName: 'Fujinon XF 16-55mm f/2.8 R LM WR II',
    slug: 'fujinon-xf-16-55-mk2',
    category: 'LENS',
    mount: 'X',
    brand: 'Fujifilm',
    tagline: 'Zoom Red Badge thế hệ mới nhẹ hơn 37%',
    baseRentalPricePerDay: 250000,
    depositAmount: 3500000, // Cọc gốc: 3.500.000đ (Gold 10% -> 3.150.000đ)
    availableCount: 2,
    highlightBadge: 'Red Badge cao cấp',
    imageUrl: '/assets/catalog/fujinon-xf-16-55-mk2.webp',
    description: 'Ống kính zoom tiêu chuẩn chuyên nghiệp thế hệ II khẩu f/2.8 toàn dải, nhẹ hơn 37% so với đời I, motor Linear lấy nét siêu êm và kháng thời tiết.',
    specsJson: {
      focalLength: '16-55mm (tương đương 24-84mm)',
      maxAperture: 'f/2.8',
      filterSize: '72mm',
      weight: '410g'
    }
  }
];
