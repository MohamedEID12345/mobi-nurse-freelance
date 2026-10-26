import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { currentDocuments, getNurseProfile, missingRequiredDocs } from '@/lib/nurse';
import { loadSettings, num } from '@/lib/settings';
import { nurseProfileSchema } from '@/lib/validators';
import { nursePhotoUrl } from '@/lib/bookings';

export const GET = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const [p, settings, docs, services, reviews] = await Promise.all([
    getNurseProfile(user.id),
    loadSettings(),
    currentDocuments(user.id, false),
    db().from('nurse_services').select('service_id, services(name_ar)').eq('nurse_id', user.id),
    db().from('reviews').select('rating, comment, created_at').eq('nurse_id', user.id).order('created_at', { ascending: false }).limit(20),
  ]);
  const fee = num(settings, 'NURSE_REGISTRATION_FEE');
  const svc = (must(services) as Array<{ service_id: string; services: { name_ar: string } | { name_ar: string }[] | null }>);
  return ok({
    verificationStatus: p.verification_status,
    rejectionReason: p.rejection_reason,
    registrationFee: fee,
    feePaid: Boolean(p.registration_fee_paid_at) || fee === 0,
    documentsSubmitted: Boolean(p.documents_submitted_at),
    documents: docs,
    missingDocuments: missingRequiredDocs(docs.map((d) => d.type)),
    photoUrl: await nursePhotoUrl(user.id),
    isOnline: p.is_online,
    qualification: p.qualification,
    yearsExperience: p.years_experience,
    bio: p.bio,
    rating: Number(p.rating_avg),
    ratingCount: p.rating_count,
    completed: p.completed_count,
    acceptanceRate: p.offers_received ? Math.round((p.offers_accepted / p.offers_received) * 100) : null,
    completionRate: p.offers_accepted ? Math.round((p.completed_count / p.offers_accepted) * 100) : null,
    services: svc.map((s) => ({ id: s.service_id, name: Array.isArray(s.services) ? s.services[0]?.name_ar : s.services?.name_ar })),
    reviews: (must(reviews) as Array<Record<string, unknown>>).map((r) => ({ rating: r.rating, comment: r.comment, createdAt: r.created_at })),
  });
});

export const PATCH = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const b = await parseBody(req, nurseProfileSchema);
  const patch: Record<string, unknown> = {};
  if (b.bio !== undefined) patch.bio = b.bio;
  if (b.yearsExperience !== undefined) patch.years_experience = b.yearsExperience;
  if (Object.keys(patch).length) must(await db().from('nurse_profiles').update(patch).eq('user_id', user.id));
  if (b.serviceIds) {
    const ids = [...new Set(b.serviceIds)];
    const valid = must(await db().from('services').select('id').in('id', ids).eq('is_active', true).is('deleted_at', null)) as Array<{ id: string }>;
    if (valid.length !== ids.length) throw new ApiError('SERVICE_NOT_FOUND');
    must(await db().from('nurse_services').delete().eq('nurse_id', user.id));
    must(await db().from('nurse_services').insert(ids.map((id) => ({ nurse_id: user.id, service_id: id }))));
  }
  return ok();
});
