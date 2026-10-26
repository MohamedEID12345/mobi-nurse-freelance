import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { complaintSchema } from '@/lib/validators';
import { shortCode } from '@/lib/codes';

export const GET = handler(async (req) => {
  const user = await requireUser(req, 'CUSTOMER');
  const rows = must(await db().from('complaints').select('id, code, booking_id, category, description, status, admin_note, created_at, updated_at')
    .eq('customer_id', user.id).order('created_at', { ascending: false }).limit(50)) as Array<Record<string, unknown>>;
  return ok(rows.map((c) => ({
    id: c.id, code: c.code, bookingId: c.booking_id, category: c.category, description: c.description,
    status: c.status, adminNote: c.admin_note, createdAt: c.created_at, updatedAt: c.updated_at,
  })));
});

export const POST = handler(async (req) => {
  const user = await requireUser(req, 'CUSTOMER');
  const b = await parseBody(req, complaintSchema);
  let nurseId: string | null = null;
  if (b.bookingId) {
    const bk = must(await db().from('bookings').select('id, nurse_id').eq('id', b.bookingId).eq('customer_id', user.id).maybeSingle()) as
      { id: string; nurse_id: string | null } | null;
    if (!bk) throw new ApiError('BOOKING_NOT_FOUND');
    nurseId = bk.nurse_id;
  }
  const row = must(await db().from('complaints').insert({
    code: shortCode('C'), booking_id: b.bookingId ?? null, customer_id: user.id, nurse_id: nurseId,
    category: b.category, description: b.description,
  }).select('id, code').single()) as { id: string; code: string };
  return ok(row, 201);
});
