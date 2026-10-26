import { db } from '@/lib/db';
import { handler, must, ok, query } from '@/lib/http';
import { requireUser } from '@/lib/auth';

export const GET = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const scope = query(req, 'scope') ?? 'history';
  let q = db().from('bookings').select('id, code, status, service_name_ar, patient_name, nurse_amount, total_amount, scheduled_at, created_at, paid_at')
    .eq('nurse_id', user.id).order('created_at', { ascending: false }).limit(100);
  if (scope === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    q = q.gte('created_at', start.toISOString());
  }
  const rows = must(await q) as Array<Record<string, unknown>>;
  return ok(rows.map((b) => ({
    id: b.id, code: b.code, status: b.status, serviceName: b.service_name_ar, patientName: b.patient_name,
    nurseAmount: Number(b.nurse_amount), total: Number(b.total_amount), scheduledAt: b.scheduled_at,
    createdAt: b.created_at, paidAt: b.paid_at,
  })));
});
