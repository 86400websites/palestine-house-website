-- 0015_academy_modules.down.sql — reverses 0015_academy_modules.up.sql.
-- Drop the RPC, then the table (which removes its RLS).

drop function if exists public.get_academy_modules();
drop table if exists public.academy_modules;
