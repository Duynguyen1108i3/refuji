// Tính năng: API Quản trị Hồ sơ Khách hàng, KYC, Điểm uy tín, Nâng hạng & Thống kê Khách vãng lai
import { Router, Request, Response } from 'express';
import { db } from '../../db.js';
import { recordAuditLog } from '../audit/audit.service.js';
import { syncAndEvaluateUserTier } from '../auth/auth.routes.js';
import { AdminActor, requireAdminOnly } from './admin.middleware.js';

export const adminCustomersRouter = Router();

// GET /api/admin/customers — Danh sách Thành viên kèm KYC mask, vai trò RBAC & tổng chi tiêu thực tế từ rental_orders
adminCustomersRouter.get('/customers', (req: Request, res: Response) => {
  try {
    const tier = typeof req.query.tier === 'string' ? req.query.tier.toUpperCase() : 'ALL';
    const roleFilter = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : 'ALL';
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

    let sql = `
      SELECT u.id, u.full_name, u.email, u.phone, u.role, u.membership_tier,
             u.reputation_score, u.total_completed_rentals, u.is_active, u.created_at,
             k.id_card_last4, k.privacy_consent_at as kyc_consent_at,
             COUNT(o.id) as total_orders,
             COALESCE(SUM(CASE WHEN o.order_status != 'CANCELLED' THEN o.total_rent ELSE 0 END), 0) as total_spend
      FROM users u
      LEFT JOIN user_kyc k ON k.user_id = u.id
      LEFT JOIN rental_orders o ON o.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (tier !== 'ALL') {
      sql += ' AND u.membership_tier = ?';
      params.push(tier);
    }
    if (roleFilter === 'OPS') {
      sql += " AND u.role IN ('STAFF', 'ADMIN')";
    } else if (roleFilter !== 'ALL' && ['CUSTOMER', 'STAFF', 'ADMIN'].includes(roleFilter)) {
      sql += ' AND u.role = ?';
      params.push(roleFilter);
    }
    if (search) {
      sql += ' AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.phone) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' GROUP BY u.id ORDER BY CASE u.role WHEN \'ADMIN\' THEN 0 WHEN \'STAFF\' THEN 1 ELSE 2 END, u.id DESC';

    const members = db.prepare(sql).all(...params) as any[];
    return res.json(
      members.map((m) => ({
        ...m,
        is_active: Boolean(m.is_active),
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tải danh sách khách hàng.' });
  }
});

// GET /api/admin/customers/guests/summary — Thống kê tệp Khách vãng lai từ bảng rental_orders
adminCustomersRouter.get('/customers/guests/summary', (_req: Request, res: Response) => {
  try {
    const guests = db
      .prepare(`
        SELECT guest_phone,
               MAX(guest_name) as guest_name,
               MAX(guest_email) as guest_email,
               COUNT(*) as total_orders,
               SUM(CASE WHEN order_status = 'GUEST_INQUIRY' THEN 1 ELSE 0 END) as pending_inquiries,
               SUM(CASE WHEN order_status != 'CANCELLED' THEN total_rent ELSE 0 END) as total_rent_value,
               MAX(created_at) as last_order_at
        FROM rental_orders
        WHERE is_guest = 1 AND guest_phone IS NOT NULL
        GROUP BY guest_phone
        ORDER BY last_order_at DESC
      `)
      .all();

    return res.json(guests);
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tải danh sách khách vãng lai.' });
  }
});

// GET /api/admin/customers/:id — Chi tiết hồ sơ + lịch sử đơn thuê
adminCustomersRouter.get('/customers/:id', (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const user = db
      .prepare(`
        SELECT u.id, u.full_name, u.email, u.phone, u.role, u.membership_tier,
               u.reputation_score, u.total_completed_rentals, u.is_active, u.created_at,
               k.id_card_last4, k.privacy_consent_at
        FROM users u
        LEFT JOIN user_kyc k ON k.user_id = u.id
        WHERE u.id = ?
      `)
      .get(userId) as any;

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
    }

    const orders = db
      .prepare('SELECT * FROM rental_orders WHERE user_id = ? ORDER BY id DESC')
      .all(userId);

    return res.json({
      customer: { ...user, is_active: Boolean(user.is_active) },
      orders,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể tải chi tiết khách hàng.' });
  }
});

// PATCH /api/admin/customers/:id/status — Khóa / Mở khóa tài khoản vi phạm (ADMIN)
adminCustomersRouter.patch('/customers/:id/status', requireAdminOnly, (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const targetId = Number(req.params.id);
    const target = db.prepare('SELECT id, full_name, role, is_active FROM users WHERE id = ?').get(targetId) as any;

    if (!target) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    }
    if (target.id === actor.userId) {
      return res.status(400).json({ error: 'Không thể tự khóa tài khoản Quản trị đang đăng nhập.' });
    }

    const nextActive = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : target.is_active ? 0 : 1;
    const reason = String(req.body.reason || '').trim();
    const nowIso = new Date().toISOString();

    db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?').run(nextActive, nowIso, targetId);

    recordAuditLog({
      userId: actor.userId,
      actorType: 'USER',
      actorLabel: actor.fullName,
      action: nextActive ? 'CUSTOMER_UNLOCKED' : 'CUSTOMER_LOCKED',
      entityType: 'User',
      entityId: targetId,
      oldValue: { is_active: Boolean(target.is_active) },
      newValue: { is_active: Boolean(nextActive), reason },
      description: `${nextActive ? 'Mở khóa' : 'Khóa'} tài khoản "${target.full_name}"${reason ? ` (${reason})` : ''}.`,
    });

    return res.json({
      success: true,
      is_active: Boolean(nextActive),
      message: `${nextActive ? 'Đã mở khóa' : 'Đã khóa'} tài khoản ${target.full_name}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể cập nhật trạng thái tài khoản.' });
  }
});

// PATCH /api/admin/customers/:id/tier — Nâng/hạ hạng thành viên (ADMIN)
adminCustomersRouter.patch('/customers/:id/tier', requireAdminOnly, (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const targetId = Number(req.params.id);
    const nextTier = String(req.body.membership_tier || '').toUpperCase();
    if (!['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(nextTier)) {
      return res.status(400).json({ error: 'Hạng thành viên không hợp lệ.' });
    }

    const target = db.prepare('SELECT id, full_name, membership_tier FROM users WHERE id = ?').get(targetId) as any;
    if (!target) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
    }

    db.prepare('UPDATE users SET membership_tier = ?, updated_at = ? WHERE id = ?').run(
      nextTier,
      new Date().toISOString(),
      targetId
    );

    recordAuditLog({
      userId: actor.userId,
      actorType: 'USER',
      actorLabel: actor.fullName,
      action: 'CUSTOMER_TIER_UPDATED',
      entityType: 'User',
      entityId: targetId,
      oldValue: { membership_tier: target.membership_tier },
      newValue: { membership_tier: nextTier },
      description: `Admin điều chỉnh hạng thành viên "${target.full_name}" từ ${target.membership_tier} sang ${nextTier}.`,
    });

    return res.json({ success: true, membership_tier: nextTier, message: `Đã cập nhật hạng thành viên sang ${nextTier}.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể cập nhật hạng thành viên.' });
  }
});

// PATCH /api/admin/customers/:id/role — Phân quyền truy cập RBAC (CUSTOMER / STAFF / ADMIN - Chỉ ADMIN)
adminCustomersRouter.patch('/customers/:id/role', requireAdminOnly, (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const targetId = Number(req.params.id);
    const nextRole = String(req.body.role || '').toUpperCase();
    if (!['CUSTOMER', 'STAFF', 'ADMIN'].includes(nextRole)) {
      return res.status(400).json({ error: 'Vai trò phân quyền phải là CUSTOMER, STAFF hoặc ADMIN.' });
    }

    const target = db
      .prepare('SELECT id, full_name, email, role, is_active FROM users WHERE id = ?')
      .get(targetId) as any;

    if (!target) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    }
    if (target.id === actor.userId) {
      return res.status(400).json({ error: 'Không thể tự thay đổi vai trò của tài khoản Quản trị đang đăng nhập.' });
    }
    if (target.role === nextRole) {
      return res.json({
        success: true,
        role: nextRole,
        message: `Tài khoản "${target.full_name}" hiện đã mang vai trò ${nextRole}.`,
      });
    }

    // Đảm bảo hệ thống luôn còn ít nhất 1 Quản trị viên (ADMIN) đang hoạt động
    if (target.role === 'ADMIN' && nextRole !== 'ADMIN') {
      const otherAdmins = db
        .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'ADMIN' AND is_active = 1 AND id != ?")
        .get(targetId) as { cnt: number };
      if (!otherAdmins || otherAdmins.cnt < 1) {
        return res.status(400).json({
          error: 'Hệ thống phải giữ lại tối thiểu 1 Quản trị viên (ADMIN) đang hoạt động.',
        });
      }
    }

    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(
      nextRole,
      new Date().toISOString(),
      targetId
    );

    const roleLabelMap: Record<string, string> = {
      CUSTOMER: 'Khách hàng (Chỉ Storefront)',
      STAFF: 'Nhân viên POS (Dashboard Vận hành)',
      ADMIN: 'Quản trị viên (Toàn quyền hệ thống)',
    };

    recordAuditLog({
      userId: actor.userId,
      actorType: 'USER',
      actorLabel: actor.fullName,
      action: 'CUSTOMER_ROLE_UPDATED',
      entityType: 'User',
      entityId: targetId,
      oldValue: { role: target.role },
      newValue: { role: nextRole },
      description: `Admin đổi vai trò "${target.full_name}" (${target.email}) từ ${target.role} sang ${nextRole} (${roleLabelMap[nextRole]}).`,
    });

    return res.json({
      success: true,
      role: nextRole,
      message: `Đã cập nhật vai trò "${target.full_name}" thành ${nextRole}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể cập nhật vai trò phân quyền tài khoản.' });
  }
});

// PATCH /api/admin/customers/:id/reputation — Điều chỉnh điểm uy tín (tự động khóa nếu < 20)
adminCustomersRouter.patch('/customers/:id/reputation', (req: Request, res: Response) => {
  try {
    const actor = (req as any).actor as AdminActor;
    const targetId = Number(req.params.id);
    const target = db.prepare('SELECT id, full_name, reputation_score, is_active FROM users WHERE id = ?').get(targetId) as any;
    if (!target) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
    }

    const rawScore = Number(req.body.reputation_score);
    if (isNaN(rawScore)) {
      return res.status(400).json({ error: 'Điểm uy tín phải là số nguyên từ 0 đến 100.' });
    }
    const nextScore = Math.min(100, Math.max(0, Math.round(rawScore)));
    const nextActive = nextScore < 20 ? 0 : target.is_active;
    const reason = String(req.body.reason || '').trim();
    const nowIso = new Date().toISOString();

    db.prepare('UPDATE users SET reputation_score = ?, is_active = ?, updated_at = ? WHERE id = ?').run(
      nextScore,
      nextActive,
      nowIso,
      targetId
    );
    syncAndEvaluateUserTier(targetId);

    recordAuditLog({
      userId: actor.userId,
      actorType: 'USER',
      actorLabel: actor.fullName,
      action: 'REPUTATION_ADJUSTED',
      entityType: 'User',
      entityId: targetId,
      oldValue: { reputation_score: target.reputation_score, is_active: Boolean(target.is_active) },
      newValue: { reputation_score: nextScore, is_active: Boolean(nextActive), reason },
      description: `Điều chỉnh điểm uy tín "${target.full_name}" thành ${nextScore}/100${reason ? ` (${reason})` : ''}.`,
    });

    return res.json({
      success: true,
      reputation_score: nextScore,
      is_active: Boolean(nextActive),
      message:
        nextScore < 20
          ? `Đã cập nhật điểm uy tín ${nextScore}/100 và tự động khóa tài khoản (< 20 điểm).`
          : `Đã cập nhật điểm uy tín thành ${nextScore}/100.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Không thể điều chỉnh điểm uy tín.' });
  }
});
