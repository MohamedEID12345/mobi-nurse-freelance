import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { publicUser, requireAdmin, UserRow } from '@/lib/auth';
import { getNurseProfile } from '@/lib/nurse';
import { signedObjectUrl } from '@/lib/storage';
import { audit } from '@/lib/audit';

export const GET = handler(async (req, { id }) => {
  const admin = await requireAdmin(req, 'NURSES_MANAGE');
  const user = must(await db().from('app_users').select('*').eq('id', id).eq('role', 'NURSE').maybeSingle()) as UserRow | null;
  if (!user) throw new ApiError('NOT_FOUND');
  const [profile, docs, services, wallet, withdrawals, reviews, complaints, bookings, payments, gov, city] = await Promise.all([
    getNurseProfile(id),
    db().from('nurse_documents').select('id, doc_type, storage_path, mime_type, size_bytes, is_current, created_at').eq('nurse_id', id).order('created_at', { ascending: false }),
    db().from('nurse_services').select('service_id, services(name_ar)').eq('nurse_id', id),
    db().from('wallets').select('*').eq('nurse_id', id).maybeSingle(),
    db().from('withdrawals').select('*').eq('nurse_id', id).order('created_at', { ascending: false }).limit(30),
    db().from('reviews').select('rating, comment, created_at, booking_id').eq('nurse_id', id).order('created_at', { ascending: false }).limit(30),
    db().from('complaints').select('id, code, category, status, description, created_at').eq('nurse_id', id).order('created_at', { ascending: false }).limit(30),
    db().from('bookings').select('id, code, status, service_name_ar, total_amount, nurse_amount, created_at').eq('nurse_id', id).order('created_at', { ascending: false }).limit(30),
    db().from('payments').select('merchant_order_id, purpose, amount, status, created_at, paid_at').eq('nurse_id', id).order('created_at', { ascending: false }).limit(10),
    db().from('governorates').select('name_ar').eq('id', user.governorate_id).maybeSingle(),
    db().from('cities').select('name_ar').eq('id', user.city_id).maybeSingle(),
  ]);
  const documents = await Promise.all((must(docs) as Array<Record<string, unknown>>).map(async (d) => ({
    id: d.id, type: d.doc_type, mimeType: d.mime_type, size: d.size_bytes, isCurrent: d.is_current, uploadedAt: d.created_at,
    url: await signedObjectUrl('nurse-documents', String(d.storage_path), 300),
  })));
  // Access to private identity documents is audited.
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'NURSE_DOCUMENTS_VIEWED', targetType: 'NURSE', targetId: id });
  return ok({
    user: { ...publicUser(user), governorateName: gov.data?.name_ar, cityName: city.data?.name_ar },
    profile, documents,
    services: (must(services) as Array<{ service_id: string; services: { name_ar: string } | { name_ar: string }[] | null }>)
      .map((s) => ({ id: s.service_id, name: Array.isArray(s.services) ? s.services[0]?.name_ar : s.services?.name_ar })),
    wallet: must(wallet), withdrawals: must(withdrawals), reviews: must(reviews), complaints: must(complaints),
    bookings: must(bookings), payments: must(payments),
  });
});
