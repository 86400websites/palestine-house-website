-- 0008_verify_TEST_db_only.sql
-- FUNCTIONAL proof for migration 0008, on the TEST database only
-- (sdszcralogcrujtyghig) — never production. It creates two throwaway auth
-- users to fire the on_auth_user_created trigger, checks the resulting profile
-- rows, then DELETES them explicitly.
--
-- NOTE: the Supabase SQL Editor does not reliably honour a hand-written
-- `begin … rollback`, so this script does NOT depend on rollback to clean up —
-- it deletes the test rows directly (profiles cascade from auth.users). The
-- leading delete also makes the whole script safely RE-RUNNABLE: it clears any
-- rows left by an earlier run before re-testing. End state: zero test rows.

-- 0) Idempotent pre-clean: remove anything a previous run may have left behind.
delete from auth.users
where id in (
  '00000000-0000-0000-0000-0000000008a1',
  '00000000-0000-0000-0000-0000000008b2'
);

-- 1) Case A — a real name with surrounding spaces -> trimmed onto the profile.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-0000000008a1',
  'authenticated', 'authenticated',
  'verify-0008-a@example.test', '',
  now(), now(), '{}'::jsonb,
  jsonb_build_object('full_name', '  Layla Q  ')
);

-- 2) Case B — a blank name -> NULL (no stray-space "name" lands on the profile).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-0000000008b2',
  'authenticated', 'authenticated',
  'verify-0008-b@example.test', '',
  now(), now(), '{}'::jsonb,
  jsonb_build_object('full_name', '   ')
);

-- 3) The trigger should have created one profile per user, full_name mapped.
select id, full_name, is_approved
from public.profiles
where id in (
  '00000000-0000-0000-0000-0000000008a1',
  '00000000-0000-0000-0000-0000000008b2'
)
order by id;
-- EXPECT exactly two rows:
--   ...0008a1 | Layla Q | false   (name trimmed; is_approved still defaults false)
--   ...0008b2 | (null)  | false   (blank metadata -> NULL, not a space)

-- 4) Clean up (profiles rows cascade from auth.users on delete).
delete from auth.users
where id in (
  '00000000-0000-0000-0000-0000000008a1',
  '00000000-0000-0000-0000-0000000008b2'
);

-- 5) Confirm nothing is left behind.
select count(*) as leftover_rows
from public.profiles
where id in (
  '00000000-0000-0000-0000-0000000008a1',
  '00000000-0000-0000-0000-0000000008b2'
);
-- EXPECT: leftover_rows = 0
