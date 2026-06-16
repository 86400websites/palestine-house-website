-- 0008_verify_TEST_db_only.sql
-- FUNCTIONAL proof for migration 0008, on the TEST database only. It creates
-- two throwaway auth users to fire the on_auth_user_created trigger, checks the
-- resulting profile rows, and then ROLLS BACK — so it persists nothing. Even
-- so, run it ONLY on the test database (sdszcralogcrujtyghig), never prod.
--
-- If the auth.users insert errors on your Supabase version (auth schema
-- specifics), don't worry: the read-only 0008_verify_PROD_safe_readonly.sql
-- proves the redefinition + lockdown, and the real end-to-end proof is signing
-- up through /apply on Preview and checking profiles.full_name.

begin;

-- Case 1: a real name with surrounding spaces -> trimmed onto the profile.
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

-- Case 2: a blank name -> NULL (no stray-space "name" lands on the profile).
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

-- The trigger should have created one profile per user, with full_name mapped.
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

rollback;

-- Safety net: confirm the rollback left nothing behind.
select count(*) as leftover_rows
from public.profiles
where id in (
  '00000000-0000-0000-0000-0000000008a1',
  '00000000-0000-0000-0000-0000000008b2'
);
-- EXPECT: leftover_rows = 0
