-- 0017_verify_TEST_db_only.sql
-- Role-simulated proof for migration 0017 (resources download) — the approval
-- gate on the download read path. TEST DATABASE ONLY: it switches role to
-- simulate anon / pending / approved. It makes NO writes (every block is
-- begin … rollback), but it is meant for the test project, not production.
--
-- HOW TO RUN: first run step 0 to discover four ids, paste them into the three
-- role blocks (replace the <…> placeholders), then run each block. Each EXPECT
-- is in the trailing comment.

-- 0) Discover ids to paste below (run as the default privileged role).
select
  (select id from public.profiles where is_approved = true  limit 1) as approved_uid,
  (select id from public.profiles where is_approved = false limit 1) as pending_uid,
  (select id from public.resources where is_public = false order by sort_order limit 1) as template_id,
  (select id from public.resources where is_public = true limit 1) as booklet_id;

-- 1) APPROVED — resolves both a template and a booklet path, and can read the
--    private resources objects (so its own client can mint signed URLs).
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<approved_uid>","role":"authenticated"}';
  select 'approved' as who,
    (select count(*) from public.get_resource_download('<template_id>')) as rpc_template_rows,    -- 1
    (select count(*) from public.get_resource_download('<booklet_id>'))  as rpc_booklet_rows,     -- 1
    (select count(*) from storage.objects where bucket_id = 'resources') as storage_resources;    -- 267 (all)
rollback;

-- 2) PENDING — the gate holds: zero path rows and zero readable private objects
--    (cannot mint a signed URL).
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<pending_uid>","role":"authenticated"}';
  select 'pending' as who,
    (select count(*) from public.get_resource_download('<template_id>')) as rpc_template_rows,    -- 0
    (select count(*) from storage.objects where bucket_id = 'resources') as storage_resources;    -- 0
rollback;

-- 3) ANON — cannot execute the lookup at all, and reads no private objects.
begin;
  set local role anon;
  set local request.jwt.claims = '{"role":"anon"}';
  select 'anon' as who,
    has_function_privilege('anon', 'public.get_resource_download(uuid)', 'execute') as can_exec_rpc, -- false
    (select count(*) from storage.objects where bucket_id = 'resources') as storage_resources;       -- 0
rollback;

-- Result on TEST 2026-06-19 (sdszcralogcrujtyghig): approved 1/1/267 · pending 0/0 ·
-- anon can_exec=false / 0. Gate holds on the download read path.
