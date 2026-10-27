import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getNurseProfile } from '@/lib/nurse';
import { randomToken, sha256 } from '@/lib/codes';

/**
 * Issues a narrow-scope token for the Android app's background location service.
 * It can only update this nurse's location while online, and is revoked on going offline.
 */
export const POST = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const p = await getNurseProfile(user.id);
  if (!p.is_online) throw new ApiError('NURSE_NOT_AVAILABLE');
  const token = randomToken();
  must(await db().from('nurse_profiles').update({
    heartbeat_token_hash: sha256(token),
    heartbeat_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  }).eq('user_id', user.id));
  return ok({ token });
});
