-- S5_verify_TEST_db_only.sql
-- S5 content-schema verification — intended for the NON-PRODUCTION (TEST) database
-- (palestine-house-test-database, https://sdszcralogcrujtyghig.supabase.co),
-- AFTER applying ../migrations/0011_elements … 0015_academy_modules.
--
-- This is a TEST HELPER, not a migration. It seeds ONE throwaway row per content
-- table, role-simulates anon / pending / approved against them, then DELETES the
-- seed and asserts the tables are empty again (the Supabase SQL Editor does not
-- reliably honour a hand-written begin…rollback, so cleanup is by explicit delete,
-- not rollback — the S3/0008 lesson). Re-runnable and self-cleaning.
--
-- For production use the read-only ../verification/S5_verify_PROD_safe_readonly.sql.
--
-- PREREQUISITE — fill in three real TEST users (any two approved, one pending):
--   select p.id, p.is_approved, (a.user_id is not null) as is_admin,
--          (select email from auth.users u where u.id = p.id) as email
--   from public.profiles p left join public.admins a on a.user_id = p.id
--   order by p.is_approved desc;
-- Replace APPROVED_A_UUID, APPROVED_B_UUID, PENDING_UUID below (keep the quotes).

-- ---------------------------------------------------------------------------
-- 1) Seed one throwaway row per table (sentinel-titled; idempotent)
-- ---------------------------------------------------------------------------
delete from public.checklist_progress where checklist_item_id in
  (select id from public.checklist_items where item_text like '\_\_matrix\_seed\_\_%');
delete from public.checklist_items where item_text like '\_\_matrix\_seed\_\_%';
delete from public.academy_modules   where title like '\_\_matrix\_seed\_\_%';
delete from public.resources         where title like '\_\_matrix\_seed\_\_%';
delete from public.programming_sessions where title like '\_\_matrix\_seed\_\_%';
delete from public.elements          where title like '\_\_matrix\_seed\_\_%';

insert into public.elements (slug, code, focus_area_code, focus_area_name, title, one_line, overview_md, simple_guide_md, watch_out_for_md, sort_order)
values ('a1','A1','A','Identity & Story','__matrix_seed__ Element A1','seed','OV','SG','WO',0);
insert into public.checklist_items (element_id, group_label, gate, item_text, sort_order)
select id,'Group',1,'__matrix_seed__ item 1',1 from public.elements where slug='a1';
insert into public.checklist_items (element_id, group_label, gate, item_text, sort_order)
select id,'Group',null,'__matrix_seed__ item 2',2 from public.elements where slug='a1';
insert into public.resources (title, type, focus_area_code, element_id, storage_bucket, storage_path, is_public, sort_order)
select '__matrix_seed__ form','form','A', id,'resources','__matrix_seed__/seed.docx', false, 0 from public.elements where slug='a1';
insert into public.academy_modules (element_id, title, one_line, youtube_url, body_md, sort_order)
select id,'__matrix_seed__ module','seed', null,'script',0 from public.elements where slug='a1';
insert into public.programming_sessions (created_by, title, summary, mode, status, starts_at)
values ('APPROVED_A_UUID','__matrix_seed__ session','summary','workshop','live', now());
-- progress + session owned by the PENDING user — to prove the post-0016 read/delete gate
insert into public.checklist_progress (user_id, checklist_item_id, status)
select 'PENDING_UUID', id, 'complete' from public.checklist_items where item_text='__matrix_seed__ item 1';
insert into public.programming_sessions (created_by, title, summary, mode, status, starts_at)
values ('PENDING_UUID','__matrix_seed__ pending session','s','workshop','scheduled', now());

-- ---------------------------------------------------------------------------
-- 2) Role matrix (anon / pending / approved A / approved B), denial-catching
-- ---------------------------------------------------------------------------
create or replace function pg_temp.s5_matrix()
returns table(scenario text, expected text, observed text, pass boolean)
language plpgsql as $fn$
declare
  a    constant text := 'APPROVED_A_UUID';
  b    constant text := 'APPROVED_B_UUID';
  pend constant text := 'PENDING_UUID';
  item1 uuid := (select id from public.checklist_items where item_text='__matrix_seed__ item 1');
  n int; obs text; ok boolean; ast text;
begin
  -- ANON: public projection allowed; every gated RPC denied; private bucket unreadable
  perform set_config('role','none',true); perform set_config('request.jwt.claims','{"role":"anon"}',true); perform set_config('role','anon',true);
  begin select count(*) into n from public.public_programming_sessions(); obs:='rows='||n; ok:=(n>=1);
  exception when others then obs:='DENIED '||sqlstate; ok:=false; end;
  perform set_config('role','none',true);
  scenario:='anon'; expected:='public_programming_sessions OK >=1'; observed:=obs; pass:=ok; return next;

  foreach ast in array array['get_elements()','get_element(''a1'')','get_checklist()','get_resources()','get_academy_modules()'] loop
    perform set_config('request.jwt.claims','{"role":"anon"}',true); perform set_config('role','anon',true);
    begin execute 'select count(*) from public.'||ast into n; obs:='rows='||n||' NOT-DENIED'; ok:=false;
    exception when insufficient_privilege then obs:='DENIED 42501'; ok:=true; when others then obs:=sqlstate; ok:=false; end;
    perform set_config('role','none',true);
    scenario:='anon'; expected:='DENIED 42501'; observed:=ast||' -> '||obs; pass:=ok; return next;
  end loop;

  perform set_config('request.jwt.claims','{"role":"anon"}',true); perform set_config('role','anon',true);
  begin perform public.set_checklist_progress(item1,'complete'); obs:='NOT-DENIED'; ok:=false;
  exception when insufficient_privilege then obs:='DENIED 42501'; ok:=true; when others then obs:=sqlstate; ok:=false; end;
  perform set_config('role','none',true);
  scenario:='anon'; expected:='set_checklist_progress DENIED 42501'; observed:=obs; pass:=ok; return next;

  perform set_config('request.jwt.claims','{"role":"anon"}',true); perform set_config('role','anon',true);
  begin select count(*) into n from storage.objects where bucket_id='resources'; obs:='rows='||n; ok:=(n=0);
  exception when others then obs:='DENIED '||sqlstate; ok:=true; end;
  perform set_config('role','none',true);
  scenario:='anon'; expected:='private bucket: 0 rows or denied'; observed:=obs; pass:=ok; return next;

  -- PENDING (authenticated, is_approved=false): gated reads callable but 0 rows; writes denied
  foreach ast in array array['get_elements()','get_element(''a1'')','get_checklist()','get_resources()','get_academy_modules()'] loop
    perform set_config('role','none',true);
    perform set_config('request.jwt.claims', json_build_object('sub',pend,'role','authenticated')::text, true);
    perform set_config('role','authenticated',true);
    begin execute 'select count(*) from public.'||ast into n; obs:='rows='||n; ok:=(n=0);
    exception when others then obs:='ERR '||sqlstate; ok:=false; end;
    perform set_config('role','none',true);
    scenario:='pending'; expected:='callable but 0 rows'; observed:=ast||' -> '||obs; pass:=ok; return next;
  end loop;

  perform set_config('request.jwt.claims', json_build_object('sub',pend,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin perform public.set_checklist_progress(item1,'complete'); obs:='NOT-DENIED'; ok:=false;
  exception when others then obs:='DENIED '||sqlstate; ok:=(sqlstate='42501'); end;
  perform set_config('role','none',true);
  scenario:='pending'; expected:='set_checklist_progress not authorized 42501'; observed:=obs; pass:=ok; return next;

  perform set_config('request.jwt.claims', json_build_object('sub',pend,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin select count(*) into n from public.get_my_profile(); obs:='own_profile_rows='||n; ok:=(n=1);
  exception when others then obs:='ERR '||sqlstate; ok:=false; end;
  perform set_config('role','none',true);
  scenario:='pending'; expected:='resolves only own profile (1 row)'; observed:=obs; pass:=ok; return next;

  -- pending: cannot read its OWN checklist_progress (gated by is_approved after 0016)
  perform set_config('request.jwt.claims', json_build_object('sub',pend,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin select count(*) into n from public.checklist_progress; obs:='rows='||n; ok:=(n=0);
  exception when others then obs:='ERR '||sqlstate; ok:=false; end;
  perform set_config('role','none',true);
  scenario:='pending'; expected:='cannot read own checklist_progress (0) [0016]'; observed:=obs; pass:=ok; return next;

  -- pending: cannot delete its OWN session (gated by is_approved after 0016)
  perform set_config('request.jwt.claims', json_build_object('sub',pend,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin delete from public.programming_sessions where title='__matrix_seed__ pending session'; get diagnostics n = row_count; obs:='deleted='||n; ok:=(n=0);
  exception when others then obs:='DENIED '||sqlstate; ok:=true; end;
  perform set_config('role','none',true);
  scenario:='pending'; expected:='cannot delete own session (0) [0016]'; observed:=obs; pass:=ok; return next;

  -- APPROVED A: reads content; writes/reads only OWN progress; forged status rejected
  foreach ast in array array['get_elements()','get_element(''a1'')','get_checklist()','get_resources()','get_academy_modules()'] loop
    perform set_config('role','none',true);
    perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true);
    perform set_config('role','authenticated',true);
    begin execute 'select count(*) from public.'||ast into n; obs:='rows='||n; ok:=(n>=1);
    exception when others then obs:='ERR '||sqlstate; ok:=false; end;
    perform set_config('role','none',true);
    scenario:='approved'; expected:='returns content (>=1; checklist=2)'; observed:=ast||' -> '||obs; pass:=ok; return next;
  end loop;

  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin obs:=public.set_checklist_progress(item1,'in_progress'); ok:=(obs='in_progress');
  exception when others then obs:='ERR '||sqlstate; ok:=false; end;
  perform set_config('role','none',true);
  scenario:='approved'; expected:='writes OWN progress -> in_progress'; observed:=obs; pass:=ok; return next;

  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin perform public.set_checklist_progress(item1,'bogus'); obs:='NOT-REJECTED'; ok:=false;
  exception when others then obs:='REJECTED '||sqlstate; ok:=(sqlstate='22023'); end;
  perform set_config('role','none',true);
  scenario:='approved'; expected:='forged status rejected 22023'; observed:=obs; pass:=ok; return next;

  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin select count(*) into n from public.checklist_progress; obs:='own_progress_rows='||n; ok:=(n=1);
  exception when others then obs:='ERR '||sqlstate; ok:=false; end;
  perform set_config('role','none',true);
  scenario:='approved'; expected:='reads only OWN progress (1)'; observed:=obs; pass:=ok; return next;

  -- APPROVED B: cannot see / update A's progress; writes only its own
  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin select count(*) into n from public.checklist_progress; obs:='sees_rows='||n; ok:=(n=0);
  exception when others then obs:='ERR '||sqlstate; ok:=false; end;
  perform set_config('role','none',true);
  scenario:='approved B'; expected:='cannot see A''s progress (0)'; observed:=obs; pass:=ok; return next;

  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin update public.checklist_progress set status='complete' where checklist_item_id=item1; get diagnostics n = row_count; obs:='rows_updated='||n; ok:=(n=0);
  exception when others then obs:='DENIED '||sqlstate; ok:=true; end;
  perform set_config('role','none',true);
  scenario:='approved B'; expected:='cannot UPDATE A''s row (0/denied)'; observed:=obs; pass:=ok; return next;

  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin obs:=public.set_checklist_progress(item1,'complete'); ok:=(obs='complete');
  exception when others then obs:='ERR '||sqlstate; ok:=false; end;
  perform set_config('role','none',true);
  scenario:='approved B'; expected:='writes its OWN progress -> complete'; observed:=obs; pass:=ok; return next;

  -- STORAGE: approved cannot directly read the private bucket
  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true); perform set_config('role','authenticated',true);
  begin select count(*) into n from storage.objects where bucket_id='resources'; obs:='rows='||n; ok:=(n=0);
  exception when others then obs:='DENIED '||sqlstate; ok:=true; end;
  perform set_config('role','none',true);
  scenario:='approved'; expected:='no direct storage.objects read (0/denied)'; observed:=obs; pass:=ok; return next;

  -- Stored-row truth check (privileged read): A's row intact, B's row separate
  select status into obs from public.checklist_progress cp where cp.user_id=a::uuid and cp.checklist_item_id=item1;
  scenario:='isolation'; expected:='A row = in_progress'; observed:=coalesce(obs,'<none>'); pass:=(obs='in_progress'); return next;
  select status into obs from public.checklist_progress cp where cp.user_id=b::uuid and cp.checklist_item_id=item1;
  scenario:='isolation'; expected:='B row = complete (separate)'; observed:=coalesce(obs,'<none>'); pass:=(obs='complete'); return next;
  return;
end;
$fn$;
select * from pg_temp.s5_matrix();
-- EXPECT: pass = true for every row.

-- ---------------------------------------------------------------------------
-- 3) Teardown — delete the seed (cascade clears the progress rows) and assert empty
-- ---------------------------------------------------------------------------
drop function if exists pg_temp.s5_matrix();
delete from public.checklist_progress where checklist_item_id in
  (select id from public.checklist_items where item_text like '\_\_matrix\_seed\_\_%');
delete from public.checklist_items where item_text like '\_\_matrix\_seed\_\_%';
delete from public.academy_modules   where title like '\_\_matrix\_seed\_\_%';
delete from public.resources         where title like '\_\_matrix\_seed\_\_%';
delete from public.programming_sessions where title like '\_\_matrix\_seed\_\_%';
delete from public.elements          where title like '\_\_matrix\_seed\_\_%';

select
  (select count(*) from public.elements          where title like '\_\_matrix\_seed\_\_%') as seed_elements,
  (select count(*) from public.checklist_items   where item_text like '\_\_matrix\_seed\_\_%') as seed_items,
  (select count(*) from public.academy_modules   where title like '\_\_matrix\_seed\_\_%') as seed_academy,
  (select count(*) from public.resources         where title like '\_\_matrix\_seed\_\_%') as seed_resources,
  (select count(*) from public.programming_sessions where title like '\_\_matrix\_seed\_\_%') as seed_sessions;
-- EXPECT: all five = 0 (seed fully cleaned; only the real ingested content remains)
