-- 0006_handle_new_user_execute_lockdown.down.sql — reverses 0006.
-- Restores authenticated's EXECUTE on the trigger function (the Supabase
-- default state). Rollback symmetry only.

grant execute on function public.handle_new_user() to authenticated;
