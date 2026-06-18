-- 0014_resources.up.sql
-- S5 (5d): the Resources hub metadata + the Storage buckets behind it.
--
-- resources holds one row per downloadable file: the 267 templates (gated) and
-- the 2 booklets (public). Like the other content tables it is RLS default-deny
-- with NO client policy — metadata is read only through the is_approved()-gated
-- get_resources() RPC. Raw storage paths are never returned to the client; the
-- download action (signed URL for templates, public URL for booklets) is S6e.
--
-- Two buckets, created here as reviewable SQL (files are uploaded by the
-- one-time ingestion, S5 step 6, using the service key):
--   * resources (PRIVATE) — the 267 templates. No storage.objects policy is
--     added, so default-deny holds: only the server (service key) uploads, and
--     approved downloads are SERVER-ISSUED signed URLs (TECH-ARCHITECTURE §0).
--     Clients never read storage.objects directly.
--   * booklets (PUBLIC) — the two booklet PDFs, the only public files. public =
--     true serves them via the public URL (footer lead magnets + the hub);
--     uploads still require the service key (no insert policy).
--
-- The (storage_bucket, storage_path) natural key lets the ingestion re-run as an
-- upsert without changing resource ids.

create table if not exists public.resources (
  id              uuid    primary key default gen_random_uuid(),
  title           text    not null,
  type            text    not null
                    check (type in ('form', 'script', 'log', 'report', 'approval', 'guide', 'booklet')),
  focus_area_code text,
  element_id      uuid    references public.elements (id) on delete set null,
  version         text    not null default 'v1',
  storage_bucket  text    not null,
  storage_path    text    not null,
  is_public       boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  constraint resources_focus_area_shape check (focus_area_code is null or focus_area_code ~ '^[A-J]$'),
  constraint resources_storage_key unique (storage_bucket, storage_path)
);

create index if not exists resources_focus_area_idx on public.resources (focus_area_code);
create index if not exists resources_element_id_idx on public.resources (element_id);

-- RLS: enable + default-deny. No client policy — read only via get_resources().
alter table public.resources enable row level security;

-- Hub metadata, approved partners only. Narrow return: NO storage_bucket /
-- storage_path (the client never sees raw paths; the download is server-issued
-- in S6e). A non-approved caller passes the is_approved() guard as false → zero
-- rows.
create or replace function public.get_resources()
returns table (
  id              uuid,
  title           text,
  type            text,
  focus_area_code text,
  element_id      uuid,
  version         text,
  is_public       boolean,
  sort_order      integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.id, r.title, r.type, r.focus_area_code, r.element_id,
         r.version, r.is_public, r.sort_order
  from public.resources r
  where public.is_approved()
  order by r.focus_area_code nulls last, r.sort_order, r.title;
$$;

revoke execute on function public.get_resources() from public, anon;
grant execute on function public.get_resources() to authenticated;

-- Private bucket: the 267 templates. Default-deny (no policy) — service-key
-- upload + server-issued signed URLs only.
insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

-- Public bucket: the two booklet PDFs (the only public files).
insert into storage.buckets (id, name, public)
values ('booklets', 'booklets', true)
on conflict (id) do nothing;
