-- 0018_account_prefs.down.sql — reverses 0018.
-- Drops the account-write RPC and the marketing_opt_in column. NOTE: dropping
-- the column discards any saved opt-in values (inherent to the rollback).

drop function if exists public.set_my_account(text, boolean);
alter table public.profiles drop column if exists marketing_opt_in;
