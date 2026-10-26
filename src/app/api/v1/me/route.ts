import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireUser, UserRow } from '@/lib/auth';
import { assertLocation, meResponse } from '@/lib/accounts';
import { updateProfileSchema } from '@/lib/validators';
import { inEgypt } from '@/lib/shared/geo';

export const GET = handler(async (req) => ok(await meResponse(await requireUser(req))));

export const PATCH = handler(async (req) => {
  const user = await requireUser(req);
  const b = await parseBody(req, updateProfileSchema);
  const patch: Record<string, unknown> = {};
  if (b.fullName) patch.full_name = b.fullName;
  if (b.address) patch.address = b.address;
  if (b.latitude !== undefined && b.longitude !== undefined) {
    if (!inEgypt(b.latitude, b.longitude)) throw new ApiError('LOCATION_OUT_OF_RANGE');
    patch.latitude = b.latitude;
    patch.longitude = b.longitude;
  }
  if (b.governorateId || b.cityId) {
    const gov = b.governorateId ?? user.governorate_id;
    const city = b.cityId ?? user.city_id;
    await assertLocation(gov, city, user.role === 'CUSTOMER');
    patch.governorate_id = gov;
    patch.city_id = city;
  }
  const updated = must(await db().from('app_users').update(patch).eq('id', user.id).select('*').single()) as UserRow;
  return ok(await meResponse(updated));
});
