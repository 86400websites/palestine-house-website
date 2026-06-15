-- 0004_profile_read_rpc.down.sql — reverses 0004_profile_read_rpc.up.sql.

drop function if exists public.get_my_profile();
