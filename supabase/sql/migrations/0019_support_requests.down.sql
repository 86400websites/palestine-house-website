-- 0019_support_requests.down.sql — reverses 0019.
-- Drops both RPCs and the table. NOTE: dropping the table discards any stored
-- support requests (inherent to the rollback).

drop function if exists public.admin_list_support_requests();
drop function if exists public.submit_support_request(text, text);
drop table if exists public.support_requests;
