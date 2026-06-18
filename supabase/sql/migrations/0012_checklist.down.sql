-- 0012_checklist.down.sql — reverses 0012_checklist.up.sql.
-- Drop the RPCs, then the owner policy, then the tables (progress before items,
-- since checklist_progress references checklist_items).

drop function if exists public.set_checklist_progress(uuid, text, text);
drop function if exists public.get_checklist();
drop policy if exists checklist_progress_select_own on public.checklist_progress;
drop table if exists public.checklist_progress;
drop table if exists public.checklist_items;
