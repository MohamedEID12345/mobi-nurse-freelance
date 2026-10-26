import { db } from './db';
import { must } from './http';
import { notify } from './notify';
import { loadSettings, num, Settings } from './settings';
import type { BookingRow } from './bookings';
import { money } from './shared/labels';

/** Offers a SEARCHING booking to the next batch of eligible nearby nurses. Server-side only. */
export async function dispatch(b: BookingRow, s?: Settings): Promise<number> {
  const settings = s ?? (await loadSettings());
  const nurses = (must(await db().rpc('mn_find_nearby_nurses', {
    p_booking: b.id,
    p_radius_km: num(settings, 'MATCHING_RADIUS_KM'),
    p_limit: num(settings, 'MATCHING_BATCH_SIZE'),
    p_location_max_age_minutes: num(settings, 'NURSE_LOCATION_MAX_AGE_MINUTES'),
  })) ?? []) as Array<{ nurse_id: string; distance_km: number }>;

  const now = Date.now();
  await db().from('bookings').update({ last_dispatch_at: new Date(now).toISOString(), dispatch_round: b.dispatch_round + 1 })
    .eq('id', b.id).eq('status', 'SEARCHING');
  if (nurses.length === 0) return 0;

  // Scheduled requests give nurses longer to respond.
  const timeoutMs = b.scheduled_at ? 30 * 60_000 : num(settings, 'MATCHING_OFFER_TIMEOUT_SECONDS') * 1000;
  const expiresAt = new Date(now + timeoutMs).toISOString();
  await db().from('booking_offers').upsert(
    nurses.map((n) => ({ booking_id: b.id, nurse_id: n.nurse_id, distance_km: Math.round(n.distance_km * 100) / 100, expires_at: expiresAt })),
    { onConflict: 'booking_id,nurse_id', ignoreDuplicates: true },
  );
  await db().rpc('mn_increment_offers_received', { p_ids: nurses.map((n) => n.nurse_id) });

  await Promise.all(nurses.map((n) => notify([n.nurse_id], {
    title: b.is_urgent ? '🚨 طلب تمريض عاجل' : 'طلب جديد من MOBI-NURSE',
    body: `${b.service_name_ar} • على بعد ${n.distance_km.toFixed(1)} كم • ربحك ${money(b.nurse_amount)}`,
    link: '/app/nurse',
    channel: 'requests',
  })));
  return nurses.length;
}

/**
 * Serverless-friendly search loop: called whenever a customer, guest or online nurse polls.
 * Re-dispatches after the offer timeout and auto-cancels after the search window.
 */
export async function refreshSearch(b: BookingRow): Promise<BookingRow> {
  if (b.status !== 'SEARCHING') return b;
  const settings = await loadSettings();
  const now = Date.now();
  const started = new Date(b.search_started_at ?? b.created_at).getTime();
  const deadline = b.scheduled_at
    ? new Date(b.scheduled_at).getTime() - 15 * 60_000
    : started + num(settings, 'SEARCH_MAX_MINUTES') * 60_000;

  if (now > deadline) {
    const { data, error } = await db().rpc('mn_transition_booking', {
      p_booking: b.id, p_to: 'CANCELLED', p_allowed_from: ['SEARCHING'], p_actor_type: 'SYSTEM', p_actor_id: null,
      p_reason: 'لم يتوفر ممرض خلال مدة البحث', p_lat: null, p_lng: null,
    });
    if (!error && data) {
      await notify([b.customer_id], {
        title: 'لم نجد ممرضاً متاحاً', body: `نعتذر، لم يتوفر ممرض لطلبك ${b.code}. يمكنك إعادة الطلب في أي وقت.`,
        link: `/app/bookings/${b.id}`,
      });
      return data as BookingRow;
    }
    return b;
  }

  const timeoutMs = b.scheduled_at ? 30 * 60_000 : num(settings, 'MATCHING_OFFER_TIMEOUT_SECONDS') * 1000;
  if (!b.last_dispatch_at || now - new Date(b.last_dispatch_at).getTime() >= timeoutMs) {
    await db().from('booking_offers').update({ status: 'EXPIRED', responded_at: new Date().toISOString() })
      .eq('booking_id', b.id).eq('status', 'OFFERED').lt('expires_at', new Date().toISOString());
    await dispatch(b, settings);
  }
  return b;
}

/** Called from online nurses' polling so searches keep progressing even if the customer closed the app. */
export async function refreshStaleSearches(governorateId: string) {
  const settings = await loadSettings();
  const staleBefore = new Date(Date.now() - num(settings, 'MATCHING_OFFER_TIMEOUT_SECONDS') * 1000).toISOString();
  const { data } = await db().from('bookings').select('*').eq('status', 'SEARCHING').eq('governorate_id', governorateId)
    .or(`last_dispatch_at.is.null,last_dispatch_at.lt.${staleBefore}`).order('created_at').limit(5);
  for (const b of (data ?? []) as BookingRow[]) await refreshSearch(b);
}
