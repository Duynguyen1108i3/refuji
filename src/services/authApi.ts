import { LoginFormData, RegisterFormData, ForgotPasswordFormData } from '../schemas/auth.schema';

export type { LoginFormData, RegisterFormData, ForgotPasswordFormData };

export type MembershipTierType = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface UserAccount {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  membership_tier: MembershipTierType;
  reputation_score: number;
  total_completed_rentals: number;
  avatar_url?: string | null;
  id_card_last4?: string | null;
  privacy_consent_at?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: UserAccount;
  accessToken: string;
  message?: string;
}

export interface PendingRentalIntent {
  type: 'BOOK_RENTAL';
  source?: 'CART' | 'BOOKING_MODAL';
  modelId: string | number;
  modelName: string;
  startDate: string;
  expectedReturnDate: string;
  dailyRate: number;
  depositRate: number;
  days: number;
  totalRent: number;
  totalDue: number;
  quantity?: number;
  items?: Array<{
    modelId: string | number;
    modelName: string;
    quantity: number;
  }>;
}

// ==========================================
// BẢO MẬT: CHỈ LƯU ACCESS TOKEN TRONG BỘ NHỚ (MEMORY)
// TUYỆT ĐỐI KHÔNG LƯU TOKEN NHẠY CẢM VÀO LOCALSTORAGE
// ==========================================
let inMemoryAccessToken: string | null = null;
const REFUJI_USER_STORAGE_KEY = 'refuji_auth_user';

export const saveUserToStorage = (user: UserAccount | null) => {
  try {
    if (user) {
      localStorage.setItem(REFUJI_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(REFUJI_USER_STORAGE_KEY);
    }
  } catch (_) {}
};

export const getSavedUserFromStorage = (): UserAccount | null => {
  try {
    const raw = localStorage.getItem(REFUJI_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const setAccessTokenInMemory = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessTokenInMemory = (): string | null => {
  return inMemoryAccessToken;
};

let inFlightRefreshPromise: Promise<AuthResponse | null> | null = null;

/**
 * Khôi phục phiên làm việc (Silent Refresh) từ HttpOnly Cookie refuji_refresh_token
 * Đảm bảo người dùng reload trang (F5) không bị đăng xuất và chống gọi trùng khi nhiều component mount cùng lúc
 */
export async function refreshAuthSession(): Promise<AuthResponse | null> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const result: AuthResponse = await response.json();
        setAccessTokenInMemory(result.accessToken);
        saveUserToStorage(result.user);
        return result;
      }
    } catch (_) {
      // Không thể kết nối tới server
    }

    setAccessTokenInMemory(null);
    saveUserToStorage(null);
    return null;
  })();

  try {
    return await inFlightRefreshPromise;
  } finally {
    inFlightRefreshPromise = null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  const res = await refreshAuthSession();
  return res ? res.accessToken : null;
}

/**
 * Gọi API POST /api/auth/login (Xác thực thật 100% qua Backend)
 */
export async function loginUser(data: LoginFormData): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Gửi & nhận HttpOnly Refresh Token cookie
      body: JSON.stringify(data),
    });
  } catch (netErr: any) {
    throw new Error('Không thể kết nối đến máy chủ Backend (Port 4000). Vui lòng đảm bảo Backend API đang hoạt động.');
  }

  if (response.ok) {
    const result: AuthResponse = await response.json();
    setAccessTokenInMemory(result.accessToken);
    saveUserToStorage(result.user);
    return result;
  }

  const err = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 400) {
    throw new Error(err.message || 'Email hoặc mật khẩu không chính xác');
  }

  if (response.status === 429) {
    throw new Error(err.message || 'Bạn đã thử sai quá nhiều lần. Vui lòng thử lại sau ít phút.');
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    throw new Error(err.message || 'Máy chủ Backend (Port 4000) không phản hồi hoặc đang tắt. Vui lòng kiểm tra lại dịch vụ Backend.');
  }

  throw new Error(err.message || (response.status === 500 ? 'Máy chủ Backend (Port 4000) không phản hồi hoặc gặp sự cố. Vui lòng kiểm tra lại dịch vụ Backend.' : `Lỗi máy chủ (${response.status})`));
}

/**
 * Gọi API POST /api/auth/register (Đăng ký tài khoản thật 100% qua Backend)
 */
export async function registerUser(data: RegisterFormData): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirm_password: data.confirm_password,
        privacy_consent: data.privacy_consent,
      }),
    });
  } catch (netErr: any) {
    throw new Error('Không thể kết nối đến máy chủ Backend (Port 4000). Vui lòng đảm bảo Backend API đang hoạt động.');
  }

  if (response.ok) {
    const result: AuthResponse = await response.json();
    setAccessTokenInMemory(result.accessToken);
    return result;
  }

  const err = await response.json().catch(() => ({}));
  if (response.status === 409) {
    throw new Error(err.message || 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.');
  }

  if (err && err.message) {
    throw new Error(err.message);
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    throw new Error('Máy chủ Backend (Port 4000) không phản hồi hoặc đang tắt. Vui lòng khởi động Backend API.');
  }

  throw new Error(err.message || 'Đăng ký tài khoản không thành công');
}

/**
 * Gọi API POST /api/auth/forgot-password (Yêu cầu khôi phục thật qua Backend)
 */
export async function requestForgotPassword(data: ForgotPasswordFormData): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return await response.json();
  }

  const err = await response.json().catch(() => ({}));
  throw new Error(err.message || 'Không thể xử lý yêu cầu đặt lại mật khẩu');
}

/**
 * Gọi API GET /api/users/me (Lấy thông tin người dùng từ Backend qua JWT)
 */
export async function getCurrentUserProfile(): Promise<UserAccount | null> {
  const token = await getValidAccessToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (response.ok) {
      const user = await response.json();
      saveUserToStorage(user);
      return user;
    }
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Gọi API POST /api/auth/logout (Đăng xuất thật và xóa cookie)
 */
export async function logoutUser(): Promise<void> {
  try {
    const token = getAccessTokenInMemory();
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
  } catch (_) {
    // ignore
  } finally {
    setAccessTokenInMemory(null);
    saveUserToStorage(null);
  }
}

// Tính năng: Hỗ trợ tạo đơn, thanh toán, tra cứu và tự hủy đơn cho cả Thành viên và Khách vãng lai
export interface GuestInfoPayload {
  full_name: string;
  phone: string;
  email: string;
  note?: string;
  privacy_consent: boolean;
}

export type GuestBookingMode = 'ONLINE_PAYMENT' | 'COUNTER_INQUIRY';

export interface CreateOrderOptions {
  guestInfo?: GuestInfoPayload;
  bookingMode?: GuestBookingMode;
  paymentMethod?: 'VIETQR' | 'VNPAY' | 'COUNTER';
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  status?: string;
  isGuest?: boolean;
  paymentMethod?: 'VIETQR' | 'VNPAY' | 'COUNTER';
  holdDeadline: string | null;
  payment_deadline?: string | null;
  assignedSerials?: string[];
  totalRent?: number;
  depositAmount?: number;
  totalDue?: number;
  message?: string;
}

export interface GuestLookupOrderResponse {
  id: number;
  order_code: string;
  is_guest: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  guest_note?: string | null;
  payment_method: 'VIETQR' | 'VNPAY' | 'COUNTER';
  model_id: string;
  model_name: string;
  start_date: string;
  expected_return_date: string;
  total_rent: number;
  deposit_amount: number;
  order_status: string;
  payment_deadline: string | null;
  created_at: string;
  assigned_serials: string | null;
  quantity: number;
  items_detail: string | null;
}

export interface RecentGuestOrder {
  orderCode: string;
  phone: string;
  modelName: string;
  status: string;
  createdAt: number;
}

const GUEST_PROFILE_KEY = 'refuji_guest_profile';
const GUEST_ORDERS_KEY = 'refuji_guest_orders';

export function saveGuestProfileDraft(info: Partial<GuestInfoPayload>): void {
  try {
    localStorage.setItem(
      GUEST_PROFILE_KEY,
      JSON.stringify({
        full_name: info.full_name || '',
        phone: info.phone || '',
        email: info.email || '',
        note: info.note || '',
      })
    );
  } catch (_) {}
}

export function getGuestProfileDraft(): Partial<GuestInfoPayload> | null {
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function getRecentGuestOrders(): RecentGuestOrder[] {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

export function saveRecentGuestOrder(entry: RecentGuestOrder): void {
  try {
    const current = getRecentGuestOrders().filter((o) => o.orderCode !== entry.orderCode);
    const next = [entry, ...current].slice(0, 10);
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(next));
  } catch (_) {}
}

export function updateRecentGuestOrderStatus(orderCode: string, status: string): void {
  try {
    const current = getRecentGuestOrders();
    const next = current.map((o) => (o.orderCode === orderCode ? { ...o, status } : o));
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(next));
  } catch (_) {}
}

export async function createRentalOrder(
  intent: PendingRentalIntent,
  userId?: number | null,
  options?: CreateOrderOptions
): Promise<CreateOrderResponse> {
  let token = getAccessTokenInMemory();
  if (!token && userId) {
    token = await getValidAccessToken();
  }
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      ...(userId ? { user_id: userId } : {}),
      ...(options?.guestInfo ? { guest_info: options.guestInfo } : {}),
      ...(options?.bookingMode ? { booking_mode: options.bookingMode } : {}),
      ...(options?.paymentMethod ? { payment_method: options.paymentMethod } : {}),
      model_id: intent.modelId,
      model_name: intent.modelName,
      start_date: intent.startDate,
      expected_return_date: intent.expectedReturnDate,
      total_rent: intent.totalRent,
      deposit_amount: intent.depositRate,
      quantity: intent.quantity || 1,
      items: intent.items || [],
    }),
  });

  if (response.ok) {
    return await response.json();
  }

  const err = await response.json().catch(() => ({}));
  throw new Error(err.error || err.message || 'Không thể tạo đơn giữ chỗ');
}

export async function payRentalOrder(
  orderCode: string,
  paymentMethod: 'VIETQR' | 'VNPAY' | 'COUNTER' = 'VIETQR',
  guestPhone?: string
): Promise<{ success: boolean; message: string; orderStatus: string; assignedSerials?: string[] }> {
  let token = getAccessTokenInMemory();
  if (!token && !guestPhone) {
    token = await getValidAccessToken();
  }
  const response = await fetch(`/api/orders/${orderCode}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({
      payment_method: paymentMethod,
      ...(guestPhone ? { guest_phone: guestPhone } : {}),
    }),
  });

  if (response.ok) {
    return await response.json();
  }

  const err = await response.json().catch(() => ({}));
  throw new Error(err.error || err.message || 'Không thể xử lý thanh toán');
}

// Tính năng: Tra cứu đơn hàng khách vãng lai theo cặp Mã đơn + Số điện thoại
export async function lookupGuestOrder(
  orderCode: string,
  phone: string
): Promise<GuestLookupOrderResponse> {
  const params = new URLSearchParams({
    orderCode: orderCode.replace(/^#/, '').trim().toUpperCase(),
    phone: phone.replace(/[\s.-]/g, '').trim(),
  });
  const response = await fetch(`/api/orders/guest-lookup?${params.toString()}`);
  if (response.ok) {
    return await response.json();
  }
  const err = await response.json().catch(() => ({}));
  throw new Error(err.error || 'Không tìm thấy đơn hàng khớp với thông tin đã nhập');
}

// Tính năng: Khách vãng lai tự hủy giữ chỗ hoặc hủy yêu cầu đặt tại quầy
export async function cancelGuestOrder(
  orderCode: string,
  phone: string
): Promise<{ success: boolean; orderCode: string; orderStatus: string; message: string }> {
  const cleanCode = orderCode.replace(/^#/, '').trim().toUpperCase();
  const response = await fetch(`/api/orders/${cleanCode}/guest-cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone: phone.replace(/[\s.-]/g, '').trim() }),
  });
  if (response.ok) {
    return await response.json();
  }
  const err = await response.json().catch(() => ({}));
  throw new Error(err.error || 'Không thể hủy đơn hàng');
}

// Tính năng: Thành viên tự hủy giữ chỗ hoặc hủy đơn chờ duyệt qua JWT Bearer/Cookie
export async function cancelMyOrder(
  orderCode: string
): Promise<{ success: boolean; orderCode: string; orderStatus: string; message: string }> {
  let token = getAccessTokenInMemory();
  if (!token) {
    token = await getValidAccessToken();
  }

  const cleanCode = orderCode.replace(/^#/, '').trim().toUpperCase();
  const response = await fetch(`/api/orders/${cleanCode}/cancel`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (response.ok) {
    return await response.json();
  }
  const err = await response.json().catch(() => ({}));
  throw new Error(err.error || 'Không thể hủy giữ chỗ đơn hàng');
}

/**
 * Đổi mật khẩu tài khoản kèm các ràng buộc bảo mật
 */
export async function changePasswordApi(data: {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}): Promise<{ success: boolean; message: string }> {
  let token = getAccessTokenInMemory();
  if (!token) {
    token = await getValidAccessToken();
  }

  const response = await fetch('/api/users/change-password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const resJson = await response.json().catch(() => ({}));
  if (response.ok) {
    return resJson;
  }
  throw new Error(resJson.message || 'Không thể đổi mật khẩu');
}

/**
 * Cập nhật số thẻ Căn cước (CCCD) kèm ràng buộc pháp lý & đơn thuê
 */
export async function updateCccdApi(data: {
  new_id_card: string;
  password_confirmation: string;
}): Promise<{ success: boolean; message: string; id_card_last4: string }> {
  let token = getAccessTokenInMemory();
  if (!token) {
    token = await getValidAccessToken();
  }

  const response = await fetch('/api/users/update-kyc-cccd', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const resJson = await response.json().catch(() => ({}));
  if (response.ok) {
    return resJson;
  }
  throw new Error(resJson.message || 'Không thể cập nhật số CCCD');
}
