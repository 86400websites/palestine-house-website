-- 0030_content_v2_cutover.up.sql
-- PP6c · D-PP-k · 2026-08-16
--
-- Removes the legacy private platform now that the owner's real content has
-- replaced it: 297 template rows, 33 focus areas, 10 groups and the 33 elements
-- carrying the old guide bodies.
--
-- THIS IS THE FIRST DESTRUCTIVE MIGRATION IN THIS PROJECT. Read the four notes
-- below before running it anywhere.
--
-- ---------------------------------------------------------------------------
-- 1. IT DOES NOT DELETE STORAGE OBJECTS, AND MUST NOT
-- ---------------------------------------------------------------------------
-- Supabase's own guidance is explicit: "Deleting objects should always be done
-- via the Storage API and NOT via a SQL query. Deleting objects via a SQL query
-- will not remove the object from the bucket and will result in the object being
-- orphaned." A `delete from storage.objects` here would drop the metadata, leave
-- 5.3 MB of bytes stranded in the bucket, and report success.
--
-- So the 297 files are removed by a separate step, AFTER this migration:
--
--     pnpm exec tsx scripts/verify-archive.ts        # the cold backup is intact
--     -- apply THIS FILE                             # rows go first
--     pnpm exec tsx scripts/delete-297-objects.ts    # then the bytes
--
-- ⚠️ ROWS FIRST, OBJECTS SECOND — REVERSED AT PP7 (2026-08-16), AND THE OLD
--    ORDER'S STATED REASON WAS FALSE ON ITS OWN TERMS.
--
-- This file used to run LAST, on the argument that "this file deletes the rows
-- that carry the storage paths, so running it first would leave the deletion
-- script with nothing to work from." Grepped at PP7's kickoff, that is simply
-- not how the script works: `delete-297-objects.ts` never reads
-- `public.resources` at all. It derives the delete set from the Storage listing
-- and the 22 new focus-area slugs in `docs/content-v2-spec.json` — every object
-- whose top-level folder is not one of the 22. Emptying the table takes nothing
-- away from it.
--
-- With that reason gone, the independent review's argument decides the order,
-- and it is about which half-finished state you would rather be in:
--
--   objects first, then a failed migration  ->  297 LIVE rows pointing at files
--                                               that no longer exist. Every
--                                               affected partner gets a broken
--                                               download, and no retry fixes it.
--
--   rows first, then a failed deletion      ->  297 orphaned files nobody can
--                                               reach, costing 5.3 MB. Inert,
--                                               invisible, and the deletion is
--                                               simply re-run.
--
-- One is a user-visible failure that cannot be undone; the other is untidy.
-- Hence rows first. The deletion script now also refuses to start until it has
-- confirmed through the database that this migration has actually committed.
--
-- ---------------------------------------------------------------------------
-- 2. THE BACKUP IS THE ONLY WAY BACK FOR THE FILES
-- ---------------------------------------------------------------------------
-- `0030_content_v2_cutover.down.sql` restores every ROW deleted here, including
-- 1,577,163 characters of the owner's prose as literal inserts. It cannot
-- restore Storage objects. Those come from the cold backup verified at PP6c
-- step 6c-b: 297 objects · 5,320,962 bytes · fingerprint
-- 6fde792718130d12071b69459f9d70ab, in docs/source-assets/_archive-297-templates/.
--
-- ---------------------------------------------------------------------------
-- 3. WHAT IT DELETES THAT THE SPRINT'S TITLE DOES NOT MENTION (owner: A, 2026-08-16)
-- ---------------------------------------------------------------------------
-- `academy_modules`, `checklist_items` and `checklist_progress` all reference
-- `elements(id)` ON DELETE CASCADE, so removing the 33 elements would take them
-- with it silently. They are deleted EXPLICITLY below instead, so the loss is
-- visible in the migration rather than implied by a foreign key.
--
--   checklist_items     818 rows        academy_modules   33 rows
--   checklist_progress   15 rows
--
-- ⚠️ THE DOWN-MIGRATION DOES NOT RESTORE THESE 866 ROWS. Accepted deliberately:
-- `0029` already dropped `get_checklist` and `get_academy_modules`, so nothing in
-- the product can read any of them; PP7's `0033` drops all three tables outright
-- (this note said `0031`, which shipped instead as the `programming_sessions`
-- approval fix — corrected at PP7's kickoff, because a wrong migration number is
-- the map somebody reads during an incident); and the ROADMAP has recorded them
-- as retired since PP5. A rollback therefore restores a fully working platform
-- minus data that no surface reaches.
--
-- ---------------------------------------------------------------------------
-- 4. DELETION ORDER IS FORCED BY THE FOREIGN KEYS, NOT BY TASTE
-- ---------------------------------------------------------------------------
--   resources.element_id      -> elements   ON DELETE SET NULL   (!)
--   platform_topics.element_id-> elements   ON DELETE CASCADE
--   platform_topics.group_id  -> groups     ON DELETE RESTRICT   (!)
--   checklist_items.element_id-> elements   ON DELETE CASCADE
--   academy_modules.element_id-> elements   ON DELETE CASCADE
--
-- SET NULL is the trap: deleting elements first would not delete the 297
-- resource rows, it would orphan them with a null element_id — leaving rows that
-- point at files this sprint is about to remove. RESTRICT is the other: groups
-- cannot go before the topics filed under them. Hence
-- resources -> topics -> groups -> elements.
--
-- Legacy rows are identified by `elements.code` NOT starting with a digit: the
-- retired vocabulary is A1…K3, the new focus areas are 1.1…4.5. Verified
-- 2026-08-16 as a clean partition — 33 legacy, 22 new, no overlap possible.

begin;

-- ---------------------------------------------------------------------------
-- LOCKS FIRST (review round 4, H4). The guard below and the publication
-- re-check before COMMIT were both ordinary READ COMMITTED reads: a concurrent
-- CMS write could un-publish a topic after the guard saw it Live, commit while
-- this migration worked, and the re-check would still have passed against the
-- snapshot it took — leaving the legacy platform deleted with only 21 visible
-- replacements. EXCLUSIVE mode blocks every concurrent row modification on
-- these tables (including the SECURITY DEFINER admin RPCs) while still allowing
-- partners' SELECTs, and it is held until COMMIT, so what the guard proves
-- stays true for the lifetime of the transaction.
-- ---------------------------------------------------------------------------
lock table public.platform_topics  in exclusive mode;
lock table public.platform_groups  in exclusive mode;
lock table public.elements         in exclusive mode;
lock table public.resources        in exclusive mode;

-- ---------------------------------------------------------------------------
-- GUARD. Refuse to run unless the replacement is actually in place and visible.
-- Without this, applying 0030 to a database where the rollout has not run — or
-- has run but is still Draft — empties the platform for every approved partner.
--
-- ⚠️ REWRITTEN AT PP7 (2026-08-16). The original counted rows:
--
--     select count(*) ... where e.code ~ '^[0-9]' and t.published and g.published
--     if new_live <> 22 then raise exception ...
--
-- which asks "are there 22 live, published, numeric-coded focus areas?" and
-- accepts ANY 22. The independent review put a decoy to it and the decoy passed:
-- twenty-two rows with numeric codes and nothing else in common with the owner's
-- content would satisfy it exactly, and the migration would then delete the real
-- platform. **A count is not an identity.**
--
-- So the guard is now an exact, immutable manifest of the 22 focus areas, and
-- every one of them must be present, published, in the right section, carrying a
-- non-empty guide body, one guide file, and its own template count. All six
-- properties, per focus area, before a single row is deleted.
--
-- The manifest is GENERATED from `docs/content-v2-spec.json`, never typed —
-- and `scripts/verify-0030-guard.ts` re-parses it out of this file and asserts
-- it still matches the spec, so the two cannot drift.
-- ---------------------------------------------------------------------------

create temporary table _pp7_expected (
  code       text    primary key,
  slug       text    not null unique,
  group_slug text    not null,
  templates  integer not null,
  /* review round 4, H3: identity of the CONTENT, not only of the rows. A decoy
     with the right codes/slugs/counts and simple_guide_md = 'x' passed the
     previous manifest. guide_md5 pins each area's body to the owner's exact
     prose; tset_md5 pins the template inventory —
     md5(string_agg(upper(code)||'|'||title, E'
' order by upper(code))) over
     that area's private template rows. Both generated from
     docs/content-v2-spec.json and verified against the live corpus before being
     written here. */
  guide_md5  text    not null,
  tset_md5   text    not null
) on commit drop;

insert into _pp7_expected (code, slug, group_slug, templates, guide_md5, tset_md5) values
  ('1.1', 'get-legally-ready',                            'setup-focus-areas',    2, '2bb24d071beec6f379220a18da5f8a92', 'd3c3951027934d6fdb5f53bf4851c130'),
  ('1.2', 'plan-the-money',                               'setup-focus-areas',    5, '963b66217088fd5c191285a10234eed9', '780eff4ab6dadf731f9cf99cbefe21be'),
  ('1.3', 'find-and-prepare-the-space',                   'setup-focus-areas',    4, '5c21b18c71df52af169e2dee45325cbb', 'b2fda3b887d92db0fe23aea68b4bc3d3'),
  ('1.4', 'build-a-small-team',                           'setup-focus-areas',    5, '601efc6cfe7527652801ddce855e4524', '13c951be484167097440d8c201f0dccb'),
  ('1.5', 'get-ready-to-open',                            'setup-focus-areas',    4, '552e1c1429791b719ba0d8f89f57fee5', '5b4878b03574ca4195548b7aaaf8a98f'),
  ('2.1', 'money',                                        'operate-focus-areas',  5, '096112b44c24fba73b10010cb6c465b3', 'ebc621b2a836fb30435362d69251bc29'),
  ('2.2', 'daily-house-operations',                       'operate-focus-areas',  6, '995efd9dc7e47133b5cadbf635aebb21', '71ac749745d44fa9db20a3b088e6572e'),
  ('2.3', 'food-beverages',                               'operate-focus-areas',  6, '1dc7667d0166b3c45b8f843c7570d950', '9e62222a89ad465c800abc4e58ace1d7'),
  ('2.4', 'members-and-visitors',                         'operate-focus-areas',  5, '023a93709ef0c034605466c6379117bc', '1bc43162ce38b8260cbe6220b6d91c62'),
  ('2.5', 'team',                                         'operate-focus-areas',  4, '7f3a75e6cefbcfa3f68db20ac15fac30', '8a15b66aa143d6d2e49160e4e9113d8a'),
  ('2.6', 'monthly-check-up',                             'operate-focus-areas',  3, '6f3cc2998c8acbf8885a53c02ca886b3', '0e04fb1f8010292d9a591bbdf8ff4ee6'),
  ('3.1', 'plan-the-calendar',                            'program-focus-areas',  3, '51e70b30bdb843b94e8323f5a88f9bf9', '7179f8bc374313f7882771c10ec7717a'),
  ('3.2', 'plan-an-event',                                'program-focus-areas',  5, '21d904caf036df3d78b6f8ecc06e6fcb', 'f89f45e3656e92285f5a4678b7281ca6'),
  ('3.3', 'work-with-artists-and-speakers',               'program-focus-areas',  5, '3c9013d248aac68b86de317eeaf65645', '4d12efd787309a6b646f0b088cd02d44'),
  ('3.4', 'promote-the-event',                            'program-focus-areas',  4, '2e2b0959956373d687008530b0c3cd6b', '5afc364aeb292899365d6ac38f5cecf9'),
  ('3.5', 'learn-the-event',                              'program-focus-areas',  2, '31aba217ca1d811b0279bb5c9756a0e3', 'c6e7dcf155d5324cfe1d4d34b8497c84'),
  ('3.6', 'connect-to-the-wider-palestine-house-network', 'program-focus-areas',  4, 'b921d20443322bf3d3e694a86e2af0c6', '9b58f555daf55fe075f2827bd0115ac6'),
  ('4.1', 'marketing',                                    'support-focus-areas',  5, '8315ff1fb7497dc889852f65636bf5b9', 'bd076387e8555fe0619abe9b11435f65'),
  ('4.2', 'sponsorship-fundraising',                      'support-focus-areas',  5, '78cf84560cb78f258a1d53df726a8b5d', 'f8f6d04f64ac2a1244bca3b666d4daa8'),
  ('4.3', 'partnerships',                                 'support-focus-areas',  3, '01894167af4711801df9b81a73ae629a', '60a31c299617daf16632bf56c34bd587'),
  ('4.4', 'ask-community-support-for-help',               'support-focus-areas',  1, 'f633c7cbd62b2205eb92918fb034317d', '2283378f36e38a0b5430d39dfd22e93e'),
  ('4.5', 'learn-from-other-palestine-houses',            'support-focus-areas',  2, '6a69507177e5293038f5972e208fe808', '54f5fe93c781f70e7cf8c23addd4d77d');

do $guard$
declare
  n_expected integer;
  problems   text;
  n_problems integer;
  n_extra    integer;
  n_unbacked integer;
  detail     text;
begin
  select count(*) into n_expected from _pp7_expected;
  if n_expected <> 22 then
    raise exception '0030 guard: the manifest holds % focus areas, expected 22. The migration file has been edited.', n_expected;
  end if;

  /* Every expected focus area, checked on all six properties at once. A LEFT
     JOIN so a MISSING one is reported as missing rather than silently dropped
     from the result — the failure mode a plain INNER JOIN count would hide. */
  select string_agg(reason, E'\n  - ' order by code), count(*)
    into problems, n_problems
  from (
    select
      x.code,
      x.code || ' /' || x.slug || ' — ' ||
      case
        when t.id is null then 'absent, or its slug/code/section do not match the manifest'
        when not t.published then 'is a DRAFT'
        when not g.published then 'its section (' || x.group_slug || ') is unpublished'
        when coalesce(length(btrim(e.simple_guide_md)), 0) = 0 then 'has an empty guide body'
        /* H3: the body must be the owner's exact prose, not merely non-empty. */
        when md5(e.simple_guide_md) <> x.guide_md5 then 'guide body does not match the owner''s content (md5 mismatch)'
        when guides.n <> 1 then 'has ' || guides.n || ' guide file(s), expected exactly 1'
        when tpl.n <> x.templates then 'has ' || tpl.n || ' template(s), expected ' || x.templates
        /* H3: and the templates must be the owner's exact inventory. */
        when tpl.set_md5 is distinct from x.tset_md5 then 'template code/title set does not match the delivered inventory (md5 mismatch)'
      end as reason
    from _pp7_expected x
    left join public.elements e        on e.code = x.code
    left join public.platform_topics t on t.element_id = e.id and t.slug = x.slug
    left join public.platform_groups g on g.id = t.group_id and g.slug = x.group_slug
    left join lateral (
      select count(*) as n from public.resources r
      where r.element_id = e.id and r.doc_key = 'guide'
    ) guides on true
    left join lateral (
      select count(*) as n,
             md5(string_agg(upper(r.code) || '|' || r.title, E'\n' order by upper(r.code))) as set_md5
      from public.resources r
      where r.element_id = e.id
        and r.is_public = false and r.doc_key is null and r.code is not null
    ) tpl on true
  ) checked
  where reason is not null;

  /* And nothing numeric-coded that the manifest does not name. Without this a
     23rd new-looking focus area would pass unnoticed, and the 22-row count that
     the old guard relied on would have been satisfied by 22 of 23. */
  select count(*) into n_extra
  from public.elements e
  where e.code ~ '^[0-9]'
    and not exists (select 1 from _pp7_expected x where x.code = e.code);

  /* H3 (review round 4): every SURVIVING private resource row must point at an
     object that actually exists in Storage. Registered rows whose keys were
     never uploaded — the reviewer's fake-corpus counterexample — pass every
     count above, and the platform they leave behind serves broken downloads the
     moment the legacy rows are gone. This migration runs in the SQL Editor as
     postgres, so storage.objects is readable directly. */
  select count(*) into n_unbacked
  from public.resources r
  join public.elements e on e.id = r.element_id
  where e.code ~ '^[0-9]'
    and r.is_public = false
    and not exists (
      select 1 from storage.objects o
      where o.bucket_id = r.storage_bucket and o.name = r.storage_path
    );

  if n_problems > 0 or n_extra > 0 or n_unbacked > 0 then
    /* One placeholder, one assembled detail string. Adjacent %-placeholders do
       not exist in RAISE format strings — %% is always a LITERAL percent — so
       the previous multi-argument form would itself have errored at the moment
       of refusal (still aborting, but with "too many parameters" instead of the
       diagnosis). Found at review round 4 while extending this message. */
    detail :=
      case when n_problems > 0 then '  - ' || problems || E'\n' else '' end ||
      case when n_extra > 0 then '  - ' || n_extra || ' numeric-coded element(s) exist that the manifest does not name' || E'\n' else '' end ||
      case when n_unbacked > 0 then '  - ' || n_unbacked || ' surviving resource row(s) point at Storage objects that DO NOT EXIST' || E'\n' else '' end;
    raise exception E'REFUSING TO RUN — the replacement platform is not fully in place.\n\n0030 deletes the legacy platform, so all 22 new focus areas must be present, published and complete FIRST, or every approved partner is left with an empty platform.\n\n%\nRun the rollout and the cutover, then re-apply this migration.',
      detail;
  end if;

  raise notice '0030 guard: all 22 focus areas verified — identity, publication, guide-body md5, template-set md5, counts, and every surviving object present in Storage.';
end
$guard$;

-- ---------------------------------------------------------------------------
-- 1. checklist_progress — before checklist_items (see note 3)
-- ---------------------------------------------------------------------------
delete from public.checklist_progress
where checklist_item_id in (
  select ci.id from public.checklist_items ci
  join public.elements e on e.id = ci.element_id
  where e.code !~ '^[0-9]'
);

-- ---------------------------------------------------------------------------
-- 2. checklist_items (818) and academy_modules (33) — explicitly, not by cascade
-- ---------------------------------------------------------------------------
delete from public.checklist_items
where element_id in (select id from public.elements where code !~ '^[0-9]');

delete from public.academy_modules
where element_id in (select id from public.elements where code !~ '^[0-9]');

-- ---------------------------------------------------------------------------
-- 3. resources — the 297 legacy templates. BEFORE elements: the FK is SET NULL,
--    so doing this later would orphan them rather than delete them.
--    The two PUBLIC booklets are kept: they carry element_id IS NULL and
--    is_public = true, and are not part of the legacy focus-area content.
-- ---------------------------------------------------------------------------
delete from public.resources
where is_public = false
  and element_id in (select id from public.elements where code !~ '^[0-9]');

-- ---------------------------------------------------------------------------
-- 4. platform_topics (33) — before groups, whose FK is RESTRICT
-- ---------------------------------------------------------------------------
delete from public.platform_topics
where element_id in (select id from public.elements where code !~ '^[0-9]');

-- ---------------------------------------------------------------------------
-- 5. platform_groups (10) — the superseded groups, now empty
-- ---------------------------------------------------------------------------
delete from public.platform_groups
where slug not like '%-focus-areas';

-- ---------------------------------------------------------------------------
-- 6. elements (33) — the old guide bodies
-- ---------------------------------------------------------------------------
delete from public.elements where code !~ '^[0-9]';

-- ---------------------------------------------------------------------------
-- POST-CONDITIONS. Assert the end state inside the transaction, so anything
-- unexpected rolls the whole thing back rather than leaving a half-migrated
-- platform behind.
-- ---------------------------------------------------------------------------
do $check$
declare
  n_elements integer; n_topics integer; n_groups integer;
  n_templates integer; n_public integer; n_orphan integer;
  n_checklist integer; n_academy integer;
begin
  select count(*) into n_elements  from public.elements;
  select count(*) into n_topics    from public.platform_topics;
  select count(*) into n_groups    from public.platform_groups;
  select count(*) into n_templates from public.resources where is_public = false and doc_key is null and code is not null;
  select count(*) into n_public    from public.resources where is_public;
  select count(*) into n_orphan    from public.resources where element_id is null and is_public = false;
  select count(*) into n_checklist from public.checklist_items;
  select count(*) into n_academy   from public.academy_modules;

  if n_elements <> 22 then raise exception '0030: expected 22 elements, found %', n_elements; end if;
  if n_topics   <> 22 then raise exception '0030: expected 22 topics, found %', n_topics; end if;
  if n_groups   <> 4  then raise exception '0030: expected 4 groups, found %', n_groups; end if;
  if n_templates<> 88 then raise exception '0030: expected 88 template rows, found %', n_templates; end if;
  if n_public   <> 2  then raise exception '0030: the 2 public booklets must survive, found %', n_public; end if;
  if n_orphan   <> 0  then raise exception '0030: % private resource row(s) left with a null element — the SET NULL trap fired', n_orphan; end if;
  if n_checklist<> 0  then raise exception '0030: expected 0 checklist_items, found %', n_checklist; end if;
  if n_academy  <> 0  then raise exception '0030: expected 0 academy_modules, found %', n_academy; end if;

  raise notice '0030 OK — 22 elements · 22 topics · 4 groups · 88 templates · 2 public booklets kept · 0 orphans';
end
$check$;

-- ---------------------------------------------------------------------------
-- PUBLICATION RE-CHECK, IMMEDIATELY BEFORE COMMIT (PP7).
--
-- The guard at the top ran before the deletions. Everything between then and
-- here is a window: an admin using the CMS, a `cutover.ts --to draft`, or a
-- half-finished script in another session can un-publish a focus area while this
-- transaction is working, and under READ COMMITTED this statement will see it.
--
-- The window is small and the consequence is not. Committing after the legacy
-- platform is gone AND the replacement has gone dark leaves every approved
-- partner with an empty platform and no automatic way back — the down-migration
-- restores rows, but the operator has to know to run it.
--
-- So the last thing this transaction does before committing is ask again.
-- Failing here rolls the whole migration back, which is the cheap outcome.
-- ---------------------------------------------------------------------------
do $recheck$
declare
  n_live integer;
  n_dark integer;
begin
  select
    count(*) filter (where t.published and g.published),
    count(*) filter (where not (t.published and g.published))
  into n_live, n_dark
  from public.platform_topics t
  join public.platform_groups g on g.id = t.group_id;

  if n_live <> 22 or n_dark <> 0 then
    raise exception
      'REFUSING TO COMMIT: % of 22 focus areas are live and % are dark at the end of this migration. Something un-published content while 0030 was running. Nothing has been deleted — the transaction is rolled back. Re-publish, then re-apply.',
      n_live, n_dark;
  end if;

  raise notice '0030 re-check: all 22 focus areas still live at commit time.';
end
$recheck$;

commit;

-- AFTER COMMITTING, THE BYTES ARE STILL THERE. That is the design (note 1), and
-- it is the safe half of the split: 297 files nobody can reach, because the rows
-- that named them are gone. Finish the job:
--
--   pnpm exec tsx scripts/delete-297-objects.ts --dry-run
--   pnpm exec tsx scripts/delete-297-objects.ts
--
-- It re-verifies the cold archive from disk, then confirms through the database
-- that THIS MIGRATION has committed, and refuses to delete a single object
-- otherwise. Then check the bucket is down to the 110 new objects:
--
--   select count(*) from storage.objects where bucket_id = 'resources';   -- 110
--
-- If it still reports 407, the deletion has not been run and 297 orphaned files
-- are consuming space with no row pointing at them. Untidy, not urgent, and
-- retryable — which is exactly why the rows go first.
