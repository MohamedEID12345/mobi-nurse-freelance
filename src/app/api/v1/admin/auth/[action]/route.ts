import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ApiError, errorResponse, handler, must, ok, parseBody } from '@/lib/http';
import {
  AdminRow, assertNotRateLimited, clearSessionCookies, consumeRefreshToken, createSession, hashPassword, publicAdmin,
  readRefreshToken, recordAuthFailure, requireAdmin, revokeAllSessions, revokeRefreshToken, setSessionCookies,
  validateAdminPassword, verifyPassword,
} from '@/lib/auth';
import { env } from '@/lib/env';
import { audit } from '@/lib/audit';
import { adminChangePasswordSchema, adminLoginSchema } from '@/lib/validators';
import { ROLE_PERMISSIONS, AdminRole } from '@/lib/shared/permissions';

async function respondWithSession(req: NextRequest, admin: AdminRow, familyId?: string) {
  const session = await createSession('ADMIN', admin.id, admin.role, familyId);
  const res = ok({ admin: { ...publicAdmin(admin), permissions: ROLE_PERMISSIONS[admin.role as AdminRole] ?? [] } });
  setSessionCookies(res, 'ADMIN', session);
  return res;
}

/** First login ever: create the SUPER_ADMIN from BOOTSTRAP_ADMIN_* env vars (must change password). */
async function bootstrapIfEmpty(email: string, password: string): Promise<AdminRow | null> {
  const { count } = await db().from('admin_users').select('id', { count: 'exact', head: true });
  if ((count ?? 0) > 0) return null;
  if (!env.bootstrapAdminEmail || !env.bootstrapAdminPassword) return null;
  if (email !== env.bootstrapAdminEmail || password !== env.bootstrapAdminPassword) return null;
  validateAdminPassword(password);
  const row = must(await db().from('admin_users').insert({
    email, full_name: 'المدير العام', password_hash: await hashPassword(password), role: 'SUPER_ADMIN', must_change_password: true,
  }).select('*').single()) as AdminRow;
  await audit(null, { actorType: 'SYSTEM', action: 'ADMIN_BOOTSTRAPPED', targetType: 'ADMIN', targetId: row.id, newValue: { email } });
  return row;
}

export const GET = handler(async (req, { action }) => {
  if (action !== 'me') throw new ApiError('NOT_FOUND');
  const admin = await requireAdmin(req, undefined, { allowPasswordChange: true });
  return ok({ ...publicAdmin(admin), permissions: ROLE_PERMISSIONS[admin.role as AdminRole] ?? [] });
});

export const POST = handler(async (req, { action }) => {
  switch (action) {
    case 'login': {
      const b = await parseBody(req, adminLoginSchema);
      const email = b.email.trim().toLowerCase();
      const key = `admin:${email}`;
      await assertNotRateLimited(req, key);
      let admin = must(await db().from('admin_users').select('*').eq('email', email).maybeSingle()) as AdminRow | null;
      if (!admin) admin = await bootstrapIfEmpty(email, b.password);
      if (!(await verifyPassword(b.password, admin?.password_hash)) || !admin || !admin.is_active) {
        await recordAuthFailure(req, key);
        throw new ApiError('ADMIN_INVALID_CREDENTIALS');
      }
      await db().from('admin_users').update({ last_login_at: new Date().toISOString() }).eq('id', admin.id);
      await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'ADMIN_LOGIN', targetType: 'ADMIN', targetId: admin.id });
      return respondWithSession(req, admin);
    }
    case 'refresh': {
      try {
        const raw = readRefreshToken(req, 'ADMIN');
        if (!raw) throw new ApiError('TOKEN_INVALID');
        const { subjectId, familyId } = await consumeRefreshToken(raw, 'ADMIN');
        const admin = must(await db().from('admin_users').select('*').eq('id', subjectId).maybeSingle()) as AdminRow | null;
        if (!admin || !admin.is_active) throw new ApiError('TOKEN_INVALID');
        return await respondWithSession(req, admin, familyId);
      } catch (e) {
        const res = errorResponse(e);
        clearSessionCookies(res, 'ADMIN');
        return res;
      }
    }
    case 'logout': {
      await revokeRefreshToken(readRefreshToken(req, 'ADMIN'));
      const res = ok();
      clearSessionCookies(res, 'ADMIN');
      return res;
    }
    case 'change-password': {
      const admin = await requireAdmin(req, undefined, { allowPasswordChange: true });
      const b = await parseBody(req, adminChangePasswordSchema);
      if (!(await verifyPassword(b.currentPassword, admin.password_hash))) throw new ApiError('CURRENT_PASSWORD_INCORRECT');
      if (b.currentPassword === b.newPassword) throw new ApiError('WEAK_ADMIN_PASSWORD');
      validateAdminPassword(b.newPassword);
      const updated = must(await db().from('admin_users').update({
        password_hash: await hashPassword(b.newPassword), must_change_password: false,
      }).eq('id', admin.id).select('*').single()) as AdminRow;
      await revokeAllSessions('ADMIN', admin.id);
      await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'ADMIN_PASSWORD_CHANGED', targetType: 'ADMIN', targetId: admin.id });
      return respondWithSession(req, updated);
    }
    default:
      throw new ApiError('NOT_FOUND');
  }
});
