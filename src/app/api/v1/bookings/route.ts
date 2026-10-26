import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody, query } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { ACTIVE_STATUSES, createBooking, customerView } from '@/lib/bookings';
import { createBookingSchema } from '@/lib/validators';

export const GET = handler(async (req) => {
  const user = await requireUser(req, 'CUSTOMER');
  const scope = query(req, 'scope') ?? 'all';
  let q = db().from('bookings').select('id, code, status, service_name_ar, patient_name, total_amount, scheduled_at, created_at, payment_status, is_urgent')
    .eq('customer_id', user.id).order('created_at', { ascending: false }).limit(100);
  if (scope === 'active') q = q.in('status', ACTIVE_STATUSES);
  if (scope === 'history') q = q.not('status', 'in', `(${ACTIVE_STATUSES.join(',')})`);
  const rows = must(await q) as Array<Record<string, unknown>>;
  return ok(rows.map((b) => ({
    id: b.id, code: b.code, status: b.status, serviceName: b.service_name_ar, patientName: b.patient_name,
    total: Number(b.total_amount), scheduledAt: b.scheduled_at, createdAt: b.created_at, paymentStatus: b.payment_status, isUrgent: b.is_urgent,
  })));
});

export const POST = handler(async (req) => {
  const user = await requireUser(req, 'CUSTOMER');
  const b = await parseBody(req, createBookingSchema);
  let patientName = b.patientName?.trim() || user.full_name;
  if (b.familyMemberId) {
    const fm = must(await db().from('family_members').select('name').eq('id', b.familyMemberId).eq('customer_id', user.id)
      .is('deleted_at', null).maybeSingle()) as { name: string } | null;
    if (!fm) throw new ApiError('FAMILY_MEMBER_NOT_FOUND');
    patientName = fm.name;
  }
  const { booking, created } = await createBooking({
    customerId: user.id, guest: null, familyMemberId: b.familyMemberId ?? null, patientName,
    serviceId: b.serviceId, governorateId: b.governorateId, cityId: b.cityId, address: b.address,
    latitude: b.latitude, longitude: b.longitude, description: b.description, notes: b.notes,
    isUrgent: Boolean(b.isUrgent), scheduledAt: b.scheduledAt ?? null, idempotencyKey: b.idempotencyKey,
  });
  return ok(await customerView(booking), created ? 201 : 200);
});
