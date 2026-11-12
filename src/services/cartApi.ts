import { CartItem } from '../types';
import { RawProductModel, transformRawModelToEquipment } from './api';
import { getAccessTokenInMemory, getValidAccessToken } from './authApi';

export const GUEST_CART_STORAGE_KEY = 'refuji_guest_cart_items';
const LEGACY_CART_KEY = 'refuji_cart_items';
const LEGACY_CART_USER_KEY = 'refuji_cart_user_id';

export interface ServerCartItemDto {
  modelId: number;
  frontendId: string;
  quantity: number;
  addedAt: string;
  updatedAt: string;
  availableCount: number;
  model: RawProductModel;
}

export interface ServerCartResponse {
  items: ServerCartItemDto[];
  totalQuantity: number;
  previousQuantity?: number;
  mergedGuestCount?: number;
  warnings?: string[];
  message?: string;
}

export class CartApiError extends Error {
  status: number;
  maxAvailable?: number;
  serverCartItems?: CartItem[];

  constructor(
    message: string,
    status: number,
    maxAvailable?: number,
    serverCartItems?: CartItem[]
  ) {
    super(message);
    this.name = 'CartApiError';
    this.status = status;
    this.maxAvailable = maxAvailable;
    this.serverCartItems = serverCartItems;
  }
}

export function mapServerCartToCartItems(items: ServerCartItemDto[] = []): CartItem[] {
  return items.map((dto) => {
    const equipment = transformRawModelToEquipment(dto.model);
    return {
      id: dto.frontendId || equipment.id,
      item: {
        ...equipment,
        availableCount: dto.availableCount,
        status:
          dto.availableCount > 1
            ? 'AVAILABLE'
            : dto.availableCount === 1
            ? 'LOW_STOCK'
            : 'BOOKED',
      } as any,
      quantity: dto.quantity,
      addedAt: dto.addedAt || new Date().toISOString(),
    };
  });
}

export function readGuestCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawGuest = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (rawGuest) {
      const parsed = JSON.parse(rawGuest);
      return Array.isArray(parsed) ? parsed : [];
    }

    // Di chuyển dữ liệu legacy nếu trước đó là giỏ vãng lai (không gắn user_id)
    const legacyCart = localStorage.getItem(LEGACY_CART_KEY);
    const legacyUserId = localStorage.getItem(LEGACY_CART_USER_KEY);
    if (legacyCart) {
      localStorage.removeItem(LEGACY_CART_KEY);
      localStorage.removeItem(LEGACY_CART_USER_KEY);
      if (!legacyUserId) {
        const parsed = JSON.parse(legacyCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
  } catch (_) {}
  return [];
}

export function writeGuestCartToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (items.length > 0) {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    } else {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
    localStorage.removeItem(LEGACY_CART_KEY);
    localStorage.removeItem(LEGACY_CART_USER_KEY);
  } catch (_) {}
}

export function clearGuestCartStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_KEY);
    localStorage.removeItem(LEGACY_CART_USER_KEY);
  } catch (_) {}
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  let token = getAccessTokenInMemory();
  if (!token) {
    token = await getValidAccessToken();
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildDateQuery(startDate?: string, endDate?: string): string {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function handleCartResponse(res: Response): Promise<{
  cartItems: CartItem[];
  raw: ServerCartResponse;
}> {
  const data = (await res.json().catch(() => ({}))) as ServerCartResponse & {
    error?: string;
    message?: string;
    maxAvailable?: number;
  };

  if (res.ok) {
    return {
      cartItems: mapServerCartToCartItems(data.items || []),
      raw: data,
    };
  }

  const mappedOnError = Array.isArray(data.items)
    ? mapServerCartToCartItems(data.items)
    : undefined;

  throw new CartApiError(
    data.error || data.message || `Lỗi đồng bộ giỏ hàng (${res.status})`,
    res.status,
    data.maxAvailable,
    mappedOnError
  );
}

export async function fetchServerCart(
  startDate?: string,
  endDate?: string
): Promise<CartItem[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/cart${buildDateQuery(startDate, endDate)}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  const { cartItems } = await handleCartResponse(res);
  return cartItems;
}

export async function mergeGuestCartToServer(
  guestItems: CartItem[],
  startDate?: string,
  endDate?: string
): Promise<{
  cartItems: CartItem[];
  previousQuantity: number;
  mergedGuestCount: number;
  warnings: string[];
}> {
  const headers = await getAuthHeaders();
  const payload = {
    items: guestItems.map((ci) => ({
      modelId: ci.item?.id ?? ci.id,
      modelName: ci.item?.name,
      quantity: Math.max(1, ci.quantity || 1),
    })),
    start_date: startDate,
    end_date: endDate,
  };

  const res = await fetch('/api/cart/merge', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const { cartItems, raw } = await handleCartResponse(res);
  return {
    cartItems,
    previousQuantity: raw.previousQuantity || 0,
    mergedGuestCount: raw.mergedGuestCount || 0,
    warnings: raw.warnings || [],
  };
}

export async function addServerCartItem(
  modelId: string | number,
  quantity: number,
  startDate?: string,
  endDate?: string,
  modelName?: string
): Promise<{ cartItems: CartItem[]; message?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/cart/items', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      modelId,
      modelName,
      quantity,
      start_date: startDate,
      end_date: endDate,
    }),
  });
  const { cartItems, raw } = await handleCartResponse(res);
  return { cartItems, message: raw.message };
}

export async function updateServerCartItem(
  modelId: string | number,
  quantity: number,
  startDate?: string,
  endDate?: string
): Promise<CartItem[]> {
  const headers = await getAuthHeaders();
  const encodedId = encodeURIComponent(String(modelId));
  const res = await fetch(`/api/cart/items/${encodedId}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      quantity,
      start_date: startDate,
      end_date: endDate,
    }),
  });
  const { cartItems } = await handleCartResponse(res);
  return cartItems;
}

export async function removeServerCartItem(
  modelId: string | number,
  startDate?: string,
  endDate?: string
): Promise<CartItem[]> {
  const headers = await getAuthHeaders();
  const encodedId = encodeURIComponent(String(modelId));
  const res = await fetch(`/api/cart/items/${encodedId}${buildDateQuery(startDate, endDate)}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  const { cartItems } = await handleCartResponse(res);
  return cartItems;
}

export async function clearServerCart(): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/cart', {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  await handleCartResponse(res);
}
