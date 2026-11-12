// Tính năng: Dịch vụ ghi vết kiểm toán (Audit Trail) tách riêng cho USER, SYSTEM_CRON và PAYMENT_WEBHOOK
import { db } from '../../db.js';

export type AuditActorType = 'USER' | 'SYSTEM_CRON' | 'PAYMENT_WEBHOOK';

export interface RecordAuditParams {
  userId?: number | null;
  actorType?: AuditActorType;
  actorLabel?: string | null;
  action: string;
  entityType: string;
  entityId: string | number;
  oldValue?: unknown;
  newValue?: unknown;
  description?: string | null;
  ipAddress?: string | null;
}

export function recordAuditLog(params: RecordAuditParams): void {
  try {
    const now = new Date().toISOString();
    const oldValJson =
      params.oldValue === undefined || params.oldValue === null
        ? null
        : typeof params.oldValue === 'string'
        ? params.oldValue
        : JSON.stringify(params.oldValue);
    const newValJson =
      params.newValue === undefined || params.newValue === null
        ? null
        : typeof params.newValue === 'string'
        ? params.newValue
        : JSON.stringify(params.newValue);

    db.prepare(`
      INSERT INTO audit_logs (
        user_id, actor_type, actor_label, action, entity_type, entity_id,
        old_value, new_value, description, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      params.userId ?? null,
      params.actorType || 'USER',
      params.actorLabel || (params.actorType === 'SYSTEM_CRON' ? 'SYSTEM_CRON' : params.actorType === 'PAYMENT_WEBHOOK' ? 'PAYMENT_WEBHOOK' : 'Nhân viên POS'),
      params.action,
      params.entityType,
      String(params.entityId),
      oldValJson,
      newValJson,
      params.description || null,
      params.ipAddress || null,
      now
    );
  } catch (err) {
    console.warn('⚠️ [AuditLog] Không thể ghi audit log:', err);
  }
}

export interface AuditLogQueryOptions {
  actorType?: string;
  entityType?: string;
  action?: string;
  search?: string;
  limit?: number;
}

export function queryAuditLogs(opts: AuditLogQueryOptions = {}) {
  let sql = `
    SELECT a.*,
           u.full_name as actor_user_name,
           u.email as actor_user_email,
           u.role as actor_user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (opts.actorType && opts.actorType !== 'ALL') {
    sql += ' AND a.actor_type = ?';
    params.push(opts.actorType.toUpperCase());
  }
  if (opts.entityType && opts.entityType !== 'ALL') {
    sql += ' AND a.entity_type = ?';
    params.push(opts.entityType);
  }
  if (opts.action && opts.action !== 'ALL') {
    sql += ' AND a.action LIKE ?';
    params.push(`%${opts.action.trim()}%`);
  }
  if (opts.search && opts.search.trim()) {
    const kw = `%${opts.search.trim()}%`;
    sql += ' AND (a.action LIKE ? OR a.entity_id LIKE ? OR a.description LIKE ? OR a.actor_label LIKE ?)';
    params.push(kw, kw, kw, kw);
  }

  const limit = Math.min(200, Math.max(10, Number(opts.limit) || 100));
  sql += ` ORDER BY a.id DESC LIMIT ${limit}`;

  return db.prepare(sql).all(...params);
}
