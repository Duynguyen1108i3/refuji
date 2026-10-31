import { CameraModel, LensModel, AccessoryModel } from '../types';

export interface RawProductItem {
  id: number;
  model_id: number;
  serial_number: string;
  shutter_count?: number;
  condition_percent: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'LOST';
  purchase_date?: string | null;
  purchase_price?: string | number | null;
  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;
  note?: string;
}

export interface RawProductModel {
  id: number;
  model_name: string;
  category: 'BODY' | 'LENS' | 'ACCESSORY';
  mount_type: 'X_MOUNT' | 'G_MOUNT' | 'NONE';
  brand: string;
  base_rental_price_per_day: string | number;
  deposit_amount: string | number;
  description: string;
  specs_json?: Record<string, any>;
  image_url: string;
  is_active: boolean;
  created_at?: string;
  items?: RawProductItem[];
}

export interface CatalogData {
  cameras: CameraModel[];
  lenses: LensModel[];
  accessories: AccessoryModel[];
}

function getSeriesFromName(name: string): 'X100' | 'X-T' | 'X-H' | 'GFX' {
  if (name.includes('X100') || name.includes('X half')) return 'X100';
  if (name.includes('X-H')) return 'X-H';
  if (name.includes('GFX')) return 'GFX';
  return 'X-T';
}

function getHighlightBadge(name: string, category: string, index: number): string | undefined {
  if (name.includes('X-T5 Body Silver') || name.includes('X-T5')) return 'Được thuê nhiều nhất';
  if (name.includes('X100VI')) return 'Xu hướng 2026';
  if (name.includes('X-H2S')) return 'Tốc độ cao 40fps';
  if (name.includes('56mm')) return 'Vua chân dung';
  if (name.includes('35mm')) return 'Ống kính huyền thoại';
  if (name.includes('16-55mm')) return 'Red Badge thế hệ II';
  if (name.includes('10-24mm')) return 'Góc rộng phong cảnh';
  if (name.includes('50-140mm')) return 'Tele zoom thể thao';
  if (category === 'BODY' && index === 0) return 'Được thuê nhiều nhất';
  return undefined;
}

function transformRawModelToCamera(raw: RawProductModel, index: number): CameraModel {
  const specs = raw.specs_json || {};
  const availableItems = (raw.items || []).filter((i) => i.status === 'AVAILABLE');
  const availableCount = availableItems.length > 0 ? availableItems.length : 1;
  const status = availableCount > 1 ? 'AVAILABLE' : availableCount === 1 ? 'LOW_STOCK' : 'BOOKED';

  const specsList: string[] = [];
  if (specs.sensor) specsList.push(specs.sensor);
  if (specs.megapixels) specsList.push(`${specs.megapixels} MP`);
  if (specs.ibis) specsList.push(`IBIS ${specs.ibis}`);
  if (specs.burst_rate) specsList.push(`Chụp liên tiếp ${specs.burst_rate}`);
  if (specs.video) specsList.push(`Quay video ${specs.video}`);
  if (specs.film_simulations) specsList.push(specs.film_simulations);
  if (specsList.length === 0) specsList.push('Cảm biến X-Trans CMOS', 'Fujifilm X-Mount');

  return {
    id: `fuji-cam-${raw.id}`,
    name: raw.model_name,
    category: 'BODY',
    series: getSeriesFromName(raw.model_name),
    brand: raw.brand || 'Fujifilm',
    mountType: raw.mount_type || 'X_MOUNT',
    tagline: specs.tagline || (raw.model_name.includes('X100') ? 'Biểu tượng đường phố' : 'Nhiếp ảnh thuần khiết'),
    sensor: specs.sensor || 'X-Trans CMOS 5 HR (APS-C)',
    resolution: specs.megapixels ? `${specs.megapixels} MP` : '40.2 MP',
    image: raw.image_url,
    dailyRate: Number(raw.base_rental_price_per_day),
    depositRate: Number(raw.deposit_amount),
    availableCount,
    status,
    highlightBadge: getHighlightBadge(raw.model_name, raw.category, index),
    description: raw.description,
    specs: specsList,
    officialUrl: specs.official_url,
    items: (raw.items || []).map((i) => ({
      serial_number: i.serial_number,
      shutter_count: i.shutter_count,
      condition_percent: i.condition_percent,
      status: i.status === 'LOST' ? 'MAINTENANCE' : i.status,
      purchase_date: i.purchase_date || undefined,
      purchase_price: i.purchase_price ? Number(i.purchase_price) : undefined,
      note: i.note || `Ngoại hình ${i.condition_percent}% Like New`,
    })),
  };
}

function transformRawModelToLens(raw: RawProductModel, index: number): LensModel {
  const specs = raw.specs_json || {};
  const availableItems = (raw.items || []).filter((i) => i.status === 'AVAILABLE');
  const availableCount = availableItems.length > 0 ? availableItems.length : 1;
  const status = availableCount > 1 ? 'AVAILABLE' : availableCount === 1 ? 'LOW_STOCK' : 'BOOKED';

  const features: string[] = [];
  if (specs.lens_elements) features.push(`Cấu tạo ${specs.lens_elements}`);
  if (specs.linear_motor) features.push('Motor tuyến tính Linear Motor');
  if (specs.weather_resistant) features.push('Kháng thời tiết WR');
  if (specs.aperture_ring) features.push('Vòng khẩu độ vật lý có khóa A-Position');
  if (features.length === 0) features.push('Fujinon Aspherical Lens', 'Kháng bụi và nước WR');

  return {
    id: `fuji-lens-${raw.id}`,
    name: raw.model_name,
    category: 'LENS',
    mount: raw.mount_type === 'G_MOUNT' ? 'GF' : 'X',
    brand: raw.brand || 'Fujifilm',
    mountType: raw.mount_type || 'X_MOUNT',
    focalLength: specs.focal_length || '56mm',
    aperture: specs.aperture || 'f/1.2',
    image: raw.image_url,
    dailyRate: Number(raw.base_rental_price_per_day),
    depositRate: Number(raw.deposit_amount),
    availableCount,
    status,
    highlightBadge: getHighlightBadge(raw.model_name, raw.category, index),
    description: raw.description,
    features,
    weight: specs.weight,
    filterSize: specs.filter_size,
    officialUrl: specs.official_url,
    items: (raw.items || []).map((i) => ({
      serial_number: i.serial_number,
      shutter_count: i.shutter_count,
      condition_percent: i.condition_percent,
      status: i.status === 'LOST' ? 'MAINTENANCE' : i.status,
      purchase_date: i.purchase_date || undefined,
      purchase_price: i.purchase_price ? Number(i.purchase_price) : undefined,
      note: i.note || `Kính trong veo, ngoại hình ${i.condition_percent}%`,
    })),
  };
}

function transformRawModelToAccessory(raw: RawProductModel, index: number): AccessoryModel {
  const specs = raw.specs_json || {};
  const availableItems = (raw.items || []).filter((i) => i.status === 'AVAILABLE');
  const availableCount = availableItems.length > 0 ? availableItems.length : 1;
  const status = availableCount > 1 ? 'AVAILABLE' : availableCount === 1 ? 'LOW_STOCK' : 'BOOKED';

  const specsList: string[] = [];
  if (specs.type) specsList.push(specs.type);
  if (specs.capacity) specsList.push(`Dung lượng ${specs.capacity}`);
  if (specs.voltage) specsList.push(`Điện áp ${specs.voltage}`);
  if (specs.compatibility) specsList.push(`Tương thích: ${specs.compatibility}`);
  if (specs.read_speed) specsList.push(`Đọc: ${specs.read_speed}`);

  // Thêm từ khóa tiếng Việt & tiếng Anh phong phú cho bộ lọc tìm kiếm
  const lowerName = raw.model_name.toLowerCase();
  if (lowerName.includes('battery') || lowerName.includes('np-')) {
    specsList.push('Pin máy ảnh', 'Pin sạc Li-ion', 'Battery', 'pin');
  }
  if (lowerName.includes('charger') || lowerName.includes('bc-')) {
    specsList.push('Sạc pin', 'Bộ sạc đôi', 'Charger', 'sạc', 'sac');
  }
  if (lowerName.includes('flash') || lowerName.includes('ef-')) {
    specsList.push('Đèn Flash', 'Flash', 'chớp');
  }
  if (lowerName.includes('grip') || lowerName.includes('vg-') || lowerName.includes('mhg') || lowerName.includes('tg-')) {
    specsList.push('Báng cầm tay', 'Grip pin', 'Handgrip', 'grip');
  }
  if (lowerName.includes('case') || lowerName.includes('blc-') || lowerName.includes('lc-')) {
    specsList.push('Bao da máy ảnh', 'Leather Case', 'bao da');
  }
  if (lowerName.includes('adapter') || lowerName.includes('mount')) {
    specsList.push('Ngàm chuyển đổi', 'Mount Adapter', 'ngàm');
  }
  if (lowerName.includes('tube') || lowerName.includes('mcex')) {
    specsList.push('Ống nối Macro', 'Macro Tube', 'mcex');
  }
  if (lowerName.includes('conversion') || lowerName.includes('tcl') || lowerName.includes('wcl')) {
    specsList.push('Thấu kính chuyển đổi', 'Teleconverter', 'tcl', 'wcl');
  }
  if (lowerName.includes('hood') || lowerName.includes('lh-')) {
    specsList.push('Loa che nắng', 'Lens Hood', 'hood');
  }
  if (lowerName.includes('cap') || lowerName.includes('flcp') || lowerName.includes('rlcp') || lowerName.includes('bcp')) {
    specsList.push('Nắp đậy ống kính', 'Nắp thân máy', 'Cap', 'nắp');
  }
  if (lowerName.includes('filter') || lowerName.includes('prf-')) {
    specsList.push('Kính lọc bảo vệ', 'Filter PRF', 'kính lọc', 'filter');
  }
  if (specsList.length === 0) specsList.push('Phụ kiện chính hãng Fujifilm');

  return {
    id: `fuji-acc-${raw.id}`,
    name: raw.model_name,
    category: 'ACCESSORY',
    brand: raw.brand || 'Fujifilm',
    mountType: 'NONE',
    image: raw.image_url,
    dailyRate: Number(raw.base_rental_price_per_day),
    depositRate: Number(raw.deposit_amount),
    availableCount,
    status,
    highlightBadge: getHighlightBadge(raw.model_name, raw.category, index),
    description: raw.description,
    specs: specsList,
    officialUrl: specs.official_url,
    items: (raw.items || []).map((i) => ({
      serial_number: i.serial_number,
      shutter_count: i.shutter_count,
      condition_percent: i.condition_percent,
      status: i.status === 'LOST' ? 'MAINTENANCE' : i.status,
      purchase_date: i.purchase_date || undefined,
      purchase_price: i.purchase_price ? Number(i.purchase_price) : undefined,
      note: i.note || `Phụ kiện ${i.condition_percent}% Like New`,
    })),
  };
}

/**
 * Gọi API GET /api/models và phân loại theo 3 danh mục
 */
export async function fetchCatalog(): Promise<CatalogData> {
  const response = await fetch('/api/models');
  if (!response.ok) {
    throw new Error(`Failed to fetch models from API: ${response.status} ${response.statusText}`);
  }

  const rawModels: RawProductModel[] = await response.json();

  const cameras: CameraModel[] = [];
  const lenses: LensModel[] = [];
  const accessories: AccessoryModel[] = [];

  rawModels.forEach((model, index) => {
    if (model.category === 'BODY') {
      cameras.push(transformRawModelToCamera(model, cameras.length));
    } else if (model.category === 'LENS') {
      lenses.push(transformRawModelToLens(model, lenses.length));
    } else if (model.category === 'ACCESSORY') {
      accessories.push(transformRawModelToAccessory(model, accessories.length));
    }
  });

  return { cameras, lenses, accessories };
}

/**
 * Gọi API GET /api/models/:id
 */
export async function fetchModelById(id: number): Promise<RawProductModel> {
  const response = await fetch(`/api/models/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch model ${id}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
