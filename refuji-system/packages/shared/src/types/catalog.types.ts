import { ItemStatus } from '../enums/item-status.enum.ts';

export type MountCategory = 'X' | 'G' | 'FIXED';
export type ProductCategory = 'BODY' | 'LENS' | 'ACCESSORY';

export interface ProductItemEntity {
  id: number;
  modelId: number;
  serialNumber: string;
  shutterCount: number;
  conditionPercent: number;
  status: ItemStatus;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
}

export interface ProductModelEntity {
  id: number;
  modelName: string;
  slug: string;
  category: ProductCategory;
  mount: MountCategory; // 'X' | 'G' | 'FIXED'
  brand: string;
  baseRentalPricePerDay: number;
  depositAmount: number; // Base standard deposit (1 level only)
  description: string;
  specsJson?: Record<string, any>;
  imageUrl: string;
  highlightBadge?: string;
  tagline?: string;
  items?: ProductItemEntity[];
  availableCount?: number;
}
