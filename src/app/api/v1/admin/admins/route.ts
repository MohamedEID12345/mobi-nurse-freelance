import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { AdminRow, hashPassword, publicAdmin, requireAdmin, validateAdminPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { adminCreateSchema } from '@/lib/validators';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'ADMINS_MANAGE');
  const rows = must(await db().from('admin_users').select('*').order('created_at')) as AdminRow[];
  return ok(rows.map(publicAdmin));
});

export const POST = handler(async (req) => {
  const admin = await requireAdmin(req, 'ADMINS_MANAGE');
  const b = await parseBody(req, adminCreateSchema);
  validateAdminPassword(b.temporaryPassword);
  const email = b.email.trim().toLowerCase();
  const { data, error } = await db().from('admin_users').insert({
    email, full_name: b.fullName, role: b.role, password_hash: await hashPassword(b.temporaryPassword), must_change_password: true,
  }).select('*').single();
  if (error) throw new ApiError(error.code === '23505' ? 'ADMIN_EMAIL_EXISTS' : 'INTERNAL_ERROR', undefined, error.message);
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'ADMIN_CREATED', targetType: 'ADMIN', targetId: data.id, newValue: { email, role: b.role } });
  return ok(publicAdmin(data as AdminRow), 201);
});
