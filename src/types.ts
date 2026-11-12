export interface ProductItem {
  serial_number: string;
  shutter_count?: number;
  condition_percent: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  purchase_date?: string;
  purchase_price?: number;
  note?: string;
}

export type CameraSeries =
  | 'X100'
  | 'X-S'
  | 'X-T'
  | 'X-M'
  | 'X-E'
  | 'X-Pro'
  | 'GFX'
  | 'X-H'
  | 'X half';

export interface CameraModel {
  id: string;
  name: string;
  category?: 'BODY';
  series: CameraSeries;
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
  subCategory?: string;
  compatibility?: string;
  capacity?: string;
  readSpeed?: string;
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

// Tính năng: Mở rộng ActiveReservation để lưu thông tin nhận diện khách vãng lai (guestPhone, isGuest)
export interface ActiveReservation {
  orderCode: string;
  modelName: string;
  items?: Array<{ modelId: string | number; modelName: string; quantity: number }>;
  assignedSerials: string[];
  startDate: string;
  expectedReturnDate: string;
  days: number;
  totalRent: number;
  depositAmount: number;
  totalDue: number;
  createdAt: number;
  paymentDeadline: string;
  expiresAt: number;
  isPaid?: boolean;
  isGuest?: boolean;
  guestPhone?: string;
}

