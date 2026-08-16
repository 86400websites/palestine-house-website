-- PP7_finalize_prod.sql — GENERATED BUNDLE, DO NOT HAND-EDIT.
-- One paste: migration 0030 (delete the legacy rows) then migration 0033 (the
-- contraction). Each is its own begin/commit transaction with its own guards;
-- if 0030 refuses, 0033's first guard (legacy elements still present)
-- refuses too, so a partial paste cannot half-run.
-- Source fingerprints at generation time:
--   0030_content_v2_cutover.up.sql  md5 8f1ee7f240a9ccbad47d47476da7395b
--   0033_contraction.up.sql         md5 c8f753f2a70b43876ba17661f8d5e4e8

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
/* Round 5, H4: Storage writes are ROWS IN storage.objects, so an admin upload,
   replace or delete during this transaction would bypass the four locks above.
   EXCLUSIVE here blocks every concurrent storage.objects write (the Storage API
   blocks until COMMIT) while plain reads continue. The migration runs seconds. */
lock table storage.objects         in exclusive mode;

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
  /* Round 4 H3 pinned the guide markdown and the template code|title set.
     Round 5 H3 pins EVERYTHING a partner sees or downloads:
       title      — platform_topics.title, compared directly;
       desc_md5   — md5(platform_topics.description), the card sentence;
       intro_md5  — md5(platform_topics.intro), the See More body;
       guide_md5  — md5(elements.simple_guide_md), the reader body;
       tset_md5   — md5 of the sorted template code|title set;
       files_md5  — md5 of the SORTED per-file byte-md5s (guide + templates),
                    compared against storage.objects eTags, so one byte of
                    garbage at any registered key refuses the migration.
     All generated from docs/content-v2-spec.json (which now carries per-file
     md5s computed from the delivered documents) and verified against the live
     corpus before being written here. */
  title      text    not null,
  desc_md5   text    not null,
  intro_md5  text    not null,
  guide_md5  text    not null,
  tset_md5   text    not null,
  files_md5  text    not null
) on commit drop;

insert into _pp7_expected (code, slug, group_slug, templates, title, desc_md5, intro_md5, guide_md5, tset_md5, files_md5) values
  ('1.1', 'get-legally-ready', 'setup-focus-areas', 2, 'Get Legally Ready', 'f7ac673142391a3638c9e8c21f241bca', '3c387acbb80adff94f997c6ec03d6ffa', '2bb24d071beec6f379220a18da5f8a92', 'd3c3951027934d6fdb5f53bf4851c130', 'd0871f35b0bd8ad3b8bc50a18c5ab44f'),
  ('1.2', 'plan-the-money', 'setup-focus-areas', 5, 'Plan the Money', '2317b1b311a923cb5f22ff1ab41db00c', 'ca794cc0bb991e1a257cb8f5c4828c5d', '963b66217088fd5c191285a10234eed9', '780eff4ab6dadf731f9cf99cbefe21be', '041b4a8afc6e4d6cd16feb5f8c01a46f'),
  ('1.3', 'find-and-prepare-the-space', 'setup-focus-areas', 4, 'Find and Prepare the Space', 'e2de364568402a6f88fbcc0fc0831789', '0091a81456119c98456102b30e80c698', '5c21b18c71df52af169e2dee45325cbb', 'b2fda3b887d92db0fe23aea68b4bc3d3', '8fd2456e76c96e2bb54a4bdb5201072f'),
  ('1.4', 'build-a-small-team', 'setup-focus-areas', 5, 'Build a Small Team', '89e4bb5126c833a5bd0942cc63c532c4', '0ea52d36eeea23a566c44a316aa107ca', '601efc6cfe7527652801ddce855e4524', '13c951be484167097440d8c201f0dccb', '0ff90031d7f30e5c9e38faab2d8bdc6e'),
  ('1.5', 'get-ready-to-open', 'setup-focus-areas', 4, 'Get Ready To Open', '0761c8b1537fe2e71bc100fa2d86c411', '989abb6aadeffbfc5736551c0cf4daa6', '552e1c1429791b719ba0d8f89f57fee5', '5b4878b03574ca4195548b7aaaf8a98f', 'd3b272809975738f0b24b9790f152371'),
  ('2.1', 'money', 'operate-focus-areas', 5, 'Money', '4d2cbf6c0393e5997dadc24e50b33ed4', 'e8673da8b4e55f02ea314b274bd20507', '096112b44c24fba73b10010cb6c465b3', 'ebc621b2a836fb30435362d69251bc29', 'c20873b2ee09fe49d71da858cf018516'),
  ('2.2', 'daily-house-operations', 'operate-focus-areas', 6, 'Daily House Operations', '56bf538750516d273e31e05da1fc3192', '70353494fb611ef06abcc3374342fd82', '995efd9dc7e47133b5cadbf635aebb21', '71ac749745d44fa9db20a3b088e6572e', '08620a22f14b698087f4afff454037b3'),
  ('2.3', 'food-beverages', 'operate-focus-areas', 6, 'Food & Beverages', '30204fbb3874641fd355956e94ca1089', '1ab17ebfe65dd5bb53eda3cf51d59d39', '1dc7667d0166b3c45b8f843c7570d950', '9e62222a89ad465c800abc4e58ace1d7', '669bdc590a84f47751a60d53b5d318c4'),
  ('2.4', 'members-and-visitors', 'operate-focus-areas', 5, 'Members and Visitors', 'def6a7bd2e62c514bcaaebd5accb1976', '41c757d66141fdb28f447f3a8b73e699', '023a93709ef0c034605466c6379117bc', '1bc43162ce38b8260cbe6220b6d91c62', 'cfc784c60e4071cce8ed3fb662c06efd'),
  ('2.5', 'team', 'operate-focus-areas', 4, 'Team', '48907f06106e13dafee73991684e4f18', '4272dadca6cf7a5f5b9511968992adc7', '7f3a75e6cefbcfa3f68db20ac15fac30', '8a15b66aa143d6d2e49160e4e9113d8a', '1fdd720d58aea354429bb11ae5179a41'),
  ('2.6', 'monthly-check-up', 'operate-focus-areas', 3, 'Monthly Check-Up', '5708e60ee43dbb7c87a80aa0ad271e29', 'b0d7c426d93707a1cd26895ff75e1b03', '6f3cc2998c8acbf8885a53c02ca886b3', '0e04fb1f8010292d9a591bbdf8ff4ee6', '5f2436d9a5e034bff5ecbc9fe8bb45a5'),
  ('3.1', 'plan-the-calendar', 'program-focus-areas', 3, 'Plan the Calendar', '040f63ac4051d60ed049e6696d4aad72', '17db81c134f17cd328994663c8a56b3a', '51e70b30bdb843b94e8323f5a88f9bf9', '7179f8bc374313f7882771c10ec7717a', '8e8e6466652915fc384a3716e5907ea3'),
  ('3.2', 'plan-an-event', 'program-focus-areas', 5, 'Plan an Event', 'd2cf875ee411277b08c7dc0f15988937', '4790e8a42998a93ec8d07c5493689e15', '21d904caf036df3d78b6f8ecc06e6fcb', 'f89f45e3656e92285f5a4678b7281ca6', 'a41d5a0fc9730c86c74e98c6addf7a01'),
  ('3.3', 'work-with-artists-and-speakers', 'program-focus-areas', 5, 'Work with Artists and Speakers', 'ce9f667c9afa3bfd267d0e7d401972fa', '53752ac5a42623dde85324e5738f7996', '3c9013d248aac68b86de317eeaf65645', '4d12efd787309a6b646f0b088cd02d44', '9165e4eeb3218012e4e3e954e1081ee5'),
  ('3.4', 'promote-the-event', 'program-focus-areas', 4, 'Promote the Event', 'cd8d06740bdc90a3db75652ab0cfbd84', '1a8f7793fe6fa682beb097c703a68330', '2e2b0959956373d687008530b0c3cd6b', '5afc364aeb292899365d6ac38f5cecf9', 'ba7cc35a25547d81595c62ab00c259d8'),
  ('3.5', 'learn-the-event', 'program-focus-areas', 2, 'Learn the Event', 'dff6a8e046620d4059cfb4c831390364', '7ce993d1c4258c8e57dcc8a2bc7cd0e5', '31aba217ca1d811b0279bb5c9756a0e3', 'c6e7dcf155d5324cfe1d4d34b8497c84', '04f5419c425cb5ca9e836e0cf5fcd703'),
  ('3.6', 'connect-to-the-wider-palestine-house-network', 'program-focus-areas', 4, 'Connect to the Wider Palestine House Network', '7a8ae69560fad1d1caf3c04fbffb2893', 'ed6097d4bd53bef5f3dd186a819a6f4f', 'b921d20443322bf3d3e694a86e2af0c6', '9b58f555daf55fe075f2827bd0115ac6', 'a11fd485f94fd5579d8521b1c2b2a849'),
  ('4.1', 'marketing', 'support-focus-areas', 5, 'Marketing', '1c86d5860a9109725c97890fa6525de2', 'ceef8b523759eb644faceb919ae8017f', '8315ff1fb7497dc889852f65636bf5b9', 'bd076387e8555fe0619abe9b11435f65', 'ab51276c481cd86f986c7a1fac30b4c6'),
  ('4.2', 'sponsorship-fundraising', 'support-focus-areas', 5, 'Sponsorship & Fundraising', 'f238bae9770de0c8c698626ed76f0a8f', '846988eb83acafd68d071705d725f01c', '78cf84560cb78f258a1d53df726a8b5d', 'f8f6d04f64ac2a1244bca3b666d4daa8', '1fca85600ba14813f152e8742270bc7e'),
  ('4.3', 'partnerships', 'support-focus-areas', 3, 'Partnerships', '01403942759f08d8cfa54a32e505ce58', '9e5450ddb42f606bed65efa6c909f9c0', '01894167af4711801df9b81a73ae629a', '60a31c299617daf16632bf56c34bd587', 'bdd44375d6ad2fcab7b70677a708e16a'),
  ('4.4', 'ask-community-support-for-help', 'support-focus-areas', 1, 'Ask Community Support for Help', '0a490dbf38241f67bf4836e5439f4291', '6a27a429b7af14d6164d979216b880f2', 'f633c7cbd62b2205eb92918fb034317d', '2283378f36e38a0b5430d39dfd22e93e', '47abe93800870da39a68e4a7e28d4001'),
  ('4.5', 'learn-from-other-palestine-houses', 'support-focus-areas', 2, 'Learn from Other Palestine Houses', '5df7f68a425e7b93c87feff594e834f6', '7d5abe53ee76b99aa144e3360dcb61b7', '6a69507177e5293038f5972e208fe808', '54f5fe93c781f70e7cf8c23addd4d77d', '50930c86385fd44751d2108419afd3ff');

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
        /* Round 5, H3: everything else a partner sees. */
        when t.title <> x.title then 'topic title does not match the delivered content'
        when md5(coalesce(t.description, '')) <> x.desc_md5 then 'card description does not match the Overview''s opening sentence (md5 mismatch)'
        when md5(coalesce(t.intro, '')) <> x.intro_md5 then 'See More body does not match the Overview''s remainder (md5 mismatch)'
        /* Round 5, H3: the BYTES. objs.files_md5 aggregates the eTags of every
           object this area's surviving rows point at — Storage single-part
           eTags are the md5 of the bytes — and the manifest value was computed
           from the delivered documents on disk. One byte of garbage at any
           registered key, a swapped file, a truncated upload: all refuse here. */
        when objs.files_md5 is distinct from x.files_md5 then 'stored file BYTES do not match the delivered documents (eTag-set md5 mismatch)'
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
    left join lateral (
      /* The byte pin: aggregate the eTags of the objects this area's surviving
         rows actually reference (guide + templates), sorted — the same formula
         the spec side computes from the delivered files on disk. Missing
         objects drop out of the join and change the aggregate, so absence and
         corruption both land here. */
      select md5(string_agg(replace(o.metadata->>'eTag', '"', ''), E'\n'
                            order by replace(o.metadata->>'eTag', '"', ''))) as files_md5
      from public.resources r
      join storage.objects o on o.bucket_id = r.storage_bucket and o.name = r.storage_path
      where r.element_id = e.id and r.is_public = false
    ) objs on true
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
  n_live     integer;
  n_dark     integer;
  n_unbacked integer;
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

  /* Round 5, H4: repeat the object-existence assertion immediately before
     COMMIT. storage.objects is locked EXCLUSIVE at the top of this transaction,
     so nothing can have changed — this line is what turns that claim into a
     checked fact rather than an argument about lock semantics. */
  select count(*) into n_unbacked
  from public.resources r
  where r.is_public = false
    and not exists (
      select 1 from storage.objects o
      where o.bucket_id = r.storage_bucket and o.name = r.storage_path
    );
  if n_unbacked > 0 then
    raise exception
      'REFUSING TO COMMIT: % surviving resource row(s) point at Storage objects that no longer exist. The transaction is rolled back; nothing has been deleted.',
      n_unbacked;
  end if;

  raise notice '0030 re-check: all 22 focus areas still live and every object still present at commit time.';
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


-- ====== 0033 follows ======

-- 0033_contraction.up.sql
-- PP7 step 7-k · 2026-08-16
--
-- THE CONTRACTION. Removes the retired surfaces' last remains from the schema:
-- three empty tables, seven dead RPCs, four policies on an unreachable table,
-- and two columns on `elements` that no surface renders.
--
-- Moved here from PP8 by the owner (2026-08-16). It is hygiene on things that
-- are already dead: `0030` emptied all three tables, `0029` already dropped
-- their read RPCs, and the ROADMAP has recorded the surfaces as retired since
-- PP5. Nothing a partner can perceive changes.
--
-- ===========================================================================
-- ⚠️  READ THIS FIRST: 0033 ADDS A STEP TO 0030's ROLLBACK — IT DOES NOT END IT
-- ===========================================================================
-- `0030_content_v2_cutover.down.sql` names `overview_md` and `watch_out_for_md`
-- in every element insert, so it cannot run while those columns are dropped.
-- **But `0033_contraction.down.sql` restores them** (columns, tables, policies
-- and all seven retired RPCs), after which 0030's rollback runs normally. This
-- exact order — 0033.down, then restore the objects, then 0030.down — was
-- EXECUTED END TO END in the PP7 rehearsal (2026-08-16) and the legacy prose
-- came back byte-perfect. An earlier version of this header called 0033 "the
-- point of no return"; review round 5 correctly called that wrong, and it
-- mattered: an emergency operator could have abandoned a viable rollback.
-- The rollback after 0033 is three steps instead of two, all rehearsed.
--
-- Measured 2026-08-16:
--   PRODUCTION  33 elements, all 33 carrying BOTH columns —
--               272,158 chars of overview + 674,982 of watch-out = 947,140
--               characters of the owner's prose.
--   TEST        22 elements (post-0030), 0 carrying either. Nothing to lose.
--
-- So the order on production is load-bearing, and it is not a matter of taste:
--
--     0030  ->  delete-297-objects  ->  verify  ->  LIVE FOR A WHILE  ->  0033
--
-- Do not apply this until the new platform has been live long enough that
-- rolling `0030` back is no longer a plan you would consider. The guard below
-- refuses if the legacy platform is still present, and refuses again if ANY
-- element still holds content in either column — so it cannot destroy the
-- owner's prose by being run early or out of order. But it cannot protect you
-- from applying it deliberately and changing your mind next week.
--
-- ---------------------------------------------------------------------------
-- WHY THE FUNCTIONS ARE DROPPED AND RECREATED RATHER THAN REPLACED
-- ---------------------------------------------------------------------------
-- The plan said `CREATE OR REPLACE` the element RPCs without the columns before
-- the `DROP COLUMN`. That would fail: PostgreSQL refuses to change the OUT
-- parameters of an existing function ("cannot change return type of existing
-- function"), and `admin_upsert_element` additionally changes arity, which
-- creates an overload rather than replacing anything. So each is DROPped and
-- recreated. Inside this transaction there is no window in which a caller sees
-- a missing function.
--
-- Checked before writing: no application code calls `admin_upsert_element` or
-- `admin_list_elements`; `admin_get_element` is called by
-- /admin/content/focus-areas and reads only `simple_guide_md`; `get_element` is
-- called by the guide reader and reads only `simple_guide_md` and `title`.
-- `scripts/generate-0030-down.ts` calls `admin_list_elements` and reads only
-- id/slug/code. Dropping the two columns from these four signatures therefore
-- breaks nothing.

begin;

-- ---------------------------------------------------------------------------
-- LOCKS FIRST (review round 5, M3). The emptiness and empty-column checks below
-- were ordinary reads: an admin could insert an academy row, or an in-flight
-- old-signature admin_upsert_element could write overview_md, between the check
-- and the drop — and the drop destroys what the check never saw. EXCLUSIVE on
-- all four blocks every concurrent write until COMMIT while reads continue.
-- ---------------------------------------------------------------------------
lock table public.elements           in exclusive mode;
lock table public.checklist_items    in exclusive mode;
lock table public.checklist_progress in exclusive mode;
lock table public.academy_modules    in exclusive mode;

-- ---------------------------------------------------------------------------
-- GUARD. Three independent refusals, any of which stops the whole migration.
-- ---------------------------------------------------------------------------
do $guard$
declare
  n_legacy   integer;
  n_content  integer;
  n_chars    bigint;
  n_rows     integer;
begin
  select count(*) into n_legacy from public.elements where code !~ '^[0-9]';
  if n_legacy > 0 then
    raise exception
      'REFUSING: % legacy element(s) are still present, so migration 0030 has not been applied. Running 0033 now would drop overview_md and watch_out_for_md while they still hold the owner''s prose — and would also make 0030''s rollback unrunnable, because its inserts name both columns. Apply 0030 first.',
      n_legacy;
  end if;

  select
    count(*) filter (where coalesce(btrim(overview_md), '') <> ''
                        or coalesce(btrim(watch_out_for_md), '') <> ''),
    coalesce(sum(length(coalesce(overview_md, '')) + length(coalesce(watch_out_for_md, ''))), 0)
  into n_content, n_chars
  from public.elements;

  if n_content > 0 then
    raise exception
      'REFUSING: % element(s) still hold content in overview_md or watch_out_for_md (% characters). This migration DROPS those columns and nothing restores them. If the content is genuinely finished with, clear it deliberately first; if it is not, do not run this migration.',
      n_content, n_chars;
  end if;

  /* review round 4, M3: the three tables were ASSUMED empty because 0030
     emptied them — but 0033 is deliberately applied days later, and in that
     window `admin_upsert_academy_module` still exists and still writes. A row
     added in the gap would be dropped silently, and the down-migration restores
     structure, never rows. So emptiness is asserted, not assumed. */
  select (select count(*) from public.checklist_items)
       + (select count(*) from public.checklist_progress)
       + (select count(*) from public.academy_modules)
  into n_rows;
  if n_rows > 0 then
    raise exception
      'REFUSING: the retired tables hold % row(s). 0030 emptied them, so something has written in the window since — an admin RPC for these tables still exists until this migration removes it. Inspect and clear the rows deliberately, then re-apply.',
      n_rows;
  end if;

  raise notice '0033 guard: 0 legacy elements, 0 characters in the doomed columns, 0 rows in the doomed tables.';
end
$guard$;

-- ---------------------------------------------------------------------------
-- 1. THE FOUR ELEMENT FUNCTIONS, WITHOUT THE TWO COLUMNS.
--    Done BEFORE the DROP COLUMN, or the drop fails on the dependency.
-- ---------------------------------------------------------------------------

-- 1a. get_element — the partner-facing read (0011). Approval-gated, and gated
--     again on the topic and its group being published.
drop function if exists public.get_element(text);
create function public.get_element(p_slug text)
returns table (
  id              uuid,
  slug            text,
  code            text,
  focus_area_code text,
  focus_area_name text,
  title           text,
  one_line        text,
  simple_guide_md text,
  sort_order      integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name, e.title,
         e.one_line, e.simple_guide_md, e.sort_order
  from public.elements e
  where e.slug = p_slug and public.is_approved()
    and exists (select 1 from public.platform_topics t
                join public.platform_groups g on g.id = t.group_id
                where t.element_id = e.id and t.published and g.published);
$$;
revoke execute on function public.get_element(text) from public, anon;
grant  execute on function public.get_element(text) to authenticated;

-- 1b. admin_list_elements — the admin index (0023). `has_overview` and
--     `has_watch_out_for` go with the columns they described.
drop function if exists public.admin_list_elements();
create function public.admin_list_elements()
returns table (
  id               uuid,
  slug             text,
  code             text,
  focus_area_code  text,
  focus_area_name  text,
  title            text,
  one_line         text,
  sort_order       integer,
  has_simple_guide boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.sort_order,
         (e.simple_guide_md is not null and btrim(e.simple_guide_md) <> '')
  from public.elements e
  where public.is_admin()
  order by e.focus_area_code, e.sort_order, e.code;
$$;
revoke execute on function public.admin_list_elements() from public, anon;
grant  execute on function public.admin_list_elements() to authenticated;

-- 1c. admin_get_element — one element with its body, for editing (0023).
drop function if exists public.admin_get_element(text);
create function public.admin_get_element(p_slug text)
returns table (
  id              uuid,
  slug            text,
  code            text,
  focus_area_code text,
  focus_area_name text,
  title           text,
  one_line        text,
  simple_guide_md text,
  sort_order      integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select e.id, e.slug, e.code, e.focus_area_code, e.focus_area_name,
         e.title, e.one_line, e.simple_guide_md, e.sort_order
  from public.elements e
  where e.slug = p_slug and public.is_admin();
$$;
revoke execute on function public.admin_get_element(text) from public, anon;
grant  execute on function public.admin_get_element(text) to authenticated;

-- 1d. admin_upsert_element — the admin write (0026), minus two parameters.
--     Arity 10 -> 8, so the old signature is dropped explicitly rather than
--     left behind as an overload that still writes to columns that are gone.
drop function if exists public.admin_upsert_element(text, text, text, text, text, text, text, text, text, integer);
create function public.admin_upsert_element(
  p_slug            text,
  p_code            text,
  p_focus_area_code text,
  p_focus_area_name text,
  p_title           text,
  p_one_line        text    default null,
  p_simple_guide_md text    default null,
  p_sort_order      integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug  text := lower(btrim(coalesce(p_slug, '')));
  v_code  text := nullif(btrim(coalesce(p_code, '')), '');
  v_fac   text := nullif(upper(btrim(coalesce(p_focus_area_code, ''))), '');
  v_fan   text := nullif(btrim(coalesce(p_focus_area_name, '')), '');
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_id    uuid;
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_slug) > 80 then
    raise exception 'invalid slug' using errcode = '22023';
  end if;
  if v_fac is not null and v_fac !~ '^[A-K]$' then
    raise exception 'invalid focus area' using errcode = '22023';
  end if;
  if v_code is null or v_title is null then
    raise exception 'code and title are required' using errcode = '22023';
  end if;

  insert into public.elements (slug, code, focus_area_code, focus_area_name, title, one_line, simple_guide_md, sort_order)
  values (
    v_slug, left(v_code, 16), v_fac, left(v_fan, 120), left(v_title, 200),
    nullif(btrim(coalesce(p_one_line, '')), ''),
    (case when btrim(coalesce(p_simple_guide_md, '')) = '' then null else left(p_simple_guide_md, 100000) end),
    coalesce(p_sort_order, 0)
  )
  on conflict (slug) do update set
    code = excluded.code, focus_area_code = excluded.focus_area_code,
    focus_area_name = excluded.focus_area_name, title = excluded.title,
    one_line = excluded.one_line, simple_guide_md = excluded.simple_guide_md,
    sort_order = excluded.sort_order, updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.admin_upsert_element(text, text, text, text, text, text, text, integer) from public, anon;
grant  execute on function public.admin_upsert_element(text, text, text, text, text, text, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. THE DEAD RPCs. `0029` already dropped the retired READ paths; these are
--    the writes and the admin surface that outlived them.
-- ---------------------------------------------------------------------------
drop function if exists public.set_checklist_progress(uuid, text, text);

drop function if exists public.admin_list_academy_modules();
drop function if exists public.admin_get_academy_module(uuid);
drop function if exists public.admin_upsert_academy_module(uuid, text, text, text, text, text, integer);
drop function if exists public.admin_delete_academy_module(uuid);

-- The Live hub went at PP5 (D-PP-b, owner: `/live` dropped entirely).
drop function if exists public.member_programming_sessions();
drop function if exists public.publish_programming_session(text, text, uuid, text, text, text, text, timestamptz);

-- ---------------------------------------------------------------------------
-- 3. `programming_sessions` POLICIES. The table and its rows are KEPT — the
--    owner's decision at D-PP-b was that the data stays — but with the RPCs
--    gone nothing should reach it. RLS stays enabled with zero policies, which
--    is default-deny: unreachable rather than deleted.
-- ---------------------------------------------------------------------------
drop policy if exists programming_sessions_select_own on public.programming_sessions;
drop policy if exists programming_sessions_insert_own on public.programming_sessions;
drop policy if exists programming_sessions_update_own on public.programming_sessions;
drop policy if exists programming_sessions_delete_own on public.programming_sessions;

-- ---------------------------------------------------------------------------
-- 4. THE THREE EMPTY TABLES. `checklist_progress` first: it carries the only
--    foreign key into `checklist_items`.
-- ---------------------------------------------------------------------------
drop table if exists public.checklist_progress;
drop table if exists public.checklist_items;
drop table if exists public.academy_modules;

-- ---------------------------------------------------------------------------
-- 5. THE TWO COLUMNS. The guard above proved both are empty on every row.
--    `overview_md` — the Overview card was removed at D-PP-f and the column is
--    rendered on no surface. `watch_out_for_md` — no consumer since PP5; the
--    owner confirmed at PP7 that it goes.
-- ---------------------------------------------------------------------------
alter table public.elements
  drop column if exists overview_md,
  drop column if exists watch_out_for_md;

-- ---------------------------------------------------------------------------
-- POST-CONDITIONS, inside the transaction.
-- ---------------------------------------------------------------------------
do $check$
declare
  n_tables  integer;
  n_funcs   integer;
  n_cols    integer;
  n_pol     integer;
  n_elems   integer;
begin
  select count(*) into n_tables from information_schema.tables
   where table_schema = 'public'
     and table_name in ('checklist_items', 'checklist_progress', 'academy_modules');

  select count(*) into n_funcs from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname in ('set_checklist_progress', 'admin_list_academy_modules',
                     'admin_get_academy_module', 'admin_upsert_academy_module',
                     'admin_delete_academy_module', 'member_programming_sessions',
                     'publish_programming_session');

  select count(*) into n_cols from information_schema.columns
   where table_schema = 'public' and table_name = 'elements'
     and column_name in ('overview_md', 'watch_out_for_md');

  select count(*) into n_pol from pg_policy p
   join pg_class c on c.oid = p.polrelid
   where c.relname = 'programming_sessions';

  select count(*) into n_elems from public.elements;

  if n_tables <> 0 then raise exception '0033: % retired table(s) survive', n_tables; end if;
  if n_funcs  <> 0 then raise exception '0033: % retired function(s) survive', n_funcs; end if;
  if n_cols   <> 0 then raise exception '0033: % dropped column(s) survive', n_cols; end if;
  if n_pol    <> 0 then raise exception '0033: % programming_sessions policy(ies) survive', n_pol; end if;
  if n_elems  <> 22 then raise exception '0033: expected 22 elements, found %', n_elems; end if;

  raise notice '0033 OK — 3 tables, 7 functions, 4 policies and 2 columns removed; 22 elements intact.';
end
$check$;

commit;

-- Verify afterwards:
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='elements' order by column_name;
--   -- no overview_md, no watch_out_for_md
--
--   select count(*) from pg_policy p join pg_class c on c.oid=p.polrelid
--    where c.relname='programming_sessions';                      -- 0
--
--   select proname, pronargs from pg_proc
--    where pronamespace='public'::regnamespace and proname like '%element%'
--    order by proname;
--   -- admin_get_element/1 · admin_list_elements/0 · admin_upsert_element/8 · get_element/1
