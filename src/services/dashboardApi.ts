// Dịch vụ gọi API riêng cho Phân hệ Dashboard Quản trị & Vận hành POS ReFuji
import { getAccessTokenInMemory, getValidAccessToken, refreshAuthSession } from './authApi';
import type {
  AdminOrderRow,
  AuditLogRow,
  CustomerRow,
  DamageLevelType,
  DashboardOverviewData,
  GuestSummaryRow,
  MaintenanceLogRow,
  OrderDossierData,
  PaymentTransactionRow,
  ProductItemRow,
  ProductModelRow,
  SettlementCalculationResult,
} from '../components/dashboard/dashboardTypes';

async function adminFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const executeRequest = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(init.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers as Record<string, string> | undefined),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      return await fetch(url, {
        ...init,
        headers,
        credentials: 'include',
        cache: 'no-store',
      });
    } catch {
      throw new Error('Không thể kết nối máy chủ Backend (Port 4000).');
    }
  };

  let token = getAccessTokenInMemory();
  if (!token) {
    token = await getValidAccessToken();
  }

  let res = await executeRequest(token);

  // Tự động khôi phục phiên qua HttpOnly Refresh Token nếu Access Token vừa hết hạn 15p
  if (res.status === 401) {
    const refreshed = await refreshAuthSession();
    if (refreshed?.accessToken) {
      res = await executeRequest(refreshed.accessToken);
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Lỗi hệ thống (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

// Nén ảnh kiểm định tại trình duyệt (tối đa 1080px, JPEG 0.72) giúp lưu DB nhanh và hiển thị rõ nét trong Biên bản
export async function compressInspectionPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Định dạng ảnh không hợp lệ.'));
      img.onload = () => {
        const maxDim = 1080;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// 1. Tổng quan & Tác vụ tự động
export function fetchDashboardOverview(): Promise<DashboardOverviewData> {
  return adminFetch<DashboardOverviewData>('/api/admin/reports/dashboard');
}

export function triggerOperationalSweep(): Promise<{
  success: boolean;
  message: string;
  report: {
    ranAt: string;
    releasedExpiredHolds: number;
    markedOverdue: number;
    escalatedCritical: number;
    maintenanceAlerts: number;
  };
}> {
  return adminFetch('/api/admin/cron/run-sweep', { method: 'POST' });
}

// 2. Hàng đợi đơn hàng & Nghiệp vụ POS
export function fetchAdminOrders(params?: {
  status?: string;
  customer_type?: string;
  search?: string;
}): Promise<AdminOrderRow[]> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') qs.set('status', params.status);
  if (params?.customer_type && params.customer_type !== 'all') qs.set('customer_type', params.customer_type);
  if (params?.search?.trim()) qs.set('search', params.search.trim());
  const qStr = qs.toString();
  return adminFetch<AdminOrderRow[]>(`/api/admin/orders${qStr ? `?${qStr}` : ''}`);
}

export function fetchOrderDossier(orderCode: string): Promise<OrderDossierData> {
  return adminFetch<OrderDossierData>(`/api/admin/orders/${encodeURIComponent(orderCode)}/records`);
}

export function approveAdminOrder(orderCode: string): Promise<{ success: boolean; message: string; assignedSerials?: string[] }> {
  return adminFetch(`/api/admin/orders/${encodeURIComponent(orderCode)}/approve`, { method: 'POST' });
}

export function rejectAdminOrder(orderCode: string, reason?: string): Promise<{ success: boolean; message: string }> {
  return adminFetch(`/api/admin/orders/${encodeURIComponent(orderCode)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'Nhân viên POS từ chối / hủy đơn' }),
  });
}

export function submitOrderCheckout(
  orderCode: string,
  payload: {
    kyc_verification_method: string;
    kyc_document_last4: string;
    contract_signed: boolean;
    assigned_serials: string[];
    accessories: Record<string, boolean>;
    shutter_snapshots: Record<string, number>;
    condition_notes: string;
    collect_remaining_rent: boolean;
    rent_payment_method: string;
    photos: Array<{ photo_data: string; caption?: string; serial_number?: string }>;
  }
): Promise<{ success: boolean; message: string; orderStatus: string; assignedSerials: string[] }> {
  return adminFetch(`/api/admin/orders/${encodeURIComponent(orderCode)}/checkout`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface CheckinItemPayload {
  serial_number: string;
  model_name?: string;
  unit_deposit: number;
  condition_after: number;
  shutter_count_after: number;
  damage_level: DamageLevelType;
  damage_description?: string;
  custom_damage_fee?: number | null;
  accessories_returned?: Record<string, boolean>;
  missing_accessories_fee?: number;
  next_item_status?: 'AVAILABLE' | 'MAINTENANCE' | 'LOST';
}

export function previewOrderCheckin(
  orderCode: string,
  payload: {
    actual_return_date: string;
    other_fee?: number;
    item_inspections: CheckinItemPayload[];
  }
): Promise<{ success: boolean; calculation: SettlementCalculationResult }> {
  return adminFetch(`/api/admin/orders/${encodeURIComponent(orderCode)}/checkin-preview`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function submitOrderCheckin(
  orderCode: string,
  payload: {
    actual_return_date: string;
    other_fee?: number;
    other_fee_description?: string;
    staff_inspection_notes?: string;
    refund_method: 'BANK_TRANSFER' | 'CASH';
    item_inspections: CheckinItemPayload[];
    photos?: Array<{ photo_data: string; caption?: string; serial_number?: string }>;
  }
): Promise<{ success: boolean; message: string; orderStatus: string; calculation: SettlementCalculationResult }> {
  return adminFetch(`/api/admin/orders/${encodeURIComponent(orderCode)}/checkin`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 3. Danh mục Mẫu mã (ProductModels)
export function fetchAdminModels(params?: { category?: string; search?: string }): Promise<ProductModelRow[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'ALL') qs.set('category', params.category);
  if (params?.search?.trim()) qs.set('search', params.search.trim());
  const qStr = qs.toString();
  return adminFetch<ProductModelRow[]>(`/api/admin/models${qStr ? `?${qStr}` : ''}`);
}

export function createAdminModel(payload: {
  model_name: string;
  category: 'BODY' | 'LENS' | 'ACCESSORY';
  mount_type: 'X_MOUNT' | 'G_MOUNT' | 'NONE';
  brand?: string;
  base_rental_price_per_day: number;
  deposit_amount: number;
  description?: string;
  image_url?: string;
  specs_json?: Record<string, any>;
  initial_serial?: string;
}): Promise<{ success: boolean; id: number; message: string }> {
  return adminFetch('/api/admin/models', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateAdminModel(
  modelId: number,
  payload: Partial<{
    model_name: string;
    category: 'BODY' | 'LENS' | 'ACCESSORY';
    mount_type: 'X_MOUNT' | 'G_MOUNT' | 'NONE';
    base_rental_price_per_day: number;
    deposit_amount: number;
    description: string;
    image_url: string;
    is_active: boolean;
  }>
): Promise<{ success: boolean; message: string }> {
  return adminFetch(`/api/admin/models/${modelId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function toggleAdminModelStatus(modelId: number, is_active: boolean): Promise<{ success: boolean; is_active: boolean; message: string }> {
  return adminFetch(`/api/admin/models/${modelId}/status`, { method: 'PATCH', body: JSON.stringify({ is_active }) });
}

// 4. Kho cá thể theo Serial (ProductItems) & Bảo dưỡng
export function fetchAdminItems(params?: { status?: string; search?: string; model_id?: number }): Promise<ProductItemRow[]> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') qs.set('status', params.status);
  if (params?.model_id) qs.set('model_id', String(params.model_id));
  if (params?.search?.trim()) qs.set('search', params.search.trim());
  const qStr = qs.toString();
  return adminFetch<ProductItemRow[]>(`/api/admin/items${qStr ? `?${qStr}` : ''}`);
}

export function createAdminItem(payload: {
  model_id: number;
  serial_number: string;
  shutter_count?: number;
  condition_percent?: number;
  purchase_date?: string;
  purchase_price?: number | null;
  next_maintenance_date?: string | null;
  note?: string;
}): Promise<{ success: boolean; id: number; message: string }> {
  return adminFetch('/api/admin/items', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateAdminItem(
  itemId: number,
  payload: {
    shutter_count?: number;
    condition_percent?: number;
    status?: string;
    next_maintenance_date?: string | null;
    note?: string;
  }
): Promise<{ success: boolean; message: string }> {
  return adminFetch(`/api/admin/items/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function fetchMaintenanceData(): Promise<{ logs: MaintenanceLogRow[]; dueAlerts: ProductItemRow[] }> {
  return adminFetch('/api/admin/maintenance');
}

export function createMaintenanceTicket(payload: {
  item_id: number;
  maintenance_type: string;
  description: string;
  cost?: number;
  external_vendor?: string;
  next_maintenance_date?: string;
}): Promise<{ success: boolean; id: number; message: string }> {
  return adminFetch('/api/admin/maintenance', { method: 'POST', body: JSON.stringify(payload) });
}

export function completeMaintenanceTicket(
  logId: number,
  payload: { cost?: number; next_maintenance_date?: string; condition_percent?: number }
): Promise<{ success: boolean; message: string }> {
  return adminFetch(`/api/admin/maintenance/${logId}/complete`, { method: 'PATCH', body: JSON.stringify(payload) });
}

// 5. Tài chính & Sổ cái Giao dịch
export function fetchPaymentsLedger(params?: {
  type?: string;
  method?: string;
  search?: string;
}): Promise<{
  transactions: PaymentTransactionRow[];
  summary: {
    totalCollected: number;
    totalDeposits: number;
    totalRefunds: number;
    totalPenalties: number;
    netCashflow: number;
  };
}> {
  const qs = new URLSearchParams();
  if (params?.type && params.type !== 'ALL') qs.set('type', params.type);
  if (params?.method && params.method !== 'ALL') qs.set('method', params.method);
  if (params?.search?.trim()) qs.set('search', params.search.trim());
  const qStr = qs.toString();
  return adminFetch(`/api/admin/payments${qStr ? `?${qStr}` : ''}`);
}

export function recordManualPayment(payload: {
  order_code: string;
  amount: number;
  payment_method: string;
  transaction_type: string;
  note?: string;
}): Promise<{ success: boolean; transaction_code: string; message: string }> {
  return adminFetch('/api/admin/payments/manual', { method: 'POST', body: JSON.stringify(payload) });
}

// 6. Khách hàng, KYC & Uy tín
export function fetchCustomers(params?: { tier?: string; role?: string; search?: string }): Promise<CustomerRow[]> {
  const qs = new URLSearchParams();
  if (params?.tier && params.tier !== 'ALL') qs.set('tier', params.tier);
  if (params?.role && params.role !== 'ALL') qs.set('role', params.role);
  if (params?.search?.trim()) qs.set('search', params.search.trim());
  const qStr = qs.toString();
  return adminFetch<CustomerRow[]>(`/api/admin/customers${qStr ? `?${qStr}` : ''}`);
}

export function fetchGuestSummary(): Promise<GuestSummaryRow[]> {
  return adminFetch<GuestSummaryRow[]>('/api/admin/customers/guests/summary');
}

export function fetchCustomerDetail(userId: number): Promise<{ customer: CustomerRow; orders: any[] }> {
  return adminFetch(`/api/admin/customers/${userId}`);
}

export function updateCustomerStatus(
  userId: number,
  is_active: boolean,
  reason?: string
): Promise<{ success: boolean; is_active: boolean; message: string }> {
  return adminFetch(`/api/admin/customers/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active, reason }),
  });
}

export function updateCustomerTier(
  userId: number,
  membership_tier: string
): Promise<{ success: boolean; membership_tier: string; message: string }> {
  return adminFetch(`/api/admin/customers/${userId}/tier`, {
    method: 'PATCH',
    body: JSON.stringify({ membership_tier }),
  });
}

export function updateCustomerRole(
  userId: number,
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN'
): Promise<{ success: boolean; role: 'CUSTOMER' | 'STAFF' | 'ADMIN'; message: string }> {
  return adminFetch(`/api/admin/customers/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function adjustCustomerReputation(
  userId: number,
  reputation_score: number,
  reason?: string
): Promise<{ success: boolean; reputation_score: number; is_active: boolean; message: string }> {
  return adminFetch(`/api/admin/customers/${userId}/reputation`, {
    method: 'PATCH',
    body: JSON.stringify({ reputation_score, reason }),
  });
}

// 7. Nhật ký kiểm toán (Audit Logs)
export function fetchAuditLogs(params?: {
  actor_type?: string;
  entity_type?: string;
  search?: string;
}): Promise<AuditLogRow[]> {
  const qs = new URLSearchParams();
  if (params?.actor_type && params.actor_type !== 'ALL') qs.set('actor_type', params.actor_type);
  if (params?.entity_type && params.entity_type !== 'ALL') qs.set('entity_type', params.entity_type);
  if (params?.search?.trim()) qs.set('search', params.search.trim());
  const qStr = qs.toString();
  return adminFetch<AuditLogRow[]>(`/api/admin/audit-logs${qStr ? `?${qStr}` : ''}`);
}
