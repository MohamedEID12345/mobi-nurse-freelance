import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { AdminRow, hashPassword, publicAdmin, requireAdmin, revokeAllSessions, validateAdminPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { adminUpdateSchema } from '@/lib/validators';

export const PATCH = handler(async (req, { id }) => {
  const admin = await requireAdmin(req, 'ADMINS_MANAGE');
  if (admin.id === id) throw new ApiError('CANNOT_MODIFY_SELF');
  const b = await parseBody(req, adminUpdateSchema);
  const target = must(await db().from('admin_users').select('*').eq('id', id).maybeSingle()) as AdminRow | null;
  if (!target) throw new ApiError('NOT_FOUND');
  const losesSuper = target.role === 'SUPER_ADMIN' && target.is_active &&
    ((b.role && b.role !== 'SUPER_ADMIN') || b.isActive === false);
  if (losesSuper) {
    const { count } = await db().from('admin_users').select('id', { count: 'exact', head: true }).eq('role', 'SUPER_ADMIN').eq('is_active', true);
    if ((count ?? 0) <= 1) throw new ApiError('LAST_SUPER_ADMIN');
  }
  const patch: Record<string, unknown> = {};
  if (b.role) patch.role = b.role;
  if (b.isActive !== undefined) patch.is_active = b.isActive;
  if (b.temporaryPassword) {
    validateAdminPassword(b.temporaryPassword);
    patch.password_hash = await hashPassword(b.temporaryPassword);
    patch.must_change_password = true;
  }
  const row = must(await db().from('admin_users').update(patch).eq('id', id).select('*').single()) as AdminRow;
  if (b.isActive === false || b.role || b.temporaryPassword) await revokeAllSessions('ADMIN', id);
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'ADMIN_UPDATED', targetType: 'ADMIN', targetId: id,
    oldValue: { role: target.role, active: target.is_active }, newValue: { role: b.role, active: b.isActive, passwordReset: Boolean(b.temporaryPassword) } });
  return ok(publicAdmin(row));
});
