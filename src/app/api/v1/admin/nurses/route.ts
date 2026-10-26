import { db } from '@/lib/db';
import { handler, must, ok, pageParams, query, searchTerm } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'NURSES_MANAGE');
  const { from, to } = pageParams(req);
  const status = query(req, 'status');
  const online = query(req, 'online');
  const gov = query(req, 'governorateId');
  const q = searchTerm(req);
  let sel = db().from('app_users')
    .select('id, full_name, phone, status, governorate_id, created_at, nurse_profiles!inner(verification_status, is_online, rating_avg, rating_count, completed_count, registration_fee_paid_at, documents_submitted_at)', { count: 'exact' })
    .eq('role', 'NURSE').order('created_at', { ascending: false }).range(from, to);
  if (status) sel = sel.eq('nurse_profiles.verification_status', status);
  if (online === 'true') sel = sel.eq('nurse_profiles.is_online', true);
  if (gov) sel = sel.eq('governorate_id', gov);
  if (q) sel = sel.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data, error, count } = await sel;
  const rows = must({ data, error }) as Array<Record<string, unknown>>;
  return ok({
    total: count ?? 0,
    items: rows.map((u) => {
      const np = (Array.isArray(u.nurse_profiles) ? u.nurse_profiles[0] : u.nurse_profiles) as Record<string, unknown>;
      return {
        id: u.id, name: u.full_name, phone: u.phone, accountStatus: u.status, governorateId: u.governorate_id,
        createdAt: u.created_at, verificationStatus: np?.verification_status, isOnline: np?.is_online,
        rating: Number(np?.rating_avg ?? 0), ratingCount: np?.rating_count, completed: np?.completed_count,
        feePaid: Boolean(np?.registration_fee_paid_at), documentsSubmitted: Boolean(np?.documents_submitted_at),
      };
    }),
  });
});
