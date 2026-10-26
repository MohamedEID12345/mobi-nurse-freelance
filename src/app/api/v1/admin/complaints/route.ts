import { db } from '@/lib/db';
import { handler, must, ok, pageParams, query } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'COMPLAINTS_MANAGE');
  const { from, to } = pageParams(req);
  let sel = db().from('complaints').select('*, bookings(code), customer:app_users!complaints_customer_id_fkey(full_name, phone), nurse:app_users!complaints_nurse_id_fkey(id, full_name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(from, to);
  const status = query(req, 'status');
  if (status) sel = sel.eq('status', status);
  const { data, error, count } = await sel;
  const rows = must({ data, error }) as Array<Record<string, unknown>>;
  const one = <T,>(x: unknown) => (Array.isArray(x) ? x[0] : x) as T | null;
  return ok({ total: count ?? 0, items: rows.map((c) => ({
    id: c.id, code: c.code, category: c.category, description: c.description, status: c.status, adminNote: c.admin_note,
    bookingId: c.booking_id, bookingCode: one<{ code: string }>(c.bookings)?.code ?? null,
    customer: one<{ full_name: string; phone: string }>(c.customer),
    nurse: one<{ id: string; full_name: string; phone: string }>(c.nurse),
    createdAt: c.created_at, resolvedAt: c.resolved_at,
  })) });
});
