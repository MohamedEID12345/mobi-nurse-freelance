import { db } from '@/lib/db';
import { ApiError, handler, ok, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { NURSE_ACTIVE } from '@/lib/bookings';
import { locationSchema } from '@/lib/validators';
import { inEgypt } from '@/lib/shared/geo';

/** Location heartbeat (rate-limited by the client). Only used while online or on an active job. */
export const POST = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const b = await parseBody(req, locationSchema);
  if (!inEgypt(b.latitude, b.longitude)) throw new ApiError('LOCATION_OUT_OF_RANGE');
  const now = new Date().toISOString();
  const { data: active } = await db().from('bookings').select('id').eq('nurse_id', user.id).in('status', NURSE_ACTIVE).limit(1);
  const { data: prof } = await db().from('nurse_profiles').select('is_online').eq('user_id', user.id).single();
  if (!prof?.is_online && !(active ?? []).length) return ok({ tracked: false });
  await db().from('nurse_profiles').update({ last_lat: b.latitude, last_lng: b.longitude, last_location_at: now }).eq('user_id', user.id);
  if ((active ?? []).length) {
    await db().from('bookings').update({ nurse_last_lat: b.latitude, nurse_last_lng: b.longitude, nurse_last_location_at: now })
      .eq('nurse_id', user.id).in('status', ['NURSE_ASSIGNED', 'NURSE_ON_THE_WAY']);
  }
  return ok({ tracked: true });
});
