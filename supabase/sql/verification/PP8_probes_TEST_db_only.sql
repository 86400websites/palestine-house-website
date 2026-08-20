-- PP8_probes_TEST_db_only.sql
--
-- ⛔ TEST ONLY. Every block ends in `RAISE EXCEPTION`, so the transaction aborts
--    and NOTHING is written — but two of them mutate before aborting
--    (flipping `is_approved`, drafting a topic, creating a probe table), and a
--    mutation that aborts on production is still a mutation that ran there.
--    Do not paste this into the production SQL Editor.
--
-- WHY THIS FILE EXISTS (independent review, PP8 8-k)
--   PP8's §15 evidence was produced by probes run ad hoc through the MCP. The
--   reviewer's fair objection: "the exact probe SQL and raw output are not
--   committed, so these executions cannot be independently replayed." Reading
--   ACLs, relrowsecurity, role-scoped results and constraint names before a
--   forced abort is valid — the abort only prevents persistence — but an
--   un-replayable proof is a claim, not a proof. So the probes are committed.
--
-- HOW TO READ THE OUTPUT
--   Each block deliberately FAILS with a P0001 error whose message is the
--   result table. That is the intended outcome; an error here is success.
--
-- ⚠️ TWO PROBE DEFECTS THAT THESE BLOCKS EXIST TO AVOID REPEATING
--   ① `PERFORM fn()` on a TABLE-returning function swallows a zero-row result,
--      so an approval gate that correctly returns nothing looks like it
--      returned successfully. Count rows; never PERFORM.
--   ② Attacking a CHECK constraint with an invalid `type` value gets you
--      rejected by `resources_type_check` instead, which scores as a pass.
--      Always assert WHICH constraint rejected you.


-- =====================================================================
-- PROBE 1 — the blanket approval gate, executed rather than grepped.
-- Expect: approved sees everything; pending sees zero rows AND zero bytes;
-- anon is denied EXECUTE outright.
-- =====================================================================
do $probe1$
declare
  v_partner uuid;
  v_slug text; v_elem uuid; v_res uuid; v_topic uuid;
  r text := E'\n'; n int;
begin
  -- an APPROVED, NON-ADMIN profile. An admin reads Storage through the admin
  -- policy 0029 added, so probing as one proves nothing about the partner path.
  select p.id into v_partner
    from public.profiles p
    left join public.admins a on a.user_id = p.id
   where p.is_approved and a.user_id is null
   limit 1;
  if v_partner is null then
    raise exception 'No approved non-admin profile on this database — probe cannot run honestly.';
  end if;

  select e.id, e.slug into v_elem, v_slug from public.elements e order by e.code limit 1;
  select id into v_topic from public.platform_topics where element_id = v_elem;
  select id into v_res from public.resources where element_id = v_elem and doc_key is null limit 1;

  ------------------------------------------------------------ A: APPROVED
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_partner, 'role', 'authenticated')::text, true);
  select count(*) into n from public.get_platform_topics();        r := r||'A approved topics        = '||n||E'\n';
  select count(*) into n from public.get_element(v_slug);          r := r||'A approved get_element   = '||n||E'\n';
  select count(*) into n from public.get_resource_download(v_res); r := r||'A approved download rows = '||n||'   (COUNT, never PERFORM)'||E'\n';
  select count(*) into n from storage.objects where bucket_id='resources';
                                                                   r := r||'A approved objects       = '||n||E'\n';

  ------------------------------------------------------------- B: PENDING
  set local role postgres;
  update public.profiles set is_approved = false where id = v_partner;
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_partner, 'role', 'authenticated')::text, true);
  select count(*) into n from public.get_platform_topics();        r := r||E'\n'||'B pending topics         = '||n||'   (expect 0)'||E'\n';
  select count(*) into n from public.get_resource_download(v_res); r := r||'B pending download rows  = '||n||'   (expect 0)'||E'\n';
  select count(*) into n from storage.objects where bucket_id='resources';
                                                                   r := r||'B pending objects (BYTE) = '||n||'   (expect 0)'||E'\n';
  select count(*) into n from public.get_my_profile();             r := r||'B pending own profile    = '||n||'   (expect 1 — own row only)'||E'\n';

  ------------------------------- C: APPROVED AGAIN, BUT THIS AREA IS DRAFT
  set local role postgres;
  update public.profiles set is_approved = true where id = v_partner;
  update public.platform_topics set published = false where id = v_topic;
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_partner, 'role', 'authenticated')::text, true);
  select count(*) into n from public.get_platform_topics();        r := r||E'\n'||'C draft topics visible   = '||n||'   (expect total-1)'||E'\n';
  select count(*) into n from public.get_element(v_slug);          r := r||'C draft get_element      = '||n||'   (expect 0)'||E'\n';
  select count(*) into n from storage.objects o
    where o.bucket_id='resources'
      and o.name in (select storage_path from public.resources where element_id = v_elem);
                                                                   r := r||'C draft its objects      = '||n||'   (expect 0 — BYTE layer)'||E'\n';
  select count(*) into n from storage.objects where bucket_id='resources';
                                                                   r := r||'C draft all objects      = '||n||'   (expect total minus its files)'||E'\n';

  ---------------------------------------------------------------- D: ANON
  set local role anon;
  perform set_config('request.jwt.claims', null, true);
  begin select count(*) into n from public.get_platform_topics();
    r := r||E'\n'||'D anon topics            = *** '||n||' ***'||E'\n';
  exception when others then r := r||E'\n'||'D anon topics            = DENIED ('||sqlstate||')'||E'\n'; end;
  begin select count(*) into n from public.resources;
    r := r||'D anon resources table   = '||n||'   (expect 0 — RLS default-deny)'||E'\n';
  exception when others then r := r||'D anon resources table   = DENIED ('||sqlstate||')'||E'\n'; end;
  begin perform public.rls_auto_enable();
    r := r||'D anon rls_auto_enable   = *** STILL CALLABLE ***'||E'\n';
  exception when others then r := r||'D anon rls_auto_enable   = DENIED ('||sqlstate||')   [0034]'||E'\n'; end;

  set local role postgres;
  raise exception 'PROBE 1 — approval gate (aborted, nothing written):%', r;
end $probe1$;


-- =====================================================================
-- PROBE 2 — the four D-PP-i CHECK constraints, attacked by direct INSERT.
-- Every assertion names the constraint it EXPECTS, so a rejection by the
-- wrong one cannot score as a pass. The control insert must be ACCEPTED.
-- =====================================================================
do $probe2$
declare
  v_elem uuid; v_path text; r text := E'\n'; caught text;
begin
  select id into v_elem from public.elements order by code limit 1;
  select storage_path into v_path from public.resources
   where element_id = v_elem and doc_key is null limit 1;

  begin
    insert into public.resources (title,type,element_id,storage_bucket,storage_path,is_public,code,sort_order)
    values ('ATTACK 1','form',v_elem,'booklets','atk/1.docx',false,'T99',999);
    r := r||'1 private file -> other bucket    = *** ACCEPTED ***'||E'\n';
  exception when check_violation then get stacked diagnostics caught = constraint_name;
    r := r||'1 private file -> other bucket    = REJECTED by '||caught||
      case when caught='resources_private_bucket_shape' then '  [expected]' else '  *** WRONG CONSTRAINT ***' end||E'\n';
  end;

  begin
    insert into public.resources (title,type,element_id,storage_bucket,storage_path,is_public,code,sort_order)
    values ('ATTACK 2','form',null,'resources','atk/2.docx',false,'T99',999);
    r := r||'2 private file, no focus area     = *** ACCEPTED ***'||E'\n';
  exception when check_violation then get stacked diagnostics caught = constraint_name;
    r := r||'2 private file, no focus area     = REJECTED by '||caught||
      case when caught='resources_private_needs_element' then '  [expected]' else '  *** WRONG CONSTRAINT ***' end||E'\n';
  end;

  begin
    insert into public.resources (title,type,element_id,storage_bucket,storage_path,is_public,doc_key,sort_order)
    values ('ATTACK 3','guide',null,'resources','atk/3.docx',false,'guide',999);
    r := r||'3 guide file, no focus area       = *** ACCEPTED ***'||E'\n';
  exception when check_violation then get stacked diagnostics caught = constraint_name;
    r := r||'3 guide file, no focus area       = REJECTED by '||caught||
      case when caught in ('resources_guide_needs_element','resources_private_needs_element')
           then '  [expected]' else '  *** WRONG CONSTRAINT ***' end||E'\n';
  end;

  begin
    insert into public.resources (title,type,element_id,storage_bucket,storage_path,is_public,sort_order)
    values ('ATTACK 4','form',v_elem,'resources','atk/4.docx',false,999);
    r := r||'4 private file, unbadged          = *** ACCEPTED ***'||E'\n';
  exception when check_violation then get stacked diagnostics caught = constraint_name;
    r := r||'4 private file, unbadged          = REJECTED by '||caught||
      case when caught='resources_private_needs_code' then '  [expected]' else '  *** WRONG CONSTRAINT ***' end||E'\n';
  end;

  begin
    insert into public.resources (title,type,element_id,storage_bucket,storage_path,is_public,code,sort_order)
    values ('ATTACK 5','form',v_elem,'resources',v_path,false,'T98',999);
    r := r||'5 duplicate storage_path          = *** ACCEPTED ***'||E'\n';
  exception when unique_violation then get stacked diagnostics caught = constraint_name;
    r := r||'5 duplicate storage_path          = REJECTED by '||caught||'  [expected]'||E'\n';
  end;

  -- Without this, four rejections only prove the table rejects everything.
  begin
    insert into public.resources (title,type,element_id,storage_bucket,storage_path,is_public,code,sort_order)
    values ('CONTROL','form',v_elem,'resources','atk/ok.docx',false,'T99',999);
    r := r||'6 CONTROL legitimate template     = ACCEPTED  [correct]'||E'\n';
  exception when others then
    r := r||'6 CONTROL legitimate template     = *** REJECTED: '||sqlerrm||' ***'||E'\n';
  end;

  raise exception 'PROBE 2 — D-PP-i constraints (aborted, nothing written):%', r;
end $probe2$;


-- =====================================================================
-- PROBE 3 — the admin gate: approved is NOT admin.
-- Expect reads to return zero rows and writes to raise 42501.
-- =====================================================================
do $probe3$
declare v_partner uuid; r text := E'\n'; n int; b boolean;
begin
  select p.id into v_partner from public.profiles p
    left join public.admins a on a.user_id = p.id
   where p.is_approved and a.user_id is null limit 1;

  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_partner, 'role', 'authenticated')::text, true);

  select public.is_approved() into b; r := r||'is_approved() = '||b||E'\n';
  select public.is_admin()    into b; r := r||'is_admin()    = '||b||'   (must be false)'||E'\n\n';

  begin select count(*) into n from public.admin_list_applications();
    r := r||'admin_list_applications()   = '||n||' rows   (0 = fails closed)'||E'\n';
  exception when others then r := r||'admin_list_applications()   = REFUSED ('||sqlstate||')'||E'\n'; end;

  begin perform public.admin_upsert_element('x','9.9','x','x','x','x','x',1);
    r := r||'admin_upsert_element()      = *** ACCEPTED (WRITE!) ***'||E'\n';
  exception when others then r := r||'admin_upsert_element()      = REFUSED ('||sqlstate||')'||E'\n'; end;

  set local role postgres;
  raise exception 'PROBE 3 — admin gate (aborted, nothing written):%', r;
end $probe3$;


-- =====================================================================
-- PROBE 4 — `0034` did not break the safety net.
-- Creates a table and reads relrowsecurity back. Must be true.
-- =====================================================================
do $probe4$
declare rls boolean; r text := E'\n';
begin
  create table public.pp8_replay_probe (id int);
  select relrowsecurity into rls from pg_class where oid = 'public.pp8_replay_probe'::regclass;
  r := r||'new table relrowsecurity = '||rls||'   (MUST be true — ensure_rls fired)'||E'\n';
  drop table public.pp8_replay_probe;
  raise exception 'PROBE 4 — ensure_rls (aborted, nothing written):%', r;
end $probe4$;
