import { db } from '@/lib/db';
import { ApiError, handler, must, parseBody } from '@/lib/http';
import { assertNotRateLimited, recordAuthFailure, UserRow, verifyPassword } from '@/lib/auth';
import { sessionResponse } from '@/lib/accounts';
import { loginSchema } from '@/lib/validators';
import { normalizeEgyptianMobile } from '@/lib/shared/phone';

export const POST = handler(async (req) => {
  const b = await parseBody(req, loginSchema);
  const phone = normalizeEgyptianMobile(b.phone);
  if (!phone) throw new ApiError('INVALID_CREDENTIALS');
  const key = `user:${phone}`;
  await assertNotRateLimited(req, key);

  const user = must(await db().from('app_users').select('*').eq('phone', phone).maybeSingle()) as UserRow | null;
  if (!(await verifyPassword(b.password, user?.password_hash)) || !user) {
    await recordAuthFailure(req, key);
    throw new ApiError('INVALID_CREDENTIALS');
  }
  if (user.status !== 'ACTIVE') throw new ApiError('ACCOUNT_SUSPENDED');
  await db().from('app_users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);
  return sessionResponse(req, user);
});
