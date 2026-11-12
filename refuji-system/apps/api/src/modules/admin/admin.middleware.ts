// Tính năng: Middleware xác thực & phân quyền Admin / Staff tách biệt dùng chung cho toàn phân hệ Dashboard
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db.js';

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'refuji_access_secret_key_change_in_prod_min_32_chars';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'refuji_refresh_secret_key_change_in_prod_min_32_chars';

export interface AdminActor {
  userId: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
}

export function extractAdminActor(req: Request): AdminActor | null {
  let candidateUserId: number | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: number };
      candidateUserId = decoded.userId;
    } catch (_) {}
  }

  if (!candidateUserId && req.cookies?.refuji_refresh_token) {
    try {
      const decoded = jwt.verify(req.cookies.refuji_refresh_token, JWT_REFRESH_SECRET) as { userId: number };
      candidateUserId = decoded.userId;
    } catch (_) {}
  }

  if (!candidateUserId) return null;

  const user = db
    .prepare('SELECT id, full_name, email, role, is_active FROM users WHERE id = ?')
    .get(candidateUserId) as { id: number; full_name: string; email: string; role: string; is_active: number } | undefined;

  if (!user || !user.is_active) return null;

  return {
    userId: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
  };
}

export function requireStaffOrAdmin(req: Request, res: Response, next: NextFunction) {
  const actor = extractAdminActor(req);
  if (!actor) {
    return res.status(401).json({
      error: 'Phiên làm việc hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập tài khoản Nhân viên / Quản trị viên.',
    });
  }
  if (actor.role !== 'ADMIN' && actor.role !== 'STAFF') {
    return res.status(403).json({
      error: 'Bạn không có quyền truy cập phân hệ Dashboard Quản trị / POS.',
    });
  }
  (req as any).actor = actor;
  return next();
}

export function requireAdminOnly(req: Request, res: Response, next: NextFunction) {
  const actor = (req as any).actor as AdminActor | undefined;
  if (!actor || actor.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Thao tác này chỉ dành cho Quản trị viên (ADMIN).',
    });
  }
  return next();
}

export function normalizeOrderCode(raw?: string | null): string {
  return String(raw || '').replace(/^#/, '').trim().toUpperCase();
}
