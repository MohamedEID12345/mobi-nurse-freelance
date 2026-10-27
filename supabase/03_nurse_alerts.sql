-- =====================================================================
-- MOBI-NURSE — nurse request alerts (run once, after 01 and 02)
-- Background location heartbeat from the Android app while the nurse is
-- online. The app gets a narrow-scope token that can ONLY update the
-- nurse's location; it is revoked when the nurse goes offline.
-- =====================================================================
alter table nurse_profiles add column if not exists heartbeat_token_hash text;
alter table nurse_profiles add column if not exists heartbeat_expires_at timestamptz;
create unique index if not exists nurse_profiles_heartbeat_token on nurse_profiles(heartbeat_token_hash)
  where heartbeat_token_hash is not null;
