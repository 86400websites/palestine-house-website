-- 0018_account_prefs.up.sql
-- S6 (6g): account self-management for /account.
--
--   1) profiles.marketing_opt_in — the email opt-in. Default FALSE
--      (privacy-respecting; expand-only, so every existing row is simply opted
--      out until the partner opts in).
--   2) set_my_account(p_display_name, p_marketing_opt_in) — the owner-scoped
--      write for the current user's OWN profile. Account management is available
--      BEFORE approval (the sidebar Account item is always reachable), so this
--      is scoped by auth.uid() but is deliberately NOT is_approved()-gated. It
--      can only ever set full_name + marketing_opt_in — never is_approved — so
--      there is no escalation path. Display name is trimmed, capped at 120, and
--      blank becomes NULL. Hardened like every RPC: SECURITY DEFINER,
--      search_path = '', fully-qualified, EXECUTE revoked from public/anon then
--      granted to authenticated.

alter table public.profiles
  add column if not exists marketing_opt_in boolean not null default false;

create or replace function public.set_my_account(
  p_display_name     text,
  p_marketing_opt_in boolean
)
returns table (display_name text, opt_in boolean)
language sql
security definer
set search_path = ''
as $$
  with upd as (
    update public.profiles
       set full_name        = left(nullif(btrim(coalesce(p_display_name, '')), ''), 120),
           marketing_opt_in  = coalesce(p_marketing_opt_in, false),
           updated_at        = now()
     where id = (select auth.uid())
    returning full_name, marketing_opt_in
  )
  select full_name, marketing_opt_in from upd;
$$;

revoke execute on function public.set_my_account(text, boolean) from public, anon;
grant execute on function public.set_my_account(text, boolean) to authenticated;
