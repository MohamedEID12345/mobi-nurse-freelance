import { db } from '@/lib/db';
import { ApiError, handler, parseBody } from '@/lib/http';
import { hashPassword, UserRow, validateUserPassword } from '@/lib/auth';
import { assertLocation, sessionResponse } from '@/lib/accounts';
import { audit } from '@/lib/audit';
import { registerCustomerSchema } from '@/lib/validators';
import { normalizeEgyptianMobile } from '@/lib/shared/phone';
import { inEgypt } from '@/lib/shared/geo';

export const POST = handler(async (req) => {
  const b = await parseBody(req, registerCustomerSchema);
  const phone = normalizeEgyptianMobile(b.phone);
  if (!phone) throw new ApiError('INVALID_PHONE');
  validateUserPassword(b.password);
  if (!inEgypt(b.latitude, b.longitude)) throw new ApiError('LOCATION_OUT_OF_RANGE');
  await assertLocation(b.governorateId, b.cityId, true);

  const { data, error } = await db().from('app_users').insert({
    phone, full_name: b.fullName, password_hash: await hashPassword(b.password), role: 'CUSTOMER',
    governorate_id: b.governorateId, city_id: b.cityId, address: b.address, latitude: b.latitude, longitude: b.longitude,
  }).select('*').single();
  if (error) throw new ApiError(error.code === '23505' ? 'PHONE_ALREADY_REGISTERED' : 'INTERNAL_ERROR', undefined, error.message);
  const user = data as UserRow;
  await audit(req, { actorType: 'USER', actorId: user.id, action: 'CUSTOMER_REGISTERED', targetType: 'USER', targetId: user.id });
  return sessionResponse(req, user, 201);
});
