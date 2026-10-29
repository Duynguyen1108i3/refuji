export interface CameraModel {
  id: string;
  name: string;
  category?: 'BODY';
  series: 'X100' | 'X-T' | 'X-H' | 'GFX';
  tagline: string;
  sensor: string;
  resolution: string;
  image: string;
  dailyRate: number; // VND
  depositRate: number; // VND
  availableCount: number;
  highlightBadge?: string;
  description: string;
  specs: string[];
}

export interface LensModel {
  id: string;
  name: string;
  category?: 'LENS';
  mount: 'X' | 'GF';
  focalLength: string;
  aperture: string;
  image: string;
  dailyRate: number; // VND
  depositRate: number; // VND
  availableCount: number;
  highlightBadge?: string;
  description: string;
  features: string[];
}

export interface AccessoryModel {
  id: string;
  name: string;
  category: 'ACCESSORY';
  image: string;
  dailyRate: number; // VND
  depositRate: number; // VND
  availableCount: number;
  highlightBadge?: string;
  description: string;
  specs: string[];
}

export type EquipmentItem = CameraModel | LensModel | AccessoryModel;
