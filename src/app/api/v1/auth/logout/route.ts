import { handler, ok } from '@/lib/http';
import { clearSessionCookies, readRefreshToken, revokeRefreshToken } from '@/lib/auth';

export const POST = handler(async (req) => {
  let bodyToken: string | null = null;
  try { bodyToken = ((await req.json()) as { refreshToken?: string })?.refreshToken ?? null; } catch { /* cookie */ }
  await revokeRefreshToken(readRefreshToken(req, 'USER', bodyToken));
  const res = ok();
  clearSessionCookies(res, 'USER');
  return res;
});
