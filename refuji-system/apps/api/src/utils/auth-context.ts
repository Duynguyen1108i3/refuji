import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'refuji_access_secret_key_change_in_prod_min_32_chars';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'refuji_refresh_secret_key_change_in_prod_min_32_chars';

export interface AuthenticatedActor {
  userId: number;
  email: string;
  role: string;
  membershipTier: string;
}

/**
 * Trích xuất người dùng đã xác thực từ Authorization Bearer token hoặc HttpOnly Cookie refuji_refresh_token
 */
export function extractAuthUser(req: Request): AuthenticatedActor | null {
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
    .prepare('SELECT id, email, role, membership_tier, is_active FROM users WHERE id = ?')
    .get(candidateUserId) as any;

  if (!user || !user.is_active) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    membershipTier: user.membership_tier || 'BRONZE',
  };
}
