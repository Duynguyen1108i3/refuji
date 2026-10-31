export interface CameraGalleryImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  type?: 'lifestyle' | 'detail' | 'body';
}

export interface CameraGalleryData {
  cameraId: string;
  cameraName: string;
  tagline: string;
  images: CameraGalleryImage[];
}

export const CAMERA_GALLERIES: Record<string, CameraGalleryImage[]> = {
  // 1. FUJIFILM X100VI (Ảnh chính hãng chuẩn fujifilm-x.com/vi-vn/products/cameras/x100vi/)
  X100VI: [
    {
      id: 'x100vi-life-1',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_device_img_01_01.webp',
      alt: 'FUJIFILM X100VI Lifestyle Shooting - Street Photography',
      caption: 'Thiết kế biểu tượng đường phố',
      type: 'lifestyle',
    },
    {
      id: 'x100vi-life-2',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_device_img_01_02.webp',
      alt: 'FUJIFILM X100VI Leather Strap Detail',
      caption: 'Dây đeo da cao cấp & ngoại hình hoài cổ',
      type: 'lifestyle',
    },
    {
      id: 'x100vi-kv-1',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_kv_img_01_01_pc.webp',
      alt: 'FUJIFILM X100VI Key Visual In Hands',
      caption: 'Trực quan thuần khiết trên tay',
      type: 'lifestyle',
    },
    {
      id: 'x100vi-kv-2',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_kv_img_01_02_pc.webp',
      alt: 'FUJIFILM X100VI Compact Body Close-up',
      caption: 'Thân máy nhôm phay xước nguyên khối',
      type: 'detail',
    },
    {
      id: 'x100vi-concept',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_concept_thum_01.jpg',
      alt: 'FUJIFILM X100VI The One and Only Concept',
      caption: 'The One and Only - Tinh hoa nhiếp ảnh',
      type: 'lifestyle',
    },
    {
      id: 'x100vi-dial',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_device_img_02.png',
      alt: 'FUJIFILM X100VI Top Plate Mechanical Dials',
      caption: 'Cụm vòng xoay cơ khí chính xác',
      type: 'detail',
    },
    {
      id: 'x100vi-lcd',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_device_img_03.png',
      alt: 'FUJIFILM X100VI Tilting LCD Screen',
      caption: 'Màn hình lật góc chụp linh hoạt',
      type: 'detail',
    },
  ],

  // 2. FUJIFILM X-T50 (Ảnh chính hãng chuẩn fujifilm-x.com/vi-vn/products/cameras/x-t50/)
  'X-T50': [
    {
      id: 'xt50-travel-1',
      url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2024/05/x-t50-1-2-new.jpg',
      alt: 'FUJIFILM X-T50 Travel Lifestyle Scene',
      caption: 'Bạn đồng hành du lịch hoàn hảo',
      type: 'lifestyle',
    },
    {
      id: 'xt50-travel-2',
      url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2024/05/x-t50-2-2-new.jpg',
      alt: 'FUJIFILM X-T50 Cafe & Everyday Moments',
      caption: 'Lưu giữ khoảnh khắc đời thường',
      type: 'lifestyle',
    },
    {
      id: 'xt50-travel-3',
      url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2024/05/x-t50-3-2-new.jpg',
      alt: 'FUJIFILM X-T50 Scenic Vista Capture',
      caption: 'Khám phá mọi chân trời mới',
      type: 'lifestyle',
    },
    {
      id: 'xt50-woman',
      url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2024/04/X-T50_woman-2.jpg',
      alt: 'FUJIFILM X-T50 Photographer In Action',
      caption: 'Kính ngắm OLED sắc nét bắt trọn cảm xúc',
      type: 'lifestyle',
    },
    {
      id: 'xt50-man',
      url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2024/04/X-T50_man-2.jpg',
      alt: 'FUJIFILM X-T50 Creative Street Framing',
      caption: 'Góc chụp tự do cùng dải màu phim độc bản',
      type: 'lifestyle',
    },
    {
      id: 'xt50-dial',
      url: 'https://fujifilm-x.b-cdn.net/wp-content/uploads/2024/05/X-T50_dialop-1024x683-1-1.jpg',
      alt: 'FUJIFILM X-T50 Film Simulation Dial',
      caption: 'Vòng xoay giả lập màu phim chuyên biệt đầu tiên',
      type: 'detail',
    },
  ],

  // 3. FUJIFILM X-T5 (Ảnh chính hãng chuẩn fujifilm-x.com/vi-vn/products/cameras/x-t5/)
  'X-T5': [
    {
      id: 'xt5-concept',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-t5/assets/images/top/koes_concept_thum_01.jpg',
      alt: 'FUJIFILM X-T5 Photography Pure Lifestyle',
      caption: 'Nhiếp ảnh thuần khiết - Photography First',
      type: 'lifestyle',
    },
    {
      id: 'xt5-device-1',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-t5/assets/images/top/koes_device_slider_01.png',
      alt: 'FUJIFILM X-T5 Classic Body Silver Profile',
      caption: 'Đường nét kim loại kinh điển',
      type: 'detail',
    },
    {
      id: 'xt5-device-2',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-t5/assets/images/top/koes_device_slider_02.png',
      alt: 'FUJIFILM X-T5 Triple Mechanical Dials ISO Shutter Exp',
      caption: 'Hệ 3 vòng cơ học ISO - Tốc độ - Bù sáng',
      type: 'detail',
    },
    {
      id: 'xt5-device-3',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-t5/assets/images/top/koes_device_slider_03.png',
      alt: 'FUJIFILM X-T5 3-Way Tilting LCD',
      caption: 'Màn hình lật 3 chiều chuyên biệt cho chụp dọc',
      type: 'detail',
    },
    {
      id: 'xt5-device-4',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-t5/assets/images/top/koes_device_slider_04.png',
      alt: 'FUJIFILM X-T5 Dual SD UHS-II Card Slots',
      caption: 'Khe cắm thẻ nhớ kép chuẩn UHS-II tốc độ cao',
      type: 'detail',
    },
    {
      id: 'xt5-device-5',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-t5/assets/images/top/koes_device_slider_05.png',
      alt: 'FUJIFILM X-T5 EVF & Ergonomic Grip View',
      caption: 'Kính ngắm 3.69 triệu điểm ảnh phóng đại 0.8x',
      type: 'detail',
    },
  ],

  // 4. FUJIFILM X-S20 (Ảnh chính hãng chuẩn fujifilm-x.com/vi-vn/products/cameras/x-s20/)
  'X-S20': [
    {
      id: 'xs20-concept',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-s20/assets/images/top/dwga_concept_thum_01.jpg',
      alt: 'FUJIFILM X-S20 Explore The Passion Lifestyle',
      caption: 'Sáng tạo nội dung & Vlog mọi lúc mọi nơi',
      type: 'lifestyle',
    },
    {
      id: 'xs20-grip',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-s20/assets/images/top/dwga_device_img_01_pc.jpg',
      alt: 'FUJIFILM X-S20 Deep Handgrip & Front View',
      caption: 'Báng cầm sâu công thái học cầm nắm chắc chắn',
      type: 'detail',
    },
    {
      id: 'xs20-screen',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-s20/assets/images/top/dwga_quality_img_01.jpg',
      alt: 'FUJIFILM X-S20 Vari-Angle Touchscreen',
      caption: 'Màn hình xoay lật đa góc 180° chuẩn vlog',
      type: 'detail',
    },
    {
      id: 'xs20-vlog',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-s20/assets/images/top/dwga_simulation_slide_01.jpg',
      alt: 'FUJIFILM X-S20 Creator Vlog Mode & Cinema',
      caption: 'Chế độ Vlog & quay phim điện ảnh 6.2K/30p',
      type: 'lifestyle',
    },
    {
      id: 'xs20-battery',
      url: 'https://www.fujifilm-x.com/products-cameras-static/x-s20/assets/images/top/dwga_battery_img_01.jpg',
      alt: 'FUJIFILM X-S20 High Capacity NP-W235 Battery',
      caption: 'Pin lớn NP-W235 chụp hơn 800 tấm mỗi lần sạc',
      type: 'detail',
    },
  ],
};

/**
 * Lấy danh sách ảnh gallery chính hãng tương ứng với dòng máy
 */
export function getCameraGallery(cameraName: string): CameraGalleryImage[] {
  if (!cameraName) return CAMERA_GALLERIES.X100VI;
  const upper = cameraName.toUpperCase();
  if (upper.includes('X100')) return CAMERA_GALLERIES.X100VI;
  if (upper.includes('X-T50')) return CAMERA_GALLERIES['X-T50'];
  if (upper.includes('X-T5')) return CAMERA_GALLERIES['X-T5'];
  if (upper.includes('X-S20')) return CAMERA_GALLERIES['X-S20'];
  return CAMERA_GALLERIES.X100VI;
}
