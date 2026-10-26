import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { ACTIVE_STATUSES } from '@/lib/bookings';
import { mapsLink } from '@/lib/shared/geo';

/** Operations board (replaces an in-app live map): online nurses and active bookings with Google Maps links. */
export const GET = handler(async (req) => {
  await requireAdmin(req, 'OPERATIONS_VIEW');
  const [nurses, bookings] = await Promise.all([
    db().from('nurse_profiles').select('user_id, last_lat, last_lng, last_location_at, rating_avg, app_users(full_name, phone, governorate_id)')
      .eq('is_online', true).limit(300),
    db().from('bookings').select('id, code, status, service_name_ar, patient_name, latitude, longitude, nurse_id, customer_id, guest_name, search_started_at, created_at, nurse_last_lat, nurse_last_lng, nurse_last_location_at')
      .in('status', ACTIVE_STATUSES).order('created_at', { ascending: false }).limit(300),
  ]);
  const b = must(bookings) as Array<Record<string, unknown>>;
  return ok({
    onlineNurses: (must(nurses) as Array<Record<string, unknown>>).map((n) => {
      const u = n.app_users as { full_name: string; phone: string } | { full_name: string; phone: string }[] | null;
      const user = Array.isArray(u) ? u[0] : u;
      const job = b.find((x) => x.nurse_id === n.user_id);
      return {
        id: n.user_id, name: user?.full_name, phone: user?.phone, rating: Number(n.rating_avg),
        lastLocationAt: n.last_location_at,
        mapsLink: n.last_lat != null ? mapsLink(Number(n.last_lat), Number(n.last_lng)) : null,
        currentBooking: job ? { id: job.id, code: job.code, status: job.status } : null,
      };
    }),
    activeBookings: b.map((x) => ({
      id: x.id, code: x.code, status: x.status, serviceName: x.service_name_ar, patientName: x.patient_name,
      guest: Boolean(x.guest_name), searchStartedAt: x.search_started_at, createdAt: x.created_at,
      mapsLink: mapsLink(Number(x.latitude), Number(x.longitude)),
      nurseMapsLink: x.nurse_last_lat != null ? mapsLink(Number(x.nurse_last_lat), Number(x.nurse_last_lng)) : null,
    })),
  });
});
