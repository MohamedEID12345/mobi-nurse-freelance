import { db } from '@/lib/db';
import { ApiError, handler, must, parseBody } from '@/lib/http';
import { hashPassword, UserRow, validateUserPassword } from '@/lib/auth';
import { assertLocation, sessionResponse } from '@/lib/accounts';
import { audit } from '@/lib/audit';
import { registerNurseSchema } from '@/lib/validators';
import { normalizeEgyptianMobile } from '@/lib/shared/phone';
import { inEgypt } from '@/lib/shared/geo';

const MIN_AGE = 21;

export const POST = handler(async (req) => {
  const b = await parseBody(req, registerNurseSchema);
  const phone = normalizeEgyptianMobile(b.phone);
  if (!phone) throw new ApiError('INVALID_PHONE');
  validateUserPassword(b.password);
  if (!inEgypt(b.latitude, b.longitude)) throw new ApiError('LOCATION_OUT_OF_RANGE');
  const dob = new Date(`${b.dateOfBirth}T00:00:00Z`);
  const minDob = new Date();
  minDob.setFullYear(minDob.getFullYear() - MIN_AGE);
  if (Number.isNaN(dob.getTime()) || dob > minDob) throw new ApiError('UNDERAGE');
  // Nurses may register in governorates that are not active yet (pre-launch recruitment).
  await assertLocation(b.governorateId, b.cityId, false);

  const serviceIds = [...new Set(b.serviceIds)];
  const services = must(await db().from('services').select('id').in('id', serviceIds).eq('is_active', true).is('deleted_at', null)) as Array<{ id: string }>;
  if ((services ?? []).length !== serviceIds.length) throw new ApiError('SERVICE_NOT_FOUND');

  const { data, error } = await db().from('app_users').insert({
    phone, full_name: b.fullName, password_hash: await hashPassword(b.password), role: 'NURSE',
    governorate_id: b.governorateId, city_id: b.cityId, address: b.address, latitude: b.latitude, longitude: b.longitude,
  }).select('*').single();
  if (error) throw new ApiError(error.code === '23505' ? 'PHONE_ALREADY_REGISTERED' : 'INTERNAL_ERROR', undefined, error.message);
  const user = data as UserRow;

  const profile = await db().from('nurse_profiles').insert({
    user_id: user.id, date_of_birth: b.dateOfBirth, qualification: b.qualification,
    years_experience: b.yearsExperience, bio: b.bio ?? '', last_lat: b.latitude, last_lng: b.longitude,
  });
  const links = profile.error ? profile : await db().from('nurse_services').insert(serviceIds.map((id) => ({ nurse_id: user.id, service_id: id })));
  if (profile.error || links.error) {
    // No multi-statement transaction over REST: compensate.
    await db().from('nurse_services').delete().eq('nurse_id', user.id);
    await db().from('nurse_profiles').delete().eq('user_id', user.id);
    await db().from('app_users').delete().eq('id', user.id);
    throw new ApiError('INTERNAL_ERROR', undefined, (profile.error ?? links.error)?.message);
  }
  await audit(req, { actorType: 'USER', actorId: user.id, action: 'NURSE_REGISTERED', targetType: 'USER', targetId: user.id });
  return sessionResponse(req, user, 201);
});
