import { db } from '@/lib/db';
import { ApiError, handler, parseBody } from '@/lib/http';
import { hashPassword, requireUser, revokeAllSessions, validateUserPassword, verifyPassword } from '@/lib/auth';
import { sessionResponse } from '@/lib/accounts';
import { changePasswordSchema } from '@/lib/validators';

export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const b = await parseBody(req, changePasswordSchema);
  if (!(await verifyPassword(b.currentPassword, user.password_hash))) throw new ApiError('CURRENT_PASSWORD_INCORRECT');
  validateUserPassword(b.newPassword);
  await db().from('app_users').update({ password_hash: await hashPassword(b.newPassword) }).eq('id', user.id);
  await revokeAllSessions('USER', user.id);
  return sessionResponse(req, user);
});
