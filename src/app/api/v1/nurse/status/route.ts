import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getNurseProfile } from '@/lib/nurse';
import { onlineSchema } from '@/lib/validators';
import { inEgypt } from '@/lib/shared/geo';

/** Go online / offline. Only approved nurses in an active governorate, with a current location, can go online. */
export const POST = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const b = await parseBody(req, onlineSchema);
  if (!b.online) {
    must(await db().from('nurse_profiles').update({ is_online: false, heartbeat_token_hash: null, heartbeat_expires_at: null }).eq('user_id', user.id));
    return ok({ isOnline: false });
  }
  const p = await getNurseProfile(user.id);
  if (p.verification_status !== 'APPROVED') throw new ApiError('NURSE_NOT_APPROVED');
  const gov = must(await db().from('governorates').select('is_active').eq('id', user.governorate_id).single()) as { is_active: boolean };
  if (!gov.is_active) throw new ApiError('GOVERNORATE_NOT_ACTIVE');
  if (b.latitude === undefined || b.longitude === undefined) throw new ApiError('LOCATION_REQUIRED');
  if (!inEgypt(b.latitude, b.longitude)) throw new ApiError('LOCATION_OUT_OF_RANGE');
  must(await db().from('nurse_profiles').update({
    is_online: true, last_lat: b.latitude, last_lng: b.longitude, last_location_at: new Date().toISOString(),
  }).eq('user_id', user.id));
  return ok({ isOnline: true });
});
