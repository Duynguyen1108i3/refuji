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

/**
 * Khôi phục phiên làm việc (Silent Refresh) từ HttpOnly Cookie refuji_refresh_token
 * Đảm bảo người dùng reload trang (F5) không bị đăng xuất
 */
export async function refreshAuthSession(): Promise<AuthResponse | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
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
    throw new Error('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.');
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

/**
 * Gọi API POST /api/orders (Tạo đơn đặt thuê giữ chỗ 15 phút thật qua Backend)
 */
export async function createRentalOrder(
  intent: PendingRentalIntent,
  userId: number
): Promise<{
  success: boolean;
  orderId: string;
  holdDeadline: string;
  payment_deadline?: string;
  assignedSerials?: string[];
  message?: string;
}> {
  let token = getAccessTokenInMemory();
  if (!token) {
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
      user_id: userId,
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

/**
 * Gọi API POST /api/orders/:orderCode/pay (Thanh toán cọc và xác nhận đơn thuê)
 */
export async function payRentalOrder(
  orderCode: string,
  paymentMethod: 'VIETQR' | 'VNPAY' | 'COUNTER' = 'VIETQR'
): Promise<{ success: boolean; message: string; orderStatus: string }> {
  let token = getAccessTokenInMemory();
  if (!token) {
    token = await getValidAccessToken();
  }
  const response = await fetch(`/api/orders/${orderCode}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ payment_method: paymentMethod }),
  });

  if (response.ok) {
    return await response.json();
  }

  const err = await response.json().catch(() => ({}));
  throw new Error(err.error || err.message || 'Không thể xử lý thanh toán');
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
