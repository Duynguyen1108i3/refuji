// Tính năng: API Thống kê Dashboard tổng quan, Nhật ký kiểm toán (Audit Logs) & Quét tác vụ tự động (Cron Sweep)
import { Router, Request, Response } from 'express';
import { db, reconcileActiveOrderItemStatuses } from '../../db.js';
import { queryAuditLogs } from '../audit/audit.service.js';
import {
  getActiveSerialBookingsMap,
  getTodayLocalStr,
  releaseExpiredPendingHolds,
} from '../orders/availability.helper.js';
import { runOperationalSweep } from './cron.service.js';
import { AdminActor } from './admin.middleware.js';

export const adminReportsRouter = Router();

// GET /api/admin/reports/dashboard
adminReportsRouter.get('/reports/dashboard', (_req: Request, res: Response) => {
  try {
    releaseExpiredPendingHolds();
    reconcileActiveOrderItemStatuses();
    const bookingsMap = getActiveSerialBookingsMap();

    const orders = db
      .prepare(`
        SELECT o.*, u.full_name as user_full_name, u.membership_tier as user_membership_tier
        FROM rental_orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.id DESC
      `)
      .all() as any[];

    const items = db
      .prepare(`
        SELECT pi.*, pm.model_name, pm.category, pm.base_rental_price_per_day
        FROM product_items pi
        JOIN product_models pm ON pi.model_id = pm.id
      `)
      .all() as any[];

    const txRows = db
      .prepare('SELECT * FROM payment_transactions ORDER BY id DESC')
      .all() as any[];

    const maintRows = db
      .prepare(`
        SELECT ml.*, pi.serial_number, pm.model_name
        FROM maintenance_logs ml
        JOIN product_items pi ON ml.item_id = pi.id
        JOIN product_models pm ON pi.model_id = pm.id
        ORDER BY ml.id DESC
      `)
      .all() as any[];

    const returnRows = db.prepare('SELECT * FROM return_records').all() as any[];

    // 1. Doanh thu & tài chính thực nhận
    const confirmedAndDone = orders.filter((o) =>
      ['CONFIRMED', 'DELIVERED', 'RETURNED', 'OVERDUE', 'OVERDUE_CRITICAL'].includes(o.order_status)
    );
    const baseRentalRevenue = confirmedAndDone.reduce((acc, o) => acc + (Number(o.total_rent) || 0), 0);
    const penaltyRevenue = returnRows.reduce(
      (acc, r) =>
        acc +
        (Number(r.total_late_fee) || 0) +
        (Number(r.total_damage_fee) || 0) +
        (Number(r.total_missing_acc_fee) || 0) +
        (Number(r.other_fee) || 0),
      0
    );
    const maintenanceCostTotal = maintRows.reduce((acc, m) => acc + (Number(m.cost) || 0), 0);
    const grossRevenue = baseRentalRevenue + penaltyRevenue;
    const netRevenue = grossRevenue - maintenanceCostTotal;

    const activeDepositHeld = orders
      .filter((o) => ['CONFIRMED', 'DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL'].includes(o.order_status))
      .reduce((acc, o) => acc + (Number(o.deposit_amount) || 0), 0);

    // 2. Tình trạng kho Serial (Occupancy — đồng bộ Storefront thực tế)
    const totalSerials = items.length;
    const rentedSerials = items.filter((i) => i.status === 'RENTED').length;
    const reservedSerials = items.filter(
      (i) => i.status === 'AVAILABLE' && bookingsMap.get(i.serial_number)?.booking_kind === 'RESERVED'
    ).length;
    const availableSerials = items.filter(
      (i) => i.status === 'AVAILABLE' && bookingsMap.get(i.serial_number)?.booking_kind !== 'RESERVED'
    ).length;
    const maintenanceSerials = items.filter((i) => i.status === 'MAINTENANCE').length;
    const lostSerials = items.filter((i) => i.status === 'LOST').length;
    const occupancyPercent =
      totalSerials > 0 ? Number((((rentedSerials + reservedSerials) / totalSerials) * 100).toFixed(1)) : 0;

    // 3. Hàng đợi & Cảnh báo nghiệp vụ
    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1;
    }

    const guestOrdersCount = orders.filter((o) => o.is_guest === 1).length;
    const memberOrdersCount = orders.filter((o) => o.is_guest !== 1).length;

    const todayStr = getTodayLocalStr();
    const pickupToday = orders.filter(
      (o) =>
        ['CONFIRMED', 'PENDING'].includes(o.order_status) &&
        String(o.start_date || '').slice(0, 10) <= todayStr
    );
    const returnToday = orders
      .filter((o) => ['DELIVERED', 'OVERDUE', 'OVERDUE_CRITICAL'].includes(o.order_status))
      .sort((a, b) =>
        String(a.expected_return_date || '').localeCompare(String(b.expected_return_date || ''))
      );

    const maintenanceDueItems = items
      .filter(
        (i) =>
          i.status === 'MAINTENANCE' ||
          Number(i.shutter_count) >= 10000 ||
          Number(i.condition_percent) < 92 ||
          (i.next_maintenance_date && String(i.next_maintenance_date).slice(0, 10) <= todayStr)
      )
      .slice(0, 8);

    // 4. Chuỗi biểu đồ 7 mốc ngày gần nhất có dữ liệu (Doanh thu & Số đơn)
    const dateMap: Record<string, { date: string; revenue: number; orders: number; guestOrders: number }> = {};
    for (const o of orders) {
      const d = String(o.created_at || o.start_date || todayStr).slice(0, 10);
      if (!dateMap[d]) {
        dateMap[d] = { date: d, revenue: 0, orders: 0, guestOrders: 0 };
      }
      if (o.order_status !== 'CANCELLED') {
        dateMap[d].orders += 1;
        if (o.is_guest === 1) dateMap[d].guestOrders += 1;
      }
      if (['CONFIRMED', 'DELIVERED', 'RETURNED', 'OVERDUE', 'OVERDUE_CRITICAL'].includes(o.order_status)) {
        dateMap[d].revenue += Number(o.total_rent) || 0;
      }
    }
    const trendSeries = Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    // 5. Phân bổ doanh thu theo danh mục (BODY / LENS / ACCESSORY)
    const modelCatMap: Record<string, string> = {};
    const allModels = db.prepare('SELECT id, model_name, category FROM product_models').all() as any[];
    for (const m of allModels) {
      modelCatMap[String(m.id)] = m.category;
      modelCatMap[m.model_name] = m.category;
    }

    const categoryStats: Record<string, { category: string; orders: number; revenue: number }> = {
      BODY: { category: 'BODY', orders: 0, revenue: 0 },
      LENS: { category: 'LENS', orders: 0, revenue: 0 },
      ACCESSORY: { category: 'ACCESSORY', orders: 0, revenue: 0 },
    };
    for (const o of confirmedAndDone) {
      const cat = modelCatMap[String(o.model_id)] || modelCatMap[o.model_name] || 'BODY';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { category: cat, orders: 0, revenue: 0 };
      }
      categoryStats[cat].orders += 1;
      categoryStats[cat].revenue += Number(o.total_rent) || 0;
    }

    // 6. Top thiết bị được thuê nhiều nhất theo thực tế ProductItems & Orders (tính đúng cả giữ lịch hôm nay)
    const itemsByModelId = new Map<number, any[]>();
    for (const item of items) {
      const list = itemsByModelId.get(item.model_id);
      if (list) list.push(item);
      else itemsByModelId.set(item.model_id, [item]);
    }

    const rawTopModels = db
      .prepare(`
        SELECT pm.id, pm.model_name, pm.category, pm.image_url, pm.base_rental_price_per_day,
               COUNT(pi.id) as unit_count,
               SUM(pi.total_rental_count) as rental_count
        FROM product_models pm
        LEFT JOIN product_items pi ON pm.id = pi.model_id
        WHERE pm.is_active = 1
        GROUP BY pm.id
        ORDER BY rental_count DESC, pm.id ASC
        LIMIT 5
      `)
      .all() as any[];

    const topModels = rawTopModels.map((m) => {
      const mItems = itemsByModelId.get(m.id) || [];
      const availableCount = mItems.filter(
        (it) => it.status === 'AVAILABLE' && bookingsMap.get(it.serial_number)?.booking_kind !== 'RESERVED'
      ).length;
      return {
        ...m,
        available_count: availableCount,
      };
    });

    return res.json({
      kpis: {
        grossRevenue,
        netRevenue,
        baseRentalRevenue,
        penaltyRevenue,
        maintenanceCostTotal,
        activeDepositHeld,
        totalOrders: orders.length,
        guestOrdersCount,
        memberOrdersCount,
        totalSerials,
        availableSerials,
        reservedSerials,
        rentedSerials,
        maintenanceSerials,
        lostSerials,
        occupancyPercent,
        statusCounts,
        openMaintenanceCount: maintRows.filter((m) => !m.completed_at).length,
      },
      trendSeries,
      categoryBreakdown: Object.values(categoryStats),
      topModels,
      pickupToday: pickupToday.slice(0, 6),
      returnToday: returnToday.slice(0, 6),
      maintenanceDueItems,
      recentTransactions: txRows.slice(0, 6),
      recentAuditLogs: queryAuditLogs({ limit: 6 }),
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('❌ [Dashboard Reports] Lỗi tải báo cáo tổng quan:', err);
    return res.status(500).json({ error: 'Không thể tải dữ liệu báo cáo Dashboard.' });
  }
});

// POST /api/admin/cron/run-sweep — Thực thi thủ công các tác vụ định kỳ
adminReportsRouter.post('/cron/run-sweep', (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor | undefined;
    const report = runOperationalSweep('USER', actor?.userId || null);
    return res.json({
      success: true,
      report,
      message: `Đã quét hệ thống: Giải phóng ${report.releasedExpiredHolds} giữ chỗ hết hạn, đánh dấu ${report.markedOverdue} đơn quá hạn, nâng cảnh báo ${report.escalatedCritical} đơn nghiêm trọng.`,
    });
  } catch (err: any) {
    console.error('❌ [Cron Sweep] Lỗi:', err);
    return res.status(500).json({ error: 'Không thể thực thi quét vận hành.' });
  }
});

// GET /api/admin/audit-logs — Nhật ký kiểm toán hệ thống
adminReportsRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const logs = queryAuditLogs({
      actorType: typeof req.query.actor_type === 'string' ? req.query.actor_type : undefined,
      entityType: typeof req.query.entity_type === 'string' ? req.query.entity_type : undefined,
      action: typeof req.query.action === 'string' ? req.query.action : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 120,
    });
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tải nhật ký kiểm toán.' });
  }
});
