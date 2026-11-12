// Tính năng: Tác vụ tự động (Cron Tasks Mục 12): Giải phóng giữ chỗ 15p quá hạn, Đánh dấu đơn trễ >2h & Quá hạn nghiêm trọng >7 ngày
import { db } from '../../db.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { buildExpectedDeadlineDate } from './settlement.helper.js';

export interface CronSweepReport {
  ranAt: string;
  releasedExpiredHolds: number;
  markedOverdue: number;
  escalatedCritical: number;
  maintenanceAlerts: number;
}

export function runOperationalSweep(actorType: 'SYSTEM_CRON' | 'USER' = 'SYSTEM_CRON', triggerUserId?: number | null): CronSweepReport {
  const now = new Date();
  const nowIso = now.toISOString();
  let releasedExpiredHolds = 0;
  let markedOverdue = 0;
  let escalatedCritical = 0;

  const sweepTx = db.transaction(() => {
    // 1. Giải phóng đơn PENDING_PAYMENT quá payment_deadline (15 phút)
    const expiredOrders = db
      .prepare(`
        SELECT id, order_code FROM rental_orders
        WHERE order_status = 'PENDING_PAYMENT'
          AND payment_deadline IS NOT NULL
          AND datetime(payment_deadline) < datetime('now')
      `)
      .all() as Array<{ id: number; order_code: string }>;

    if (expiredOrders.length > 0) {
      const cancelStmt = db.prepare(`
        UPDATE rental_orders
        SET order_status = 'CANCELLED',
            assigned_serials = NULL,
            cancellation_reason = 'Quá thời hạn thanh toán giữ chỗ 15 phút',
            cancelled_at = ?
        WHERE id = ?
      `);
      for (const ord of expiredOrders) {
        cancelStmt.run(nowIso, ord.id);
        releasedExpiredHolds++;
        recordAuditLog({
          userId: triggerUserId ?? null,
          actorType,
          action: 'CRON_EXPIRED_CANCEL',
          entityType: 'RentalOrder',
          entityId: ord.order_code,
          oldValue: { order_status: 'PENDING_PAYMENT' },
          newValue: { order_status: 'CANCELLED', assigned_serials: null },
          description: `Tự động giải phóng đơn giữ chỗ #${ord.order_code} do quá hạn 15 phút thanh toán.`,
        });
      }
    }

    // 2. Quét đơn DELIVERED quá 2 giờ ân hạn -> OVERDUE; quá 7 ngày -> OVERDUE_CRITICAL (-50 điểm & khóa user nếu <20)
    const activeRentals = db
      .prepare(`
        SELECT id, order_code, user_id, expected_return_date, order_status
        FROM rental_orders
        WHERE order_status IN ('DELIVERED', 'OVERDUE')
      `)
      .all() as Array<{
        id: number;
        order_code: string;
        user_id: number | null;
        expected_return_date: string;
        order_status: string;
      }>;

    for (const ord of activeRentals) {
      const expectedEnd = buildExpectedDeadlineDate(ord.expected_return_date);
      const diffHours = (now.getTime() - expectedEnd.getTime()) / 3600000;

      if (diffHours > 24 * 7 && ord.order_status !== 'OVERDUE_CRITICAL') {
        db.prepare(`UPDATE rental_orders SET order_status = 'OVERDUE_CRITICAL' WHERE id = ?`).run(ord.id);
        escalatedCritical++;

        if (ord.user_id) {
          const userRow = db
            .prepare('SELECT id, reputation_score, is_active FROM users WHERE id = ?')
            .get(ord.user_id) as { id: number; reputation_score: number; is_active: number } | undefined;
          if (userRow) {
            const nextScore = Math.max(0, (userRow.reputation_score ?? 100) - 50);
            const nextActive = nextScore < 20 ? 0 : userRow.is_active;
            db.prepare('UPDATE users SET reputation_score = ?, is_active = ?, updated_at = ? WHERE id = ?').run(
              nextScore,
              nextActive,
              nowIso,
              userRow.id
            );
          }
        }

        recordAuditLog({
          userId: triggerUserId ?? null,
          actorType,
          action: 'CRON_ESCALATE_OVERDUE_CRITICAL',
          entityType: 'RentalOrder',
          entityId: ord.order_code,
          oldValue: { order_status: ord.order_status },
          newValue: { order_status: 'OVERDUE_CRITICAL' },
          description: `Cảnh báo nghiêm trọng: Đơn #${ord.order_code} trễ trả > 7 ngày (${Math.floor(diffHours / 24)} ngày).`,
        });
      } else if (diffHours > 2 && ord.order_status === 'DELIVERED') {
        db.prepare(`UPDATE rental_orders SET order_status = 'OVERDUE' WHERE id = ?`).run(ord.id);
        markedOverdue++;
        recordAuditLog({
          userId: triggerUserId ?? null,
          actorType,
          action: 'CRON_MARK_OVERDUE',
          entityType: 'RentalOrder',
          entityId: ord.order_code,
          oldValue: { order_status: 'DELIVERED' },
          newValue: { order_status: 'OVERDUE' },
          description: `Đơn #${ord.order_code} vượt quá 2 giờ ân hạn (${diffHours.toFixed(1)}h trễ), tự động chuyển sang OVERDUE.`,
        });
      }
    }
  });

  sweepTx();

  const maintCountRow = db
    .prepare(`
      SELECT COUNT(*) as cnt FROM product_items
      WHERE status = 'MAINTENANCE'
         OR shutter_count >= 10000
         OR condition_percent < 90
         OR (next_maintenance_date IS NOT NULL AND date(next_maintenance_date) <= date('now', '+7 days'))
    `)
    .get() as { cnt: number };

  return {
    ranAt: nowIso,
    releasedExpiredHolds,
    markedOverdue,
    escalatedCritical,
    maintenanceAlerts: maintCountRow?.cnt || 0,
  };
}

let cronIntervalStarted = false;
export function startBackgroundCronScheduler() {
  if (cronIntervalStarted) return;
  cronIntervalStarted = true;
  // Chạy ngay khi khởi động và định kỳ mỗi 5 phút
  setTimeout(() => {
    try {
      runOperationalSweep('SYSTEM_CRON');
    } catch (_) {}
  }, 1500);
  setInterval(() => {
    try {
      runOperationalSweep('SYSTEM_CRON');
    } catch (_) {}
  }, 5 * 60 * 1000);
}
