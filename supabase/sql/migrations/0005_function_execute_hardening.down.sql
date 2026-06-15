-- 0005_function_execute_hardening.down.sql — reverses 0005.
-- Re-grants EXECUTE to public, restoring the broader (pre-hardening) access.
-- authenticated keeps its grant from 0003/0004. Rollback symmetry only — this
-- is the LESS restrictive state, so prefer forward-fix over running this.

grant execute on function public.handle_new_user() to public;
grant execute on function public.is_admin() to public;
grant execute on function public.is_approved() to public;
grant execute on function public.get_my_profile() to public;
