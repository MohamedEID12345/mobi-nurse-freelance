import { db } from './db';
import { ApiError, must } from './http';
import { loadSettings, num } from './settings';
import { quote } from './pricing';
import { shortCode } from './codes';
import { directionsLink, etaMinutes, haversineKm, inEgypt, mapsLink } from './shared/geo';
import { signedObjectUrl } from './storage';
import { dispatch } from './matching';

export type BookingStatus =
  | 'CREATED' | 'SEARCHING' | 'NURSE_ASSIGNED' | 'NURSE_ON_THE_WAY' | 'NURSE_ARRIVED' | 'SERVICE_STARTED'
  | 'SERVICE_COMPLETED' | 'WAITING_FOR_PAYMENT' | 'PAID' | 'CANCELLED' | 'DISPUTED';

export const ACTIVE_STATUSES: BookingStatus[] = ['SEARCHING', 'NURSE_ASSIGNED', 'NURSE_ON_THE_WAY', 'NURSE_ARRIVED',
  'SERVICE_STARTED', 'SERVICE_COMPLETED', 'WAITING_FOR_PAYMENT'];
export const NURSE_ACTIVE: BookingStatus[] = ['NURSE_ASSIGNED', 'NURSE_ON_THE_WAY', 'NURSE_ARRIVED', 'SERVICE_STARTED'];
export const CUSTOMER_CANCELLABLE: BookingStatus[] = ['SEARCHING', 'NURSE_ASSIGNED', 'NURSE_ON_THE_WAY'];
const CONTACT_VISIBLE: BookingStatus[] = ['NURSE_ASSIGNED', 'NURSE_ON_THE_WAY', 'NURSE_ARRIVED', 'SERVICE_STARTED',
  'SERVICE_COMPLETED', 'WAITING_FOR_PAYMENT'];

export interface BookingRow {
  id: string; code: string; customer_id: string | null; guest_name: string | null; guest_phone: string | null;
  family_member_id: string | null; patient_name: string; service_id: string; service_name_ar: string;
  governorate_id: string; city_id: string | null; address: string; latitude: number; longitude: number;
  description: string; notes: string; is_urgent: boolean; scheduled_at: string | null; status: BookingStatus;
  nurse_id: string | null; service_price: string; travel_fee: string; total_amount: string; commission_pct: string;
  commission_amount: string; nurse_amount: string; payment_status: string; payment_method: string | null;
  search_started_at: string | null; last_dispatch_at: string | null; dispatch_round: number;
  assigned_at: string | null; on_the_way_at: string | null; arrived_at: string | null; arrival_distance_km: string | null;
  started_at: string | null; completed_at: string | null; paid_at: string | null; cancelled_at: string | null;
  cancelled_by: string | null; cancel_reason: string | null; nurse_last_lat: number | null; nurse_last_lng: number | null;
  nurse_last_location_at: string | null; created_at: string; updated_at: string;
}

export async function getBooking(id: string): Promise<BookingRow> {
  const b = must(await db().from('bookings').select('*').eq('id', id).maybeSingle()) as BookingRow | null;
  if (!b) throw new ApiError('BOOKING_NOT_FOUND');
  return b;
}

export async function transition(id: string, to: BookingStatus, from: BookingStatus[], actorType: string,
                                 actorId: string | null, reason?: string | null, lat?: number, lng?: number): Promise<BookingRow> {
  return must(await db().rpc('mn_transition_booking', {
    p_booking: id, p_to: to, p_allowed_from: from, p_actor_type: actorType, p_actor_id: actorId,
    p_reason: reason ?? null, p_lat: lat ?? null, p_lng: lng ?? null,
  })) as BookingRow;
}

export async function bookingHistory(id: string) {
  const rows = must(await db().from('booking_status_history').select('from_status, to_status, actor_type, reason, created_at')
    .eq('booking_id', id).order('created_at', { ascending: true })) as Array<Record<string, string>>;
  return (rows ?? []).map((r) => ({ from: r.from_status, to: r.to_status, actor: r.actor_type, reason: r.reason, at: r.created_at }));
}

export async function nursePhotoUrl(nurseId: string): Promise<string | null> {
  const { data } = await db().from('nurse_documents').select('storage_path').eq('nurse_id', nurseId)
    .eq('doc_type', 'PROFILE_PHOTO').eq('is_current', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data?.storage_path ? signedObjectUrl('nurse-documents', data.storage_path, 3600) : null;
}

async function nurseCard(nurseId: string, withPhone: boolean) {
  const u = must(await db().from('app_users').select('full_name, phone').eq('id', nurseId).single()) as { full_name: string; phone: string };
  const p = must(await db().from('nurse_profiles').select('rating_avg, rating_count, completed_count, years_experience, qualification')
    .eq('user_id', nurseId).single()) as Record<string, number | string>;
  return {
    id: nurseId, name: u.full_name, phone: withPhone ? u.phone : null,
    rating: Number(p.rating_avg), ratingCount: Number(p.rating_count), completed: Number(p.completed_count),
    yearsExperience: Number(p.years_experience), qualification: p.qualification,
    photoUrl: await nursePhotoUrl(nurseId),
  };
}

function amounts(b: BookingRow) {
  return { servicePrice: Number(b.service_price), travelFee: Number(b.travel_fee), total: Number(b.total_amount) };
}

/** What a customer (or guest) sees. */
export async function customerView(b: BookingRow) {
  const nurse = b.nurse_id ? await nurseCard(b.nurse_id, CONTACT_VISIBLE.includes(b.status)) : null;
  let nurseLocation = null;
  if (b.nurse_id && b.nurse_last_lat != null && b.nurse_last_lng != null && ['NURSE_ASSIGNED', 'NURSE_ON_THE_WAY'].includes(b.status)) {
    const km = haversineKm(b.nurse_last_lat, b.nurse_last_lng, b.latitude, b.longitude);
    nurseLocation = {
      at: b.nurse_last_location_at, distanceKm: Math.round(km * 10) / 10, etaMinutes: etaMinutes(km),
      mapsLink: mapsLink(b.nurse_last_lat, b.nurse_last_lng),
    };
  }
  const { data: review } = await db().from('reviews').select('rating').eq('booking_id', b.id).maybeSingle();
  return {
    id: b.id, code: b.code, status: b.status, serviceId: b.service_id, serviceName: b.service_name_ar,
    patientName: b.patient_name, address: b.address, latitude: b.latitude, longitude: b.longitude,
    mapsLink: mapsLink(b.latitude, b.longitude), description: b.description, notes: b.notes,
    isUrgent: b.is_urgent, scheduledAt: b.scheduled_at, createdAt: b.created_at,
    price: amounts(b), paymentStatus: b.payment_status, paymentMethod: b.payment_method,
    cancelReason: b.cancel_reason, cancelledBy: b.cancelled_by,
    nurse, nurseLocation,
    timeline: await bookingHistory(b.id),
    canCancel: CUSTOMER_CANCELLABLE.includes(b.status),
    canPay: b.status === 'WAITING_FOR_PAYMENT',
    canReview: b.status === 'PAID' && !review,
    review: review ? { rating: review.rating } : null,
  };
}

/** What the assigned (or offered) nurse sees. */
export async function nurseView(b: BookingRow, nurseId: string) {
  const assigned = b.nurse_id === nurseId;
  let customer: { name: string; phone: string | null } = { name: b.guest_name ?? '', phone: null };
  if (b.customer_id) {
    const u = must(await db().from('app_users').select('full_name, phone').eq('id', b.customer_id).single()) as { full_name: string; phone: string };
    customer = { name: u.full_name, phone: u.phone };
  } else {
    customer = { name: b.guest_name ?? '', phone: b.guest_phone };
  }
  const showContact = assigned && CONTACT_VISIBLE.includes(b.status);
  const { data: due } = assigned
    ? await db().from('customer_dues').select('id, amount, status').eq('booking_id', b.id).maybeSingle()
    : { data: null };
  return {
    id: b.id, code: b.code, status: b.status, serviceName: b.service_name_ar, patientName: b.patient_name,
    description: b.description, notes: b.notes, isUrgent: b.is_urgent, scheduledAt: b.scheduled_at,
    address: assigned ? b.address : null,
    mapsLink: assigned ? mapsLink(b.latitude, b.longitude) : null,
    directionsLink: assigned ? directionsLink(b.latitude, b.longitude) : null,
    customer: { name: customer.name, phone: showContact ? customer.phone : null },
    price: { ...amounts(b), commissionPct: Number(b.commission_pct), commission: Number(b.commission_amount), nurseAmount: Number(b.nurse_amount) },
    paymentStatus: b.payment_status, paymentMethod: b.payment_method,
    due: due ? { id: due.id, amount: Number(due.amount), status: due.status } : null,
    timeline: assigned ? await bookingHistory(b.id) : [],
    createdAt: b.created_at, arrivedAt: b.arrived_at, startedAt: b.started_at, completedAt: b.completed_at,
    cancelReason: b.cancel_reason,
  };
}

export interface CreateBookingInput {
  customerId: string | null;
  guest: { name: string; phone: string; tokenHash: string } | null;
  familyMemberId: string | null;
  patientName: string;
  serviceId: string;
  governorateId: string;
  cityId: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  notes: string;
  isUrgent: boolean;
  scheduledAt: string | null;
  idempotencyKey: string;
}

export async function priceFor(serviceId: string, governorateId: string) {
  const service = must(await db().from('services').select('id, name_ar, price, is_active, deleted_at')
    .eq('id', serviceId).maybeSingle()) as { id: string; name_ar: string; price: string; is_active: boolean; deleted_at: string | null } | null;
  if (!service || !service.is_active || service.deleted_at) throw new ApiError('SERVICE_NOT_FOUND');
  const gov = must(await db().from('governorates').select('id, is_active, bookings_enabled, travel_fee')
    .eq('id', governorateId).maybeSingle()) as { id: string; is_active: boolean; bookings_enabled: boolean; travel_fee: string } | null;
  if (!gov) throw new ApiError('GOVERNORATE_NOT_FOUND');
  if (!gov.is_active || !gov.bookings_enabled) throw new ApiError('GOVERNORATE_NOT_ACTIVE');
  const settings = await loadSettings();
  return { service, gov, settings, quote: quote(service.price, gov.travel_fee, num(settings, 'PLATFORM_COMMISSION_PERCENT')) };
}

async function findByIdempotency(input: CreateBookingInput): Promise<BookingRow | null> {
  let q = db().from('bookings').select('*').eq('idempotency_key', input.idempotencyKey);
  q = input.customerId ? q.eq('customer_id', input.customerId) : q.is('customer_id', null).eq('guest_phone', input.guest!.phone);
  return (must(await q.maybeSingle()) as BookingRow | null) ?? null;
}

export async function createBooking(input: CreateBookingInput): Promise<{ booking: BookingRow; created: boolean }> {
  const existing = await findByIdempotency(input);
  if (existing) return { booking: existing, created: false };

  if (!inEgypt(input.latitude, input.longitude)) throw new ApiError('LOCATION_OUT_OF_RANGE');
  const { service, quote: q } = await priceFor(input.serviceId, input.governorateId);
  const city = must(await db().from('cities').select('id').eq('id', input.cityId)
    .eq('governorate_id', input.governorateId).eq('is_active', true).maybeSingle());
  if (!city) throw new ApiError('CITY_NOT_IN_GOVERNORATE');

  if (input.scheduledAt) {
    const t = new Date(input.scheduledAt).getTime();
    if (!(t > Date.now() + 30 * 60_000 && t < Date.now() + 30 * 86_400_000)) throw new ApiError('SCHEDULE_INVALID');
  }

  const now = new Date().toISOString();
  let booking: BookingRow | null = null;
  for (let attempt = 0; attempt < 4 && !booking; attempt++) {
    const { data, error } = await db().from('bookings').insert({
      code: shortCode('MN'),
      customer_id: input.customerId,
      guest_name: input.guest?.name ?? null,
      guest_phone: input.guest?.phone ?? null,
      guest_token_hash: input.guest?.tokenHash ?? null,
      family_member_id: input.familyMemberId,
      patient_name: input.patientName,
      service_id: service.id,
      service_name_ar: service.name_ar,
      governorate_id: input.governorateId,
      city_id: input.cityId,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      description: input.description,
      notes: input.notes,
      is_urgent: input.isUrgent,
      scheduled_at: input.scheduledAt,
      status: 'SEARCHING',
      service_price: q.servicePrice,
      travel_fee: q.travelFee,
      total_amount: q.total,
      commission_pct: q.commissionPct,
      commission_amount: q.commission,
      nurse_amount: q.nurseAmount,
      idempotency_key: input.idempotencyKey,
      search_started_at: now,
    }).select('*').single();
    if (!error) {
      booking = data as BookingRow;
    } else if (error.code === '23505' && error.message.includes('idem')) {
      const again = await findByIdempotency(input);
      if (again) return { booking: again, created: false };
    } else if (!(error.code === '23505' && error.message.includes('code'))) {
      throw new ApiError('INTERNAL_ERROR', undefined, error.message);
    }
  }
  if (!booking) throw new ApiError('INTERNAL_ERROR', undefined, 'booking code generation');

  const actor = input.customerId ? 'CUSTOMER' : 'GUEST';
  await db().from('booking_status_history').insert([
    { booking_id: booking.id, from_status: null, to_status: 'CREATED', actor_type: actor, actor_id: input.customerId },
    { booking_id: booking.id, from_status: 'CREATED', to_status: 'SEARCHING', actor_type: 'SYSTEM' },
  ]);
  await dispatch(booking);
  return { booking, created: true };
}
