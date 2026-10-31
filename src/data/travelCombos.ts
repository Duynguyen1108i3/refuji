import { CameraModel, LensModel, AccessoryModel } from '../types';

export interface TravelComboGuide {
  cameraKey: string;
  matchedNames: string[];
  subtitle: string;
  travelNote: string;
  recommendedLensNames: string[];
  recommendedAccessoryNames: string[];
}

export const TRAVEL_COMBOS: TravelComboGuide[] = [
  {
    cameraKey: 'X-E5',
    matchedNames: ['X-E5', 'FUJIFILM X-E5'],
    subtitle: 'Combo Du Lịch Gọn Nhẹ Chuẩn Rangefinder',
    travelNote: 'Ưu tiên ống kính pancake siêu mỏng nhẹ, thoải mái dạo phố và lưu giữ khoảnh khắc đời thường mà không gây chú ý.',
    recommendedLensNames: [
      'FUJINON XF23mmF2.8 R WR',
      'FUJINON XF27mmF2.8 R WR',
      'FUJINON XF35mmF2 R WR',
    ],
    recommendedAccessoryNames: [
      'Pin Lithium-ion NP-W126S',
      'Bao da nửa thân BLC-XE4 chính hãng',
      'Thẻ nhớ SD SanDisk Extreme PRO 128GB',
    ],
  },
  {
    cameraKey: 'X-T50',
    matchedNames: ['X-T50', 'FUJIFILM X-T50'],
    subtitle: 'Combo Du Lịch Toàn Năng 40MP Thế Hệ Mới',
    travelNote: 'Kết hợp cùng ống kính zoom trong gọn nhẹ và ống prime khẩu lớn để tận dụng tối đa vòng xoay Film Simulation chuyên dụng.',
    recommendedLensNames: [
      'FUJINON XF16-50mmF2.8-4.8 R LM WR',
      'FUJINON XF23mmF2 R WR',
      'FUJINON XF35mmF1.4 R',
    ],
    recommendedAccessoryNames: [
      'Pin Lithium-ion NP-W126S',
      'Grip kim loại cầm tay MHG-XT50',
      'Đèn flash gắn rời EF-X8',
    ],
  },
  {
    cameraKey: 'X-T5',
    matchedNames: ['X-T5', 'FUJIFILM X-T5', 'FUJIFILM X-T5 Body Silver'],
    subtitle: 'Combo Chuyên Nghiệp Kháng Thời Tiết WR',
    travelNote: 'Dành cho những chuyến trekking, khám phá phong cảnh hùng vĩ với dải tiêu cự đa dụng và khả năng chống chịu thời tiết khắc nghiệt.',
    recommendedLensNames: [
      'FUJINON XF16-80mmF4 R OIS WR',
      'FUJINON XF16-55mmF2.8 R LM WR II',
      'FUJINON XF18-135mmF3.5-5.6 R LM OIS WR',
    ],
    recommendedAccessoryNames: [
      'Pin dung lượng cao NP-W235',
      'Grip kim loại tay cầm MHG-XT5',
      'Thẻ nhớ SD Sony Tough G-Series 128GB',
    ],
  },
  {
    cameraKey: 'X-S20',
    matchedNames: ['X-S20', 'FUJIFILM X-S20'],
    subtitle: 'Combo Du Lịch Kết Hợp Quay Vlog Chuẩn 6.2K',
    travelNote: 'Báng cầm sâu đầm tay, pin khủng NP-W235 chụp 750 tấm kết hợp cùng lens zoom chống rung OIS cho những thước phim mượt mà.',
    recommendedLensNames: [
      'FUJINON XF18-55mmF2.8-4 R LM OIS',
      'FUJINON XF16-50mmF2.8-4.8 R LM WR',
      'FUJINON XF10-24mmF4 R OIS WR',
    ],
    recommendedAccessoryNames: [
      'Pin dung lượng cao NP-W235',
      'Quạt làm mát ngoài FAN-001',
      'Tripod tay cầm quay Vlog TG-BT1',
    ],
  },
  {
    cameraKey: 'X-M5',
    matchedNames: ['X-M5', 'FUJIFILM X-M5'],
    subtitle: 'Combo Bỏ Túi Siêu Nhẹ 355g Cho Nhà Sáng Tạo',
    travelNote: 'Trọng lượng siêu nhẹ chỉ 355g, hệ thống 3 mic định hướng thông minh đi kèm các dòng ống kính XC bỏ túi lý tưởng.',
    recommendedLensNames: [
      'FUJINON XC13-33mmF3.5-5.6',
      'FUJINON XC15-45mmF3.5-5.6 OIS PZ',
      'FUJINON XF27mmF2.8 R WR',
    ],
    recommendedAccessoryNames: [
      'Pin Lithium-ion NP-W126S',
      'Tripod tay cầm Bluetooth TG-BT1',
      'Thẻ nhớ MicroSD kèm adapter SDXC 128GB',
    ],
  },
  {
    cameraKey: 'X-T30 III',
    matchedNames: ['X-T30 III', 'FUJIFILM X-T30 III'],
    subtitle: 'Combo Hoài Niệm Nhỏ Gọn Đậm Chất Film',
    travelNote: 'Sự cân bằng tinh tế giữa thiết kế retro và hiệu năng chụp ảnh mạnh mẽ, phù hợp với các ống kính nhỏ gọn tiêu cự chuẩn.',
    recommendedLensNames: [
      'FUJINON XC13-33mmF3.5-5.6',
      'FUJINON XF23mmF2.8 R WR',
      'FUJINON XF35mmF2 R WR',
    ],
    recommendedAccessoryNames: [
      'Pin Lithium-ion NP-W126S',
      'Nút bấm kim loại Soft Shutter đỏ',
      'Grip ngón cái Thumb Rest kim loại',
    ],
  },
  {
    cameraKey: 'GFX',
    matchedNames: ['GFX', 'FUJIFILM GFX100 II', 'FUJIFILM GFX100S II', 'FUJIFILM GFX100RF'],
    subtitle: 'Hệ Thống Medium Format Đỉnh Cao 102MP',
    travelNote: 'Độ chi tiết và dải tương phản động vô đối cho các dự án nhiếp ảnh phong cảnh và mỹ thuật du lịch đỉnh cao.',
    recommendedLensNames: [
      'FUJINON GF110mmF2 R LM WR',
      'FUJINON XF16-55mmF2.8 R LM WR II',
      'FUJINON XF35mmF1.4 R',
    ],
    recommendedAccessoryNames: [
      'Pin dung lượng cao NP-W235',
      'Kính ngắm EVF xoay lật góc EVF-TL1',
      'Dây đeo thao tác nhanh Peak Design Slide',
    ],
  },
];

/**
 * Tìm combo khuyên dùng phù hợp nhất cho 1 thân máy ảnh bất kỳ
 */
export const findRecommendedComboForCamera = (cameraName: string): TravelComboGuide => {
  const normalized = cameraName.toUpperCase();
  for (const combo of TRAVEL_COMBOS) {
    if (combo.matchedNames.some((m) => normalized.includes(m.toUpperCase()))) {
      return combo;
    }
  }
  // Mặc định trả về combo đa năng X-T50
  return TRAVEL_COMBOS[1];
};

/**
 * Tìm các model Lens và Accessory thực tế từ danh sách catalog
 */
export const getRecommendedItemsForCamera = (
  cameraName: string,
  allLenses: LensModel[],
  allAccessories: AccessoryModel[]
): {
  comboGuide: TravelComboGuide;
  lenses: LensModel[];
  accessories: AccessoryModel[];
} => {
  const guide = findRecommendedComboForCamera(cameraName);

  // Lọc lens theo tên khuyên dùng
  const matchedLenses = allLenses.filter((lens) =>
    guide.recommendedLensNames.some(
      (rec) => lens.name.toLowerCase().includes(rec.toLowerCase()) || rec.toLowerCase().includes(lens.name.toLowerCase())
    )
  );

  // Nếu không đủ, bổ sung thêm các lens du lịch phổ biến nhất
  const fallbackLenses = allLenses.filter((l) =>
    ['XF16-50', 'XF16-80', 'XF23', 'XF27', 'XF35'].some((k) => l.name.includes(k))
  );

  const finalLenses = matchedLenses.length > 0 ? matchedLenses : fallbackLenses.slice(0, 3);

  // Lọc phụ kiện tương thích
  const isW235Body = cameraName.includes('X-T5') || cameraName.includes('X-H2') || cameraName.includes('X-S20') || cameraName.includes('GFX');
  const matchedAccessories = allAccessories.filter((acc) => {
    if (isW235Body && acc.name.includes('W235')) return true;
    if (!isW235Body && (acc.name.includes('W126') || acc.name.includes('W126S'))) return true;
    if (acc.name.toLowerCase().includes('flash') || acc.name.toLowerCase().includes('thẻ nhớ') || acc.name.toLowerCase().includes('sd') || acc.name.toLowerCase().includes('dây')) return true;
    return false;
  });

  return {
    comboGuide: guide,
    lenses: finalLenses.slice(0, 3),
    accessories: matchedAccessories.slice(0, 2),
  };
};
