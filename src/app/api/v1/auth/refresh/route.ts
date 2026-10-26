import { db } from '@/lib/db';
import { ApiError, errorResponse, handler, must } from '@/lib/http';
import { clearSessionCookies, consumeRefreshToken, readRefreshToken, UserRow } from '@/lib/auth';
import { sessionResponse } from '@/lib/accounts';

export const POST = handler(async (req) => {
  let bodyToken: string | null = null;
  try { bodyToken = ((await req.json()) as { refreshToken?: string })?.refreshToken ?? null; } catch { /* cookie only */ }
  const raw = readRefreshToken(req, 'USER', bodyToken);
  try {
    if (!raw) throw new ApiError('TOKEN_INVALID');
    const { subjectId, familyId } = await consumeRefreshToken(raw, 'USER');
    const user = must(await db().from('app_users').select('*').eq('id', subjectId).maybeSingle()) as UserRow | null;
    if (!user) throw new ApiError('TOKEN_INVALID');
    if (user.status !== 'ACTIVE') throw new ApiError('ACCOUNT_SUSPENDED');
    return await sessionResponse(req, user, 200, familyId);
  } catch (e) {
    const res = errorResponse(e);
    clearSessionCookies(res, 'USER');
    return res;
  }
});
