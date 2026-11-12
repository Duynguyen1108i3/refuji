// Tính năng: Bộ tính toán khả dụng thiết bị theo giao thoa khoảng ngày (Date-Range Overlap), loại trừ GUEST_INQUIRY & đơn giữ chỗ quá hạn
import { db } from '../../db.js';

export function getTodayLocalStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function addDaysToDateStr(baseStr: string, days: number): string {
  const parts = baseStr.slice(0, 10).split('-').map(Number);
  const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function normalizeDateStr(input?: string | null): string {
  if (!input) return '';
  const trimmed = String(input).trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

export function releaseExpiredPendingHolds(): void {
  try {
    db.prepare(`
      UPDATE rental_orders
      SET order_status = 'CANCELLED'
      WHERE order_status = 'PENDING_PAYMENT'
        AND payment_deadline IS NOT NULL
        AND datetime(payment_deadline) < datetime('now')
    `).run();
  } catch (_) {}
}

export interface RangeLockResult {
  lockedSerials: Set<string>;
  activeDeliveredSerials: Set<string>;
  startDate: string;
  endDate: string;
}

export interface ActiveSerialBookingInfo {
  order_code: string;
  order_status: string;
  start_date: string;
  expected_return_date: string;
  customer_name: string;
  booking_kind: 'DELIVERED' | 'RESERVED';
}

export function extractSerialsFromOrder(ord: {
  assigned_serials?: string | null;
  items_detail?: string | null;
}): string[] {
  const result = new Set<string>();
  if (ord.assigned_serials) {
    String(ord.assigned_serials)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => result.add(s));
  }
  if (result.size === 0 && ord.items_detail) {
    try {
      const parsed = JSON.parse(ord.items_detail);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (Array.isArray(entry?.assigned_serials)) {
            entry.assigned_serials
              .map((s: any) => String(s || '').trim())
              .filter(Boolean)
              .forEach((s: string) => result.add(s));
          }
        }
      }
    } catch (_) {}
  }
  return Array.from(result);
}

/**
 * Trả về bản đồ các Serial đang bận thực tế (DELIVERED/OVERDUE) hoặc đang bị giữ chỗ (CONFIRMED/PENDING/PENDING_PAYMENT)
 * giao thoa với khung ngày mặc định của Storefront [hôm nay, hôm nay + 3 ngày].
 */
export function getActiveSerialBookingsMap(
  startDateInput?: string,
  endDateInput?: string
): Map<string, ActiveSerialBookingInfo> {
  releaseExpiredPendingHolds();

  const reqStart = normalizeDateStr(startDateInput) || getTodayLocalStr();
  const rawEnd = normalizeDateStr(endDateInput);
  const reqEnd = rawEnd && rawEnd > reqStart ? rawEnd : addDaysToDateStr(reqStart, 3);

  const activeOrders = db
    .prepare(`
      SELECT o.order_code, o.start_date, o.expected_return_date, o.order_status,
             o.assigned_serials, o.items_detail, o.guest_name, u.full_name as user_full_name
      FROM rental_orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE (
        o.order_status IN ('PENDING', 'CONFIRMED', 'DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL')
        OR (
          o.order_status = 'PENDING_PAYMENT'
          AND o.payment_deadline IS NOT NULL
          AND datetime(o.payment_deadline) >= datetime('now')
        )
      )
      ORDER BY o.id DESC
    `)
    .all() as Array<{
      order_code: string;
      start_date: string;
      expected_return_date: string;
      order_status: string;
      assigned_serials: string | null;
      items_detail: string | null;
      guest_name: string | null;
      user_full_name: string | null;
    }>;

  const map = new Map<string, ActiveSerialBookingInfo>();

  // Lớp 1: Ưu tiên đơn đang giao thực tế / quá hạn (DELIVERED / OVERDUE / OVERDUE_CRITICAL)
  for (const ord of activeOrders) {
    if (!['DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL'].includes(ord.order_status)) continue;
    const serials = extractSerialsFromOrder(ord);
    const customerName = ord.user_full_name || ord.guest_name || 'Khách';
    for (const sn of serials) {
      if (!map.has(sn)) {
        map.set(sn, {
          order_code: ord.order_code,
          order_status: ord.order_status,
          start_date: ord.start_date,
          expected_return_date: ord.expected_return_date,
          customer_name: customerName,
          booking_kind: 'DELIVERED',
        });
      }
    }
  }

  // Lớp 2: Đơn giữ lịch giao thoa với khoảng mặc định Storefront [today, today+3]
  for (const ord of activeOrders) {
    if (['DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL'].includes(ord.order_status)) continue;
    const ordStart = normalizeDateStr(ord.start_date);
    const ordEnd = normalizeDateStr(ord.expected_return_date);
    if (!ordStart || !ordEnd) continue;
    const overlaps = ordStart < reqEnd && ordEnd > reqStart;
    if (!overlaps) continue;

    const serials = extractSerialsFromOrder(ord);
    const customerName = ord.user_full_name || ord.guest_name || 'Khách';
    for (const sn of serials) {
      if (!map.has(sn)) {
        map.set(sn, {
          order_code: ord.order_code,
          order_status: ord.order_status,
          start_date: ord.start_date,
          expected_return_date: ord.expected_return_date,
          customer_name: customerName,
          booking_kind: 'RESERVED',
        });
      }
    }
  }

  return map;
}

export function getLockedSerialsForRange(
  startDateInput?: string,
  endDateInput?: string,
  excludeOrderCode?: string
): RangeLockResult {
  releaseExpiredPendingHolds();

  const reqStart = normalizeDateStr(startDateInput) || getTodayLocalStr();
  const rawEnd = normalizeDateStr(endDateInput);
  const reqEnd = rawEnd && rawEnd > reqStart ? rawEnd : addDaysToDateStr(reqStart, 3);

  const activeOrders = db.prepare(`
    SELECT order_code, start_date, expected_return_date, order_status, assigned_serials
    FROM rental_orders
    WHERE (
      order_status IN ('PENDING', 'CONFIRMED', 'DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL')
      OR (
        order_status = 'PENDING_PAYMENT'
        AND payment_deadline IS NOT NULL
        AND datetime(payment_deadline) >= datetime('now')
      )
    )
  `).all() as Array<{
    order_code: string;
    start_date: string;
    expected_return_date: string;
    order_status: string;
    assigned_serials: string | null;
  }>;

  const lockedSerials = new Set<string>();
  const activeDeliveredSerials = new Set<string>();

  for (const ord of activeOrders) {
    if (excludeOrderCode && ord.order_code === excludeOrderCode) continue;
    if (!ord.assigned_serials) continue;

    const serialList = ord.assigned_serials
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (ord.order_status === 'DELIVERED' || ord.order_status === 'OVERDUE' || ord.order_status === 'OVERDUE_CRITICAL') {
      serialList.forEach((s) => activeDeliveredSerials.add(s));
    }

    const ordStart = normalizeDateStr(ord.start_date);
    const ordEnd = normalizeDateStr(ord.expected_return_date);
    if (!ordStart) continue;

    const isOverdue = ord.order_status === 'OVERDUE' || ord.order_status === 'OVERDUE_CRITICAL';
    const overlaps = isOverdue
      ? ordStart < reqEnd
      : Boolean(ordEnd && ordStart < reqEnd && ordEnd > reqStart);

    if (overlaps) {
      serialList.forEach((s) => lockedSerials.add(s));
    }
  }

  return { lockedSerials, activeDeliveredSerials, startDate: reqStart, endDate: reqEnd };
}

export function parseModelId(rawId: string | number): number | null {
  if (typeof rawId === 'number') return Number.isFinite(rawId) ? rawId : null;
  const match = String(rawId).trim().match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

export function getModelLiveItemsAndCount(
  modelId: number,
  lockedSerials: Set<string>,
  activeDeliveredSerials: Set<string>
): { items: any[]; availableCount: number } {
  const rawItems = db.prepare('SELECT * FROM product_items WHERE model_id = ?').all(modelId) as any[];
  const items = rawItems.map((item) => {
    if (item.status === 'MAINTENANCE' || item.status === 'LOST') {
      return item;
    }
    const isLocked = lockedSerials.has(item.serial_number);
    const isOrphanRented =
      item.status === 'RENTED' && !activeDeliveredSerials.has(item.serial_number);
    return {
      ...item,
      status: isLocked || isOrphanRented ? 'RENTED' : 'AVAILABLE',
    };
  });
  const availableCount = items.filter((i) => i.status === 'AVAILABLE').length;
  return { items, availableCount };
}

export interface RequestedModelItem {
  model_id: string | number;
  model_name: string;
  quantity: number;
}

export interface AllocatedItemDetail {
  model_id: number;
  model_name: string;
  quantity: number;
  daily_rate: number;
  deposit_amount: number;
  assigned_serials: string[];
}

export function checkAndAllocateModelsForRange(
  itemsToValidate: RequestedModelItem[],
  startDateStr: string,
  endDateStr: string,
  rentalDays: number,
  discountRate: number,
  excludeOrderCode?: string,
  lockSerials = true
): {
  ok: true;
  allAssignedSerials: string[];
  validatedItemsDetail: AllocatedItemDetail[];
  serverTotalRent: number;
  serverTotalDeposit: number;
} | {
  ok: false;
  status: number;
  error: string;
} {
  const { lockedSerials, activeDeliveredSerials } = getLockedSerialsForRange(
    startDateStr,
    endDateStr,
    excludeOrderCode
  );

  const allAssignedSerials: string[] = [];
  const checkedSerialsInLoop: string[] = [];
  const validatedItemsDetail: AllocatedItemDetail[] = [];
  let serverTotalRent = 0;
  let serverTotalDeposit = 0;

  for (const it of itemsToValidate) {
    const numModelId = parseModelId(it.model_id);
    let model: any = null;
    if (numModelId) {
      model = db.prepare('SELECT id, model_name, category, base_rental_price_per_day, deposit_amount, is_active FROM product_models WHERE id = ?').get(numModelId);
    }
    if (!model && it.model_name) {
      model = db.prepare('SELECT id, model_name, category, base_rental_price_per_day, deposit_amount, is_active FROM product_models WHERE model_name LIKE ?').get(`%${it.model_name}%`);
    }

    if (!model) {
      return {
        ok: false,
        status: 400,
        error: `Mẫu thiết bị "${it.model_name}" không tồn tại trong kho dữ liệu hệ thống.`,
      };
    }

    if (!model.is_active) {
      return {
        ok: false,
        status: 400,
        error: `Thiết bị "${model.model_name}" hiện đang tạm ngừng kinh doanh dịch vụ cho thuê.`,
      };
    }

    const physicalItems = db.prepare(`
      SELECT id, serial_number, status, condition_percent
      FROM product_items
      WHERE model_id = ?
    `).all(model.id) as Array<{ id: number; serial_number: string; status: string; condition_percent: number }>;

    const poolItems = physicalItems.filter(
      (p) =>
        p.status === 'AVAILABLE' ||
        (p.status === 'RENTED' && activeDeliveredSerials.has(p.serial_number))
    );

    const freeUnits = poolItems.filter(
      (u) => !lockedSerials.has(u.serial_number) && !checkedSerialsInLoop.includes(u.serial_number)
    );

    if (freeUnits.length <= 0) {
      return {
        ok: false,
        status: 409,
        error: `Ràng buộc lịch kho: Toàn bộ "${model.model_name}" hiện đã được đặt hoặc giữ chỗ trong khoảng ngày ${startDateStr} — ${endDateStr}. Vui lòng chọn ngày hoặc thiết bị khác.`,
      };
    }

    if (it.quantity > freeUnits.length) {
      return {
        ok: false,
        status: 409,
        error: `Ràng buộc tồn kho: Bạn yêu cầu ${it.quantity} "${model.model_name}", nhưng khoảng ngày ${startDateStr} — ${endDateStr} chỉ còn ${freeUnits.length} máy khả dụng.`,
      };
    }

    const picked = freeUnits.slice(0, it.quantity).map((u) => u.serial_number);
    checkedSerialsInLoop.push(...picked);
    const assigned = lockSerials ? picked : [];
    if (lockSerials) {
      allAssignedSerials.push(...assigned);
    }

    const dailyRate = Number(model.base_rental_price_per_day) || 0;
    const baseDeposit = Number(model.deposit_amount) || 0;
    const discountedDepositPerUnit = Math.round(baseDeposit * (1 - discountRate));

    serverTotalRent += dailyRate * rentalDays * it.quantity;
    serverTotalDeposit += discountedDepositPerUnit * it.quantity;

    validatedItemsDetail.push({
      model_id: model.id,
      model_name: model.model_name,
      quantity: it.quantity,
      daily_rate: dailyRate,
      deposit_amount: discountedDepositPerUnit,
      assigned_serials: assigned,
    });
  }

  return {
    ok: true,
    allAssignedSerials,
    validatedItemsDetail,
    serverTotalRent,
    serverTotalDeposit,
  };
}
