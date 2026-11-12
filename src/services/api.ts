import { CameraModel, LensModel, AccessoryModel, EquipmentItem } from '../types';
import {
  CAMERA_SERIES_META,
  compareCamerasBySeries,
  detectCameraSeries,
} from '../utils/cameraSeries';

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

// Tính năng: Nhận diện series máy ảnh chuẩn theo thứ tự 1. X100 -> 2. X-S -> 3. X-T -> 4. X-M -> 5. X-E -> 6. X-Pro -> 7. GFX
function getHighlightBadge(name: string, category: string, index: number): string | undefined {
  if (name.includes('X-T5 Body Silver') || (name.includes('X-T5') && !name.includes('X-T50'))) {
    return 'Được thuê nhiều nhất';
  }
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
  const availableCount = raw.items && raw.items.length > 0 ? availableItems.length : 0;
  const status = availableCount > 1 ? 'AVAILABLE' : availableCount === 1 ? 'LOW_STOCK' : 'BOOKED';

  const detectedSeries = detectCameraSeries(raw.model_name);
  const seriesMeta = CAMERA_SERIES_META.find((m) => m.series === detectedSeries);

  const specsList: string[] = [];
  if (specs.sensor) specsList.push(specs.sensor);
  if (specs.megapixels) specsList.push(`${specs.megapixels} MP`);
  if (specs.ibis) specsList.push(`IBIS ${specs.ibis}`);
  if (specs.burst_rate) specsList.push(`Chụp liên tiếp ${specs.burst_rate}`);
  if (specs.video) specsList.push(`Quay video ${specs.video}`);
  if (specs.film_simulations) specsList.push(specs.film_simulations);
  if (specsList.length === 0) specsList.push('Cảm biến X-Trans CMOS', 'Fujifilm X-Mount');

  return {
    id: `fuji-cam-${raw.id ?? index + 1}`,
    name: raw.model_name,
    category: 'BODY',
    series: detectedSeries,
    brand: raw.brand || 'Fujifilm',
    mountType: raw.mount_type || 'X_MOUNT',
    tagline: specs.tagline || seriesMeta?.featureSummary || 'Nhiếp ảnh thuần khiết',
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
  const availableCount = raw.items && raw.items.length > 0 ? availableItems.length : 0;
  const status = availableCount > 1 ? 'AVAILABLE' : availableCount === 1 ? 'LOW_STOCK' : 'BOOKED';

  const features: string[] = [];
  if (specs.lens_elements) features.push(`Cấu tạo ${specs.lens_elements}`);
  if (specs.linear_motor) features.push('Motor tuyến tính Linear Motor');
  if (specs.weather_resistant) features.push('Kháng thời tiết WR');
  if (specs.aperture_ring) features.push('Vòng khẩu độ vật lý có khóa A-Position');
  if (features.length === 0) features.push('Fujinon Aspherical Lens', 'Kháng bụi và nước WR');

  return {
    id: `fuji-lens-${raw.id ?? index + 1}`,
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
  const availableCount = raw.items && raw.items.length > 0 ? availableItems.length : 0;
  const status = availableCount > 1 ? 'AVAILABLE' : availableCount === 1 ? 'LOW_STOCK' : 'BOOKED';

  const specsList: string[] = [];
  if (specs.type) specsList.push(specs.type);
  if (specs.capacity) specsList.push(`Dung lượng ${specs.capacity}`);
  if (specs.voltage) specsList.push(`Điện áp ${specs.voltage}`);
  if (specs.compatibility) specsList.push(`Tương thích: ${specs.compatibility}`);
  if (specs.read_speed) specsList.push(`Tốc độ: ${specs.read_speed}`);

  // Thêm từ khóa tìm kiếm tiếng Việt & tiếng Anh cho 6 nhóm phụ kiện chuẩn
  const lowerName = raw.model_name.toLowerCase();
  const lowerType = String(specs.type || '').toLowerCase();
  if (lowerType.includes('pin') || lowerName.includes('pin') || lowerName.includes('np-') || lowerName.includes('sạc') || lowerName.includes('bc-')) {
    specsList.push('Pin & Sạc', 'Pin máy ảnh', 'Pin dự phòng', 'Bộ sạc đơn đôi', 'Battery', 'Charger', 'pin', 'sac');
  }
  if (lowerType.includes('thẻ') || lowerName.includes('thẻ nhớ') || lowerName.includes('sd ') || lowerName.includes('đầu đọc')) {
    specsList.push('Thẻ nhớ SD', 'Đầu đọc thẻ nhớ', 'SD Card', 'Card Reader', 'the nho', 'sd', '32gb', '64gb', '128gb');
  }
  if (lowerType.includes('flash') || lowerName.includes('flash') || lowerName.includes('godox') || lowerName.includes('tt350') || lowerName.includes('v350')) {
    specsList.push('Đèn Flash', 'Flash rời Fujifilm', 'Godox', 'TTL', 'HSS', 'flash', 'den flash');
  }
  if (lowerType.includes('tripod') || lowerName.includes('tripod') || lowerName.includes('chân máy')) {
    specsList.push('Tripod', 'Chân máy mini', 'Tripod du lịch', 'Tripod chuyên nghiệp', 'chan may', 'tripod');
  }
  if (lowerType.includes('micro') || lowerName.includes('micro') || lowerName.includes('lark') || lowerName.includes('rode') || lowerName.includes('shotgun')) {
    specsList.push('Microphone', 'Micro không dây', 'Micro shotgun', 'Thu âm', 'Hollyland', 'Rode', 'mic', 'micro');
  }
  if (lowerType.includes('gimbal') || lowerName.includes('gimbal') || lowerName.includes('dji rs')) {
    specsList.push('Gimbal', 'Chống rung 3 trục', 'DJI RS Series', 'Mirrorless', 'gimbal', 'chong rung');
  }
  if (specsList.length === 0) specsList.push('Phụ kiện Studio ReFuji');

  return {
    id: `fuji-acc-${raw.id ?? index + 1}`,
    name: raw.model_name,
    category: 'ACCESSORY',
    subCategory: specs.type || 'Phụ kiện',
    compatibility: specs.compatibility,
    capacity: specs.capacity,
    readSpeed: specs.read_speed,
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

export function transformRawModelToEquipment(raw: RawProductModel, index = 0): EquipmentItem {
  if (raw.category === 'BODY') {
    return transformRawModelToCamera(raw, index);
  }
  if (raw.category === 'LENS') {
    return transformRawModelToLens(raw, index);
  }
  return transformRawModelToAccessory(raw, index);
}

// Tính năng: Tải danh mục thiết bị từ API kèm bộ lọc khoảng ngày & truy vấn khả dụng từng mẫu máy
export async function fetchCatalog(startDate?: string, endDate?: string): Promise<CatalogData> {
  let rawModels: RawProductModel[] = [];

  try {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    const response = await fetch(`/api/models${qs ? `?${qs}` : ''}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        rawModels = data;
      } else if (data && Array.isArray((data as any).productModels)) {
        rawModels = (data as any).productModels;
      }
    } else {
      throw new Error(`Failed to fetch models from API: ${response.status}`);
    }
  } catch (err) {
    console.info('ℹ️ Đang tải danh mục thiết bị từ local catalog fallback...');
    try {
      const fallbackRes = await fetch('/fujifilm-catalog.json');
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (Array.isArray(fallbackData)) {
          rawModels = fallbackData;
        } else if (fallbackData && Array.isArray((fallbackData as any).productModels)) {
          rawModels = (fallbackData as any).productModels;
        }
      }
    } catch (fallbackErr) {
      console.error('Không thể tải catalog dự phòng:', fallbackErr);
    }
  }

  const cameras: CameraModel[] = [];
  const lenses: LensModel[] = [];
  const accessories: AccessoryModel[] = [];

  rawModels.forEach((model) => {
    if (model.category === 'BODY') {
      cameras.push(transformRawModelToCamera(model, cameras.length));
    } else if (model.category === 'LENS') {
      lenses.push(transformRawModelToLens(model, lenses.length));
    } else if (model.category === 'ACCESSORY') {
      accessories.push(transformRawModelToAccessory(model, accessories.length));
    }
  });

  cameras.sort(compareCamerasBySeries);

  return { cameras, lenses, accessories };
}

export interface ModelAvailabilityResponse {
  modelId: number;
  modelName: string;
  startDate: string;
  endDate: string;
  activePool: number;
  bookedUnits: number;
  availableCount: number;
  availableSerials: string[];
}

// Tính năng: Kiểm tra số lượng máy trống theo ngày nhận - trả cho BookingModal
export async function fetchModelAvailability(
  modelId: string | number,
  startDate: string,
  endDate: string
): Promise<ModelAvailabilityResponse | null> {
  const str = String(modelId);
  const match = str.match(/(\d+)$/);
  const numericId = match ? parseInt(match[1], 10) : parseInt(str, 10);
  if (isNaN(numericId)) return null;

  try {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    const response = await fetch(`/api/models/${numericId}/availability?${params.toString()}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (_) {
    return null;
  }
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
