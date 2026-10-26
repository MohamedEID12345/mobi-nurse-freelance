import { db } from '@/lib/db';
import { handler, must, ok, pageParams, searchTerm } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'CUSTOMERS_MANAGE');
  const { from, to } = pageParams(req);
  const q = searchTerm(req);
  let sel = db().from('app_users').select('id, full_name, phone, status, governorate_id, address, created_at, last_login_at', { count: 'exact' })
    .eq('role', 'CUSTOMER').order('created_at', { ascending: false }).range(from, to);
  if (q) sel = sel.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data, error, count } = await sel;
  const rows = must({ data, error }) as Array<Record<string, unknown>>;
  return ok({ total: count ?? 0, items: rows.map((u) => ({
    id: u.id, name: u.full_name, phone: u.phone, status: u.status, governorateId: u.governorate_id,
    address: u.address, createdAt: u.created_at, lastLoginAt: u.last_login_at,
  })) });
});
