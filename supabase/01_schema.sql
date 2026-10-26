-- =====================================================================
-- MOBI-NURSE — Supabase schema (run ONCE in Supabase → SQL Editor)
-- Then run 02_seed.sql.
-- All tables have RLS enabled with NO policies: the public (publishable)
-- key cannot read or write anything. Only the server (secret key) can.
-- Money-critical operations run inside PostgreSQL functions (atomic).
-- =====================================================================
create extension if not exists pgcrypto;

create or replace function mn_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function mn_distance_km(lat1 double precision, lng1 double precision,
                                          lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 6371 * 2 * asin(least(1.0, sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2))))
$$;

-- ---------------------------------------------------------------- config
create table settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

create table content_pages (
  slug          text primary key,
  title_ar      text not null,
  title_en      text not null,
  body_ar       text not null default '',
  body_en       text not null default '',
  is_published  boolean not null default false,
  sort_order    int not null default 0,
  updated_at    timestamptz not null default now(),
  updated_by    uuid
);

-- ---------------------------------------------------------------- geography
create table governorates (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name_ar           text not null,
  name_en           text not null,
  is_active         boolean not null default false,
  bookings_enabled  boolean not null default true,
  travel_fee        numeric(10,2) not null default 0 check (travel_fee >= 0),
  sort_order        int not null default 0,
  activated_at      timestamptz,
  created_at        timestamptz not null default now()
);

create table cities (
  id              uuid primary key default gen_random_uuid(),
  governorate_id  uuid not null references governorates(id),
  name_ar         text not null,
  name_en         text not null,
  is_active       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  unique (governorate_id, name_ar)
);

-- ---------------------------------------------------------------- services
create table services (
  id                uuid primary key default gen_random_uuid(),
  name_ar           text not null,
  name_en           text not null default '',
  description_ar    text not null default '',
  description_en    text not null default '',
  price             numeric(10,2) not null check (price > 0),
  duration_minutes  int check (duration_minutes is null or duration_minutes > 0),
  image_url         text,
  image_path        text,
  is_active         boolean not null default true,
  sort_order        int not null default 0,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_services_touch before update on services for each row execute function mn_touch_updated_at();

-- ---------------------------------------------------------------- users
create table app_users (
  id                 uuid primary key default gen_random_uuid(),
  phone              text not null unique,
  full_name          text not null,
  password_hash      text not null,
  role               text not null check (role in ('CUSTOMER','NURSE')),
  status             text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED')),
  suspension_reason  text,
  governorate_id     uuid not null references governorates(id),
  city_id            uuid not null references cities(id),
  address            text not null,
  latitude           double precision,
  longitude          double precision,
  fcm_token          text,
  last_login_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on app_users(role, created_at desc);
create trigger trg_app_users_touch before update on app_users for each row execute function mn_touch_updated_at();

create table nurse_profiles (
  user_id                   uuid primary key references app_users(id),
  date_of_birth             date not null,
  qualification             text not null,
  years_experience          int not null check (years_experience between 0 and 60),
  bio                       text not null default '',
  photo_path                text,
  verification_status       text not null default 'REGISTERED' check (verification_status in
                              ('REGISTERED','FEE_PAID','DOCUMENTS_SUBMITTED','PENDING_VERIFICATION',
                               'APPROVED','REJECTED','RESUBMISSION_REQUESTED')),
  rejection_reason          text,
  registration_fee_paid_at  timestamptz,
  documents_submitted_at    timestamptz,
  approved_at               timestamptz,
  approved_by               uuid,
  is_online                 boolean not null default false,
  last_lat                  double precision,
  last_lng                  double precision,
  last_location_at          timestamptz,
  rating_avg                numeric(3,2) not null default 0,
  rating_count              int not null default 0,
  offers_received           int not null default 0,
  offers_accepted           int not null default 0,
  completed_count           int not null default 0,
  cancelled_count           int not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint nurse_online_requires_approval check (not is_online or verification_status = 'APPROVED')
);
create index on nurse_profiles(verification_status);
create index on nurse_profiles(is_online) where is_online;
create trigger trg_nurse_profiles_touch before update on nurse_profiles for each row execute function mn_touch_updated_at();

create table nurse_services (
  nurse_id    uuid not null references nurse_profiles(user_id) on delete cascade,
  service_id  uuid not null references services(id),
  primary key (nurse_id, service_id)
);

create table nurse_documents (
  id            uuid primary key default gen_random_uuid(),
  nurse_id      uuid not null references nurse_profiles(user_id),
  doc_type      text not null check (doc_type in ('PROFILE_PHOTO','NATIONAL_ID_FRONT','NATIONAL_ID_BACK',
                                                  'PRACTICE_LICENSE','QUALIFICATION','OTHER')),
  storage_path  text not null,
  mime_type     text not null,
  size_bytes    int not null,
  is_current    boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on nurse_documents(nurse_id, doc_type) where is_current;

create table family_members (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references app_users(id),
  name         text not null,
  relation     text not null,
  birth_date   date,
  gender       text check (gender in ('MALE','FEMALE')),
  notes        text not null default '',
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index on family_members(customer_id) where deleted_at is null;

-- ---------------------------------------------------------------- bookings
create table bookings (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique,
  customer_id             uuid references app_users(id),
  guest_name              text,
  guest_phone             text,
  guest_token_hash        text unique,
  family_member_id        uuid references family_members(id),
  patient_name            text not null,
  service_id              uuid not null references services(id),
  service_name_ar         text not null,
  governorate_id          uuid not null references governorates(id),
  city_id                 uuid references cities(id),
  address                 text not null,
  latitude                double precision not null,
  longitude               double precision not null,
  description             text not null default '',
  notes                   text not null default '',
  is_urgent               boolean not null default false,
  scheduled_at            timestamptz,
  status                  text not null check (status in ('CREATED','SEARCHING','NURSE_ASSIGNED','NURSE_ON_THE_WAY',
                            'NURSE_ARRIVED','SERVICE_STARTED','SERVICE_COMPLETED','WAITING_FOR_PAYMENT','PAID',
                            'CANCELLED','DISPUTED')),
  nurse_id                uuid references app_users(id),
  service_price           numeric(10,2) not null,
  travel_fee              numeric(10,2) not null default 0,
  total_amount            numeric(10,2) not null,
  commission_pct          numeric(5,2) not null,
  commission_amount       numeric(10,2) not null,
  nurse_amount            numeric(10,2) not null,
  payment_status          text not null default 'UNPAID' check (payment_status in ('UNPAID','PAID')),
  payment_method          text check (payment_method in ('ONLINE','NURSE_PAID_ON_BEHALF')),
  idempotency_key         text,
  search_started_at       timestamptz,
  last_dispatch_at        timestamptz,
  dispatch_round          int not null default 0,
  assigned_at             timestamptz,
  on_the_way_at           timestamptz,
  arrived_at              timestamptz,
  arrival_distance_km     numeric(8,2),
  started_at              timestamptz,
  completed_at            timestamptz,
  paid_at                 timestamptz,
  cancelled_at            timestamptz,
  cancelled_by            text,
  cancel_reason           text,
  nurse_last_lat          double precision,
  nurse_last_lng          double precision,
  nurse_last_location_at  timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint booking_owner check (customer_id is not null or (guest_phone is not null and guest_name is not null)),
  constraint booking_amounts check (total_amount = service_price + travel_fee
                                    and commission_amount + nurse_amount = total_amount
                                    and commission_amount >= 0 and nurse_amount >= 0)
);
create unique index bookings_idem_customer on bookings(customer_id, idempotency_key)
  where customer_id is not null and idempotency_key is not null;
create unique index bookings_idem_guest on bookings(guest_phone, idempotency_key)
  where customer_id is null and idempotency_key is not null;
create unique index bookings_one_in_progress_per_nurse on bookings(nurse_id)
  where status in ('NURSE_ON_THE_WAY','NURSE_ARRIVED','SERVICE_STARTED');
create index on bookings(status);
create index on bookings(nurse_id, status);
create index on bookings(customer_id, created_at desc);
create index on bookings(created_at desc);
create trigger trg_bookings_touch before update on bookings for each row execute function mn_touch_updated_at();

create table booking_status_history (
  id           bigserial primary key,
  booking_id   uuid not null references bookings(id),
  from_status  text,
  to_status    text not null,
  actor_type   text not null check (actor_type in ('CUSTOMER','GUEST','NURSE','ADMIN','SYSTEM')),
  actor_id     uuid,
  reason       text,
  created_at   timestamptz not null default now()
);
create index on booking_status_history(booking_id, created_at);

create table booking_offers (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id),
  nurse_id      uuid not null references app_users(id),
  distance_km   numeric(8,2) not null,
  status        text not null default 'OFFERED' check (status in ('OFFERED','ACCEPTED','REJECTED','EXPIRED','TAKEN','RELEASED')),
  expires_at    timestamptz not null,
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (booking_id, nurse_id)
);
create index on booking_offers(nurse_id, status);

-- ---------------------------------------------------------------- payments & ledger
create table payments (
  id                       uuid primary key default gen_random_uuid(),
  merchant_order_id        text not null unique,
  purpose                  text not null check (purpose in ('BOOKING','REGISTRATION_FEE')),
  booking_id               uuid references bookings(id),
  nurse_id                 uuid references app_users(id),
  payer_type               text not null check (payer_type in ('CUSTOMER','GUEST','NURSE')),
  payer_user_id            uuid,
  amount                   numeric(10,2) not null check (amount > 0),
  currency                 text not null default 'EGP',
  status                   text not null default 'PENDING' check (status in ('PENDING','SUCCESS','FAILED')),
  provider                 text not null default 'KASHIER',
  provider_transaction_id  text,
  provider_order_id        text,
  provider_method          text,
  issue                    text,
  created_at               timestamptz not null default now(),
  paid_at                  timestamptz,
  updated_at               timestamptz not null default now(),
  constraint payment_target check ((purpose = 'BOOKING' and booking_id is not null)
                                   or (purpose = 'REGISTRATION_FEE' and nurse_id is not null))
);
create unique index payments_provider_txn on payments(provider, provider_transaction_id) where provider_transaction_id is not null;
create index on payments(booking_id);
create index on payments(created_at desc);
create trigger trg_payments_touch before update on payments for each row execute function mn_touch_updated_at();

create table payment_events (
  id                 bigserial primary key,
  merchant_order_id  text,
  source             text not null check (source in ('WEBHOOK','REDIRECT')),
  signature_valid    boolean not null,
  result             text,
  payload            jsonb not null,
  created_at         timestamptz not null default now()
);

create table wallets (
  nurse_id          uuid primary key references app_users(id),
  balance           numeric(12,2) not null default 0 check (balance >= 0),
  total_earned      numeric(12,2) not null default 0,
  total_commission  numeric(12,2) not null default 0,
  total_withdrawn   numeric(12,2) not null default 0,
  updated_at        timestamptz not null default now()
);

create table withdrawals (
  id                 uuid primary key default gen_random_uuid(),
  nurse_id           uuid not null references app_users(id),
  amount             numeric(12,2) not null check (amount > 0),
  method             text not null check (method in ('VODAFONE_CASH','ORANGE_CASH','ETISALAT_CASH','WE_PAY','INSTAPAY','BANK_TRANSFER')),
  receiving_account  text not null,
  status             text not null default 'PENDING' check (status in ('PENDING','APPROVED','PROCESSING','PAID','REJECTED')),
  admin_note         text,
  reference          text,
  reviewed_by        uuid,
  reviewed_at        timestamptz,
  paid_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on withdrawals(status, created_at);
create trigger trg_withdrawals_touch before update on withdrawals for each row execute function mn_touch_updated_at();

create table wallet_transactions (
  id              bigserial primary key,
  nurse_id        uuid not null references app_users(id),
  type            text not null check (type in ('SERVICE_EARNING','COMMISSION','WITHDRAWAL','REFUND','ADJUSTMENT','NURSE_PAID_ON_BEHALF','OTHER')),
  direction       text not null check (direction in ('CREDIT','DEBIT','INFO')),
  amount          numeric(12,2) not null check (amount >= 0),
  balance_before  numeric(12,2) not null,
  balance_after   numeric(12,2) not null,
  booking_id      uuid references bookings(id),
  payment_id      uuid references payments(id),
  withdrawal_id   uuid references withdrawals(id),
  description     text not null,
  actor_type      text not null,
  actor_id        uuid,
  created_at      timestamptz not null default now()
);
create unique index wallet_tx_once_per_booking on wallet_transactions(booking_id, type)
  where type in ('SERVICE_EARNING','COMMISSION','NURSE_PAID_ON_BEHALF');
create index on wallet_transactions(nurse_id, created_at desc);

-- Platform revenue: service commission and registration fees are separate categories.
create table platform_revenue (
  id          bigserial primary key,
  category    text not null check (category in ('SERVICE_COMMISSION','REGISTRATION_FEE')),
  amount      numeric(12,2) not null check (amount >= 0),
  booking_id  uuid references bookings(id),
  payment_id  uuid not null references payments(id),
  nurse_id    uuid references app_users(id),
  created_at  timestamptz not null default now(),
  unique (payment_id, category)
);

-- Amount a customer owes a nurse who paid on their behalf.
create table customer_dues (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null unique references bookings(id),
  customer_id  uuid references app_users(id),
  guest_phone  text,
  nurse_id     uuid not null references app_users(id),
  amount       numeric(12,2) not null check (amount > 0),
  status       text not null default 'OPEN' check (status in ('OPEN','SETTLED')),
  settled_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- trust
create table reviews (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null unique references bookings(id),
  customer_id      uuid references app_users(id),
  nurse_id         uuid not null references app_users(id),
  rating           int not null check (rating between 1 and 5),
  punctuality      int check (punctuality between 1 and 5),
  professionalism  int check (professionalism between 1 and 5),
  communication    int check (communication between 1 and 5),
  quality          int check (quality between 1 and 5),
  comment          text not null default '',
  created_at       timestamptz not null default now()
);
create index on reviews(nurse_id, created_at desc);

create table complaints (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  booking_id   uuid references bookings(id),
  customer_id  uuid references app_users(id),
  guest_phone  text,
  nurse_id     uuid references app_users(id),
  category     text not null check (category in ('NURSE','PAYMENT','SERVICE','APP')),
  description  text not null,
  status       text not null default 'OPEN' check (status in ('OPEN','IN_REVIEW','RESOLVED','REJECTED','ESCALATED')),
  admin_note   text,
  handled_by   uuid,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on complaints(status, created_at desc);
create trigger trg_complaints_touch before update on complaints for each row execute function mn_touch_updated_at();

create table notifications (
  id          bigserial primary key,
  user_id     uuid not null references app_users(id),
  title       text not null,
  body        text not null,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on notifications(user_id, created_at desc);

-- ---------------------------------------------------------------- admin & security
create table admin_users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique,
  full_name             text not null,
  password_hash         text not null,
  role                  text not null check (role in ('SUPER_ADMIN','OPERATIONS_ADMIN','FINANCE_ADMIN','VERIFICATION_ADMIN','SUPPORT_ADMIN')),
  is_active             boolean not null default true,
  must_change_password  boolean not null default true,
  last_login_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_admin_users_touch before update on admin_users for each row execute function mn_touch_updated_at();

create table refresh_tokens (
  id            uuid primary key default gen_random_uuid(),
  subject_type  text not null check (subject_type in ('USER','ADMIN')),
  subject_id    uuid not null,
  token_hash    text not null unique,
  family_id     uuid not null,
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index on refresh_tokens(subject_type, subject_id);
create index on refresh_tokens(family_id);

create table auth_failures (
  id          bigserial primary key,
  key         text not null,
  created_at  timestamptz not null default now()
);
create index on auth_failures(key, created_at);

create table audit_logs (
  id           bigserial primary key,
  actor_type   text not null check (actor_type in ('ADMIN','USER','SYSTEM')),
  actor_id     uuid,
  action       text not null,
  target_type  text,
  target_id    text,
  old_value    jsonb,
  new_value    jsonb,
  ip           text,
  created_at   timestamptz not null default now()
);
create index on audit_logs(created_at desc);
create index on audit_logs(action);
create index on audit_logs(target_type, target_id);

create or replace function mn_audit_append_only() returns trigger language plpgsql as $$
begin raise exception 'audit_logs is append-only'; end $$;
create trigger trg_audit_append_only before update or delete on audit_logs
  for each row execute function mn_audit_append_only();

-- =====================================================================
-- Functions
-- =====================================================================

-- Refresh-token rotation with reuse detection (atomic).
create or replace function mn_consume_refresh_token(p_hash text, p_type text)
returns table(result text, subject_id uuid, family_id uuid) language plpgsql as $$
declare t refresh_tokens;
begin
  select * into t from refresh_tokens r where r.token_hash = p_hash for update;
  if not found or t.subject_type <> p_type then
    return query select 'INVALID'::text, null::uuid, null::uuid; return;
  end if;
  if t.revoked_at is not null then
    update refresh_tokens r set revoked_at = now() where r.family_id = t.family_id and r.revoked_at is null;
    return query select 'REUSED'::text, t.subject_id, t.family_id; return;
  end if;
  if t.expires_at <= now() then
    return query select 'EXPIRED'::text, t.subject_id, t.family_id; return;
  end if;
  update refresh_tokens r set revoked_at = now() where r.id = t.id;
  return query select 'OK'::text, t.subject_id, t.family_id;
end $$;

-- Generic booking status transition with history.
create or replace function mn_transition_booking(p_booking uuid, p_to text, p_allowed_from text[],
    p_actor_type text, p_actor_id uuid, p_reason text default null,
    p_lat double precision default null, p_lng double precision default null)
returns bookings language plpgsql as $$
declare b bookings; v_from text;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  v_from := b.status;
  if not (v_from = any(p_allowed_from)) then raise exception 'INVALID_STATUS_TRANSITION'; end if;

  update bookings set
    status              = p_to,
    on_the_way_at       = case when p_to = 'NURSE_ON_THE_WAY' then now() else on_the_way_at end,
    arrived_at          = case when p_to = 'NURSE_ARRIVED' then now() else arrived_at end,
    arrival_distance_km = case when p_to = 'NURSE_ARRIVED' and p_lat is not null
                               then round(mn_distance_km(p_lat, p_lng, latitude, longitude)::numeric, 2)
                               else arrival_distance_km end,
    started_at          = case when p_to = 'SERVICE_STARTED' then now() else started_at end,
    completed_at        = case when p_to = 'SERVICE_COMPLETED' then now() else completed_at end,
    cancelled_at        = case when p_to = 'CANCELLED' then now() else cancelled_at end,
    cancelled_by        = case when p_to = 'CANCELLED' then p_actor_type else cancelled_by end,
    cancel_reason       = case when p_to = 'CANCELLED' then p_reason else cancel_reason end,
    nurse_last_lat      = coalesce(p_lat, nurse_last_lat),
    nurse_last_lng      = coalesce(p_lng, nurse_last_lng),
    nurse_last_location_at = case when p_lat is not null then now() else nurse_last_location_at end
  where id = p_booking
  returning * into b;

  insert into booking_status_history(booking_id, from_status, to_status, actor_type, actor_id, reason)
  values (p_booking, v_from, p_to, p_actor_type, p_actor_id, p_reason);

  if p_to = 'CANCELLED' then
    update booking_offers set status = 'EXPIRED', responded_at = now()
     where booking_id = p_booking and status = 'OFFERED';
  end if;
  return b;
end $$;

-- Eligible nurses for a booking, best first.
create or replace function mn_find_nearby_nurses(p_booking uuid, p_radius_km double precision,
    p_limit int, p_location_max_age_minutes int)
returns table(nurse_id uuid, distance_km double precision, fcm_token text) language sql stable as $$
  select np.user_id,
         mn_distance_km(np.last_lat, np.last_lng, b.latitude, b.longitude) as distance_km,
         u.fcm_token
  from bookings b
  join governorates bg on bg.id = b.governorate_id and bg.is_active
  join nurse_services ns on ns.service_id = b.service_id
  join nurse_profiles np on np.user_id = ns.nurse_id
  join app_users u on u.id = np.user_id
  join governorates ng on ng.id = u.governorate_id and ng.is_active
  where b.id = p_booking
    and u.status = 'ACTIVE'
    and np.verification_status = 'APPROVED'
    and np.is_online
    and np.last_lat is not null
    and np.last_location_at > now() - make_interval(mins => p_location_max_age_minutes)
    and mn_distance_km(np.last_lat, np.last_lng, b.latitude, b.longitude) <= p_radius_km
    and not exists (select 1 from booking_offers o where o.booking_id = b.id and o.nurse_id = np.user_id)
    and not exists (select 1 from bookings x where x.nurse_id = np.user_id
                     and x.status in ('NURSE_ON_THE_WAY','NURSE_ARRIVED','SERVICE_STARTED'))
  order by
      0.60 * (mn_distance_km(np.last_lat, np.last_lng, b.latitude, b.longitude) / greatest(p_radius_km, 1))
    - 0.25 * (coalesce(nullif(np.rating_avg, 0), 4.0) / 5.0)
    - 0.15 * (least(np.completed_count, 50) / 50.0)
    + 0.10 * (np.cancelled_count::numeric / greatest(np.offers_accepted, 1))
  limit p_limit
$$;

create or replace function mn_increment_offers_received(p_ids uuid[]) returns void language sql as $$
  update nurse_profiles set offers_received = offers_received + 1 where user_id = any(p_ids)
$$;

-- First valid acceptance wins (row lock on the booking).
create or replace function mn_accept_offer(p_booking uuid, p_nurse uuid) returns bookings language plpgsql as $$
declare b bookings; o booking_offers; np nurse_profiles; v_time timestamptz;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  select * into o from booking_offers where booking_id = p_booking and nurse_id = p_nurse for update;
  if not found then raise exception 'OFFER_NOT_AVAILABLE'; end if;
  if b.status <> 'SEARCHING' then raise exception 'BOOKING_ALREADY_ASSIGNED'; end if;
  if o.status <> 'OFFERED' then raise exception 'OFFER_NOT_AVAILABLE'; end if;
  if o.expires_at < now() then raise exception 'OFFER_EXPIRED'; end if;

  select * into np from nurse_profiles where user_id = p_nurse for update;
  if np.verification_status <> 'APPROVED' or not np.is_online then raise exception 'NURSE_NOT_AVAILABLE'; end if;
  if exists (select 1 from app_users where id = p_nurse and status <> 'ACTIVE') then raise exception 'ACCOUNT_SUSPENDED'; end if;

  v_time := coalesce(b.scheduled_at, now());
  if v_time < now() + interval '3 hours' and exists (select 1 from bookings x where x.nurse_id = p_nurse
        and x.status in ('NURSE_ON_THE_WAY','NURSE_ARRIVED','SERVICE_STARTED')) then
    raise exception 'NURSE_BUSY';
  end if;
  if exists (select 1 from bookings x where x.nurse_id = p_nurse and x.status = 'NURSE_ASSIGNED'
        and abs(extract(epoch from (coalesce(x.scheduled_at, x.assigned_at) - v_time))) < 3 * 3600) then
    raise exception 'NURSE_BUSY';
  end if;

  update bookings set status = 'NURSE_ASSIGNED', nurse_id = p_nurse, assigned_at = now()
   where id = p_booking returning * into b;
  update booking_offers set status = 'ACCEPTED', responded_at = now() where id = o.id;
  update booking_offers set status = 'TAKEN', responded_at = now()
   where booking_id = p_booking and id <> o.id and status = 'OFFERED';
  insert into booking_status_history(booking_id, from_status, to_status, actor_type, actor_id)
  values (p_booking, 'SEARCHING', 'NURSE_ASSIGNED', 'NURSE', p_nurse);
  update nurse_profiles set offers_accepted = offers_accepted + 1 where user_id = p_nurse;
  return b;
end $$;

-- Nurse withdraws from an assigned job: booking goes back to searching.
create or replace function mn_nurse_release_booking(p_booking uuid, p_nurse uuid, p_reason text)
returns bookings language plpgsql as $$
declare b bookings; v_from text;
begin
  select * into b from bookings where id = p_booking for update;
  if not found or b.nurse_id is distinct from p_nurse then raise exception 'BOOKING_NOT_FOUND'; end if;
  if b.status not in ('NURSE_ASSIGNED','NURSE_ON_THE_WAY') then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  v_from := b.status;
  update bookings set status = 'SEARCHING', nurse_id = null, assigned_at = null, on_the_way_at = null,
         last_dispatch_at = null, search_started_at = now(),
         nurse_last_lat = null, nurse_last_lng = null, nurse_last_location_at = null
   where id = p_booking returning * into b;
  update booking_offers set status = 'RELEASED', responded_at = now() where booking_id = p_booking and nurse_id = p_nurse;
  insert into booking_status_history(booking_id, from_status, to_status, actor_type, actor_id, reason)
  values (p_booking, v_from, 'SEARCHING', 'NURSE', p_nurse, p_reason);
  update nurse_profiles set cancelled_count = cancelled_count + 1 where user_id = p_nurse;
  return b;
end $$;

-- Applies a verified successful payment exactly once (webhook and redirect may both arrive).
create or replace function mn_apply_payment_success(p_order text, p_txn text, p_amount numeric,
    p_provider_order text, p_method text)
returns text language plpgsql as $$
declare p payments; b bookings; w wallets; v_after numeric;
begin
  select * into p from payments where merchant_order_id = p_order for update;
  if not found then return 'PAYMENT_NOT_FOUND'; end if;
  if p.status = 'SUCCESS' then return 'ALREADY_PROCESSED'; end if;
  if p_amount is null or round(p_amount, 2) <> p.amount then
    update payments set issue = 'AMOUNT_MISMATCH' where id = p.id;
    return 'AMOUNT_MISMATCH';
  end if;

  update payments set status = 'SUCCESS', provider_transaction_id = p_txn, provider_order_id = p_provider_order,
         provider_method = p_method, paid_at = now(), issue = null
   where id = p.id;

  if p.purpose = 'REGISTRATION_FEE' then
    insert into platform_revenue(category, amount, payment_id, nurse_id)
    values ('REGISTRATION_FEE', p.amount, p.id, p.nurse_id);
    update nurse_profiles set
      registration_fee_paid_at = now(),
      verification_status = case
        when documents_submitted_at is not null and verification_status in ('REGISTERED','FEE_PAID','DOCUMENTS_SUBMITTED')
          then 'PENDING_VERIFICATION'
        when verification_status = 'REGISTERED' then 'FEE_PAID'
        else verification_status end
    where user_id = p.nurse_id;
    return 'OK';
  end if;

  select * into b from bookings where id = p.booking_id for update;
  if b.status <> 'WAITING_FOR_PAYMENT' or b.payment_status = 'PAID' then
    -- Money captured for a booking that is no longer payable: flag for manual refund.
    update payments set issue = 'BOOKING_NOT_PAYABLE_REFUND_REQUIRED' where id = p.id;
    return 'BOOKING_NOT_PAYABLE';
  end if;

  update bookings set status = 'PAID', payment_status = 'PAID', paid_at = now(),
         payment_method = case when p.payer_type = 'NURSE' then 'NURSE_PAID_ON_BEHALF' else 'ONLINE' end
   where id = b.id;
  insert into booking_status_history(booking_id, from_status, to_status, actor_type, reason)
  values (b.id, 'WAITING_FOR_PAYMENT', 'PAID', 'SYSTEM', 'payment ' || p.merchant_order_id);

  insert into wallets(nurse_id) values (b.nurse_id) on conflict (nurse_id) do nothing;
  select * into w from wallets where nurse_id = b.nurse_id for update;
  v_after := w.balance + b.nurse_amount;

  insert into wallet_transactions(nurse_id, type, direction, amount, balance_before, balance_after,
                                  booking_id, payment_id, description, actor_type)
  values (b.nurse_id, 'SERVICE_EARNING', 'CREDIT', b.nurse_amount, w.balance, v_after, b.id, p.id,
          'أرباح خدمة ' || b.code, 'SYSTEM'),
         (b.nurse_id, 'COMMISSION', 'INFO', b.commission_amount, v_after, v_after, b.id, p.id,
          'عمولة المنصة ' || b.commission_pct || '% على ' || b.code, 'SYSTEM');
  update wallets set balance = v_after,
         total_earned = total_earned + b.nurse_amount,
         total_commission = total_commission + b.commission_amount,
         updated_at = now()
   where nurse_id = b.nurse_id;

  insert into platform_revenue(category, amount, booking_id, payment_id, nurse_id)
  values ('SERVICE_COMMISSION', b.commission_amount, b.id, p.id, b.nurse_id);

  if p.payer_type = 'NURSE' then
    insert into wallet_transactions(nurse_id, type, direction, amount, balance_before, balance_after,
                                    booking_id, payment_id, description, actor_type, actor_id)
    values (b.nurse_id, 'NURSE_PAID_ON_BEHALF', 'INFO', p.amount, v_after, v_after, b.id, p.id,
            'دفع نيابة عن العميل ' || b.code, 'NURSE', b.nurse_id);
    insert into customer_dues(booking_id, customer_id, guest_phone, nurse_id, amount)
    values (b.id, b.customer_id, b.guest_phone, b.nurse_id, p.amount);
  end if;

  update nurse_profiles set completed_count = completed_count + 1 where user_id = b.nurse_id;
  return 'OK';
end $$;

create or replace function mn_mark_payment_failed(p_order text, p_reason text) returns text language plpgsql as $$
begin
  update payments set status = 'FAILED', issue = p_reason where merchant_order_id = p_order and status = 'PENDING';
  return 'OK';
end $$;

create or replace function mn_request_withdrawal(p_nurse uuid, p_amount numeric, p_method text,
    p_account text, p_min numeric) returns withdrawals language plpgsql as $$
declare w wallets; r withdrawals;
begin
  if p_amount <= 0 or p_amount < p_min then raise exception 'WITHDRAWAL_BELOW_MINIMUM'; end if;
  insert into wallets(nurse_id) values (p_nurse) on conflict (nurse_id) do nothing;
  select * into w from wallets where nurse_id = p_nurse for update;
  if w.balance < p_amount then raise exception 'INSUFFICIENT_BALANCE'; end if;
  insert into withdrawals(nurse_id, amount, method, receiving_account)
  values (p_nurse, p_amount, p_method, p_account) returning * into r;
  insert into wallet_transactions(nurse_id, type, direction, amount, balance_before, balance_after,
                                  withdrawal_id, description, actor_type, actor_id)
  values (p_nurse, 'WITHDRAWAL', 'DEBIT', p_amount, w.balance, w.balance - p_amount, r.id, 'طلب سحب', 'USER', p_nurse);
  update wallets set balance = balance - p_amount, updated_at = now() where nurse_id = p_nurse;
  return r;
end $$;

create or replace function mn_update_withdrawal(p_id uuid, p_action text, p_admin uuid, p_note text, p_reference text)
returns withdrawals language plpgsql as $$
declare r withdrawals; w wallets;
begin
  select * into r from withdrawals where id = p_id for update;
  if not found then raise exception 'WITHDRAWAL_NOT_FOUND'; end if;

  if p_action = 'APPROVE' and r.status = 'PENDING' then
    update withdrawals set status = 'APPROVED', reviewed_by = p_admin, reviewed_at = now(),
           admin_note = coalesce(p_note, admin_note) where id = p_id returning * into r;
  elsif p_action = 'PROCESSING' and r.status = 'APPROVED' then
    update withdrawals set status = 'PROCESSING', admin_note = coalesce(p_note, admin_note)
     where id = p_id returning * into r;
  elsif p_action = 'MARK_PAID' and r.status in ('APPROVED','PROCESSING') then
    update withdrawals set status = 'PAID', paid_at = now(), reference = p_reference,
           admin_note = coalesce(p_note, admin_note) where id = p_id returning * into r;
    update wallets set total_withdrawn = total_withdrawn + r.amount, updated_at = now() where nurse_id = r.nurse_id;
  elsif p_action = 'REJECT' and r.status in ('PENDING','APPROVED','PROCESSING') then
    select * into w from wallets where nurse_id = r.nurse_id for update;
    update withdrawals set status = 'REJECTED', reviewed_by = p_admin, reviewed_at = now(),
           admin_note = p_note where id = p_id returning * into r;
    insert into wallet_transactions(nurse_id, type, direction, amount, balance_before, balance_after,
                                    withdrawal_id, description, actor_type, actor_id)
    values (r.nurse_id, 'ADJUSTMENT', 'CREDIT', r.amount, w.balance, w.balance + r.amount, r.id,
            'إعادة مبلغ طلب سحب مرفوض', 'ADMIN', p_admin);
    update wallets set balance = balance + r.amount, updated_at = now() where nurse_id = r.nurse_id;
  else
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;
  return r;
end $$;

create or replace function mn_reviews_after_insert() returns trigger language plpgsql as $$
begin
  update nurse_profiles np set rating_count = s.c, rating_avg = s.a
    from (select count(*) as c, round(avg(rating)::numeric, 2) as a from reviews where nurse_id = new.nurse_id) s
   where np.user_id = new.nurse_id;
  return new;
end $$;
create trigger trg_reviews_rating after insert on reviews for each row execute function mn_reviews_after_insert();

create or replace function mn_dashboard_stats(p_from timestamptz, p_to timestamptz, p_gov uuid)
returns json language sql stable as $$
  select json_build_object(
    'bookings_in_range',     (select count(*) from bookings where created_at >= p_from and created_at < p_to and (p_gov is null or governorate_id = p_gov)),
    'active_bookings',       (select count(*) from bookings where status in ('SEARCHING','NURSE_ASSIGNED','NURSE_ON_THE_WAY','NURSE_ARRIVED','SERVICE_STARTED','SERVICE_COMPLETED','WAITING_FOR_PAYMENT') and (p_gov is null or governorate_id = p_gov)),
    'completed_bookings',    (select count(*) from bookings where status = 'PAID' and paid_at >= p_from and paid_at < p_to and (p_gov is null or governorate_id = p_gov)),
    'cancelled_bookings',    (select count(*) from bookings where status = 'CANCELLED' and cancelled_at >= p_from and cancelled_at < p_to and (p_gov is null or governorate_id = p_gov)),
    'searching_too_long',    (select count(*) from bookings where status = 'SEARCHING' and search_started_at < now() - interval '10 minutes' and (p_gov is null or governorate_id = p_gov)),
    'online_nurses',         (select count(*) from nurse_profiles np join app_users u on u.id = np.user_id where np.is_online and (p_gov is null or u.governorate_id = p_gov)),
    'total_nurses',          (select count(*) from app_users where role = 'NURSE' and (p_gov is null or governorate_id = p_gov)),
    'approved_nurses',       (select count(*) from nurse_profiles np join app_users u on u.id = np.user_id where np.verification_status = 'APPROVED' and (p_gov is null or u.governorate_id = p_gov)),
    'pending_verifications', (select count(*) from nurse_profiles where verification_status = 'PENDING_VERIFICATION'),
    'customers',             (select count(*) from app_users where role = 'CUSTOMER' and (p_gov is null or governorate_id = p_gov)),
    'gross_revenue',         (select coalesce(sum(total_amount), 0) from bookings where status = 'PAID' and paid_at >= p_from and paid_at < p_to and (p_gov is null or governorate_id = p_gov)),
    'commission',            (select coalesce(sum(commission_amount), 0) from bookings where status = 'PAID' and paid_at >= p_from and paid_at < p_to and (p_gov is null or governorate_id = p_gov)),
    'registration_fees',     (select coalesce(sum(amount), 0) from platform_revenue where category = 'REGISTRATION_FEE' and created_at >= p_from and created_at < p_to),
    'pending_withdrawals',   (select count(*) from withdrawals where status in ('PENDING','APPROVED','PROCESSING')),
    'open_complaints',       (select count(*) from complaints where status in ('OPEN','IN_REVIEW','ESCALATED')),
    'payment_issues',        (select count(*) from payments where issue is not null and created_at >= p_from - interval '30 days')
  )
$$;

create or replace function mn_revenue_report(p_from timestamptz, p_to timestamptz)
returns json language sql stable as $$
  select json_build_object(
    'gross_service_value', (select coalesce(sum(total_amount), 0) from bookings where status = 'PAID' and paid_at >= p_from and paid_at < p_to),
    'commission',          (select coalesce(sum(amount), 0) from platform_revenue where category = 'SERVICE_COMMISSION' and created_at >= p_from and created_at < p_to),
    'nurse_earnings',      (select coalesce(sum(nurse_amount), 0) from bookings where status = 'PAID' and paid_at >= p_from and paid_at < p_to),
    'registration_fees',   (select coalesce(sum(amount), 0) from platform_revenue where category = 'REGISTRATION_FEE' and created_at >= p_from and created_at < p_to),
    'withdrawals_paid',    (select coalesce(sum(amount), 0) from withdrawals where status = 'PAID' and paid_at >= p_from and paid_at < p_to),
    'refunds',             (select coalesce(sum(amount), 0) from wallet_transactions where type = 'REFUND' and created_at >= p_from and created_at < p_to),
    'paid_bookings',       (select count(*) from bookings where status = 'PAID' and paid_at >= p_from and paid_at < p_to),
    'payments_needing_refund', (select count(*) from payments where issue = 'BOOKING_NOT_PAYABLE_REFUND_REQUIRED'),
    'daily', (select coalesce(json_agg(d order by d.day), '[]'::json) from (
                select date_trunc('day', paid_at)::date as day, count(*) as bookings,
                       sum(total_amount) as gross, sum(commission_amount) as commission
                  from bookings where status = 'PAID' and paid_at >= p_from and paid_at < p_to
                 group by 1) d)
  )
$$;

-- =====================================================================
-- Lock everything down: only the server's secret key (service_role) may use these.
-- =====================================================================
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
revoke all on all sequences in schema public from anon, authenticated;

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('service-images',  'service-images',  true,  3145728, array['image/jpeg','image/png','image/webp']),
  ('nurse-documents', 'nurse-documents', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;
