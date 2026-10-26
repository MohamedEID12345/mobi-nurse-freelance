import { db } from '@/lib/db';
import { handler, must, ok, pageParams, query, searchTerm } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { rangeFrom } from '@/lib/range';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'BOOKINGS_VIEW');
  const { from, to } = pageParams(req);
  const status = query(req, 'status');
  const gov = query(req, 'governorateId');
  const q = searchTerm(req);
  const range = query(req, 'range');
  let sel = db().from('bookings')
    .select('id, code, status, service_name_ar, patient_name, guest_name, guest_phone, governorate_id, total_amount, commission_amount, payment_status, payment_method, is_urgent, created_at, customer:app_users!bookings_customer_id_fkey(full_name, phone), nurse:app_users!bookings_nurse_id_fkey(full_name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(from, to);
  if (status) sel = sel.eq('status', status);
  if (gov) sel = sel.eq('governorate_id', gov);
  if (q) sel = sel.or(`code.ilike.%${q}%,guest_phone.ilike.%${q}%,patient_name.ilike.%${q}%`);
  if (range) {
    const r = rangeFrom(range, query(req, 'from'), query(req, 'to'));
    sel = sel.gte('created_at', r.from.toISOString()).lt('created_at', r.to.toISOString());
  }
  const { data, error, count } = await sel;
  const rows = must({ data, error }) as Array<Record<string, unknown>>;
  const one = (x: unknown) => (Array.isArray(x) ? x[0] : x) as { full_name: string; phone: string } | null;
  return ok({ total: count ?? 0, items: rows.map((b) => ({
    id: b.id, code: b.code, status: b.status, serviceName: b.service_name_ar, patientName: b.patient_name,
    customer: one(b.customer)?.full_name ?? (b.guest_name ? `${b.guest_name} (عاجل بدون حساب)` : null),
    customerPhone: one(b.customer)?.phone ?? b.guest_phone, nurse: one(b.nurse)?.full_name ?? null,
    governorateId: b.governorate_id, total: Number(b.total_amount), commission: Number(b.commission_amount),
    paymentStatus: b.payment_status, paymentMethod: b.payment_method, isUrgent: b.is_urgent, createdAt: b.created_at,
  })) });
});
