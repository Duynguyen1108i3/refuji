/**
 * REFUJI API Client
 * Chuẩn bị sẵn sàng kết nối API Backend Express / Node.js 22 trên cổng 4000
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiClient {
  private static token: string | null = null;

  static setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('refuji_token', token);
    } else {
      localStorage.removeItem('refuji_token');
    }
  }

  static getAuthToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('refuji_token');
    }
    return this.token;
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
        throw new Error(errorData.message || `Lỗi HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err: any) {
      console.warn(`[ApiClient] Endpoint ${endpoint} chưa kết nối backend, sử dụng dữ liệu định kiểu:`, err.message);
      throw err;
    }
  }
}
