import { NextRequest } from 'next/server';
import { db } from './db';
import { ApiError, must, ok } from './http';
import { createSession, publicUser, setSessionCookies, UserRow } from './auth';

export async function assertLocation(governorateId: string, cityId: string, mustBeActive: boolean) {
  const gov = must(await db().from('governorates').select('id, is_active').eq('id', governorateId).maybeSingle()) as
    { id: string; is_active: boolean } | null;
  if (!gov) throw new ApiError('GOVERNORATE_NOT_FOUND');
  if (mustBeActive && !gov.is_active) throw new ApiError('GOVERNORATE_NOT_ACTIVE');
  const city = must(await db().from('cities').select('id').eq('id', cityId).eq('governorate_id', governorateId)
    .eq('is_active', true).maybeSingle());
  if (!city) throw new ApiError('CITY_NOT_IN_GOVERNORATE');
}

export async function nurseSummary(userId: string) {
  const p = must(await db().from('nurse_profiles').select('verification_status, is_online, rejection_reason, registration_fee_paid_at, documents_submitted_at, rating_avg, rating_count, completed_count')
    .eq('user_id', userId).maybeSingle()) as Record<string, unknown> | null;
  if (!p) return null;
  return {
    verificationStatus: p.verification_status, isOnline: p.is_online, rejectionReason: p.rejection_reason,
    feePaid: Boolean(p.registration_fee_paid_at), documentsSubmitted: Boolean(p.documents_submitted_at),
    rating: Number(p.rating_avg), ratingCount: Number(p.rating_count), completed: Number(p.completed_count),
  };
}

export async function meResponse(user: UserRow) {
  const [{ data: gov }, { data: city }] = await Promise.all([
    db().from('governorates').select('name_ar, is_active').eq('id', user.governorate_id).maybeSingle(),
    db().from('cities').select('name_ar').eq('id', user.city_id).maybeSingle(),
  ]);
  return {
    ...publicUser(user),
    governorateName: gov?.name_ar ?? null,
    governorateActive: Boolean(gov?.is_active),
    cityName: city?.name_ar ?? null,
    nurse: user.role === 'NURSE' ? await nurseSummary(user.id) : null,
  };
}

/** Creates a session, sets httpOnly cookies and returns the profile (tokens only for native clients). */
export async function sessionResponse(req: NextRequest, user: UserRow, status = 200, familyId?: string) {
  const session = await createSession('USER', user.id, user.role, familyId);
  const native = req.headers.get('x-mn-client') === 'native';
  const res = ok({ user: await meResponse(user), ...(native ? session : {}) }, status);
  setSessionCookies(res, 'USER', session);
  return res;
}
