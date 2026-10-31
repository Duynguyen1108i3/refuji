export interface ProductItem {
  serial_number: string;
  shutter_count?: number;
  condition_percent: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  purchase_date?: string;
  purchase_price?: number;
  note?: string;
}

export interface CameraModel {
  id: string;
  name: string;
  category?: 'BODY';
  series: 'X100' | 'X-T' | 'X-H' | 'GFX';
  brand?: string;
  mountType?: 'X_MOUNT' | 'G_MOUNT' | 'NONE';
  tagline: string;
  sensor: string;
  resolution: string;
  image: string;
  dailyRate: number; // VND (DECIMAL 12,0)
  depositRate: number; // VND
  availableCount: number;
  status?: 'AVAILABLE' | 'LOW_STOCK' | 'BOOKED';
  highlightBadge?: string;
  description: string;
  specs: string[];
  items?: ProductItem[];
  officialUrl?: string;
}

export interface LensModel {
  id: string;
  name: string;
  category?: 'LENS';
  mount: 'X' | 'GF';
  brand?: string;
  mountType?: 'X_MOUNT' | 'G_MOUNT' | 'NONE';
  focalLength: string;
  aperture: string;
  image: string;
  dailyRate: number; // VND
  depositRate: number; // VND
  availableCount: number;
  status?: 'AVAILABLE' | 'LOW_STOCK' | 'BOOKED';
  highlightBadge?: string;
  description: string;
  features: string[];
  weight?: string;
  filterSize?: string;
  items?: ProductItem[];
  officialUrl?: string;
}

export interface AccessoryModel {
  id: string;
  name: string;
  category: 'ACCESSORY';
  brand?: string;
  mountType?: 'NONE';
  image: string;
  dailyRate: number; // VND
  depositRate: number; // VND
  availableCount: number;
  status?: 'AVAILABLE' | 'LOW_STOCK' | 'BOOKED';
  highlightBadge?: string;
  description: string;
  specs: string[];
  items?: ProductItem[];
  officialUrl?: string;
}

export type EquipmentItem = CameraModel | LensModel | AccessoryModel;

export interface CartItem {
  id: string;
  item: EquipmentItem & { type?: 'BODY' | 'LENS' | 'ACCESSORY' };
  quantity: number;
  addedAt: string;
}
