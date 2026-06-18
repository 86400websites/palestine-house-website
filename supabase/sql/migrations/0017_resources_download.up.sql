-- 0017_resources_download.up.sql
-- S6 (6e): turns on approved-only DOWNLOADS for the Resources hub. Two pieces,
-- both consistent with the S5 gating model (RLS default-deny + is_approved()):
--
--   1) A storage.objects SELECT policy on the PRIVATE `resources` bucket, gated
--      on public.is_approved(). This is what lets an APPROVED user mint a
--      short-lived signed URL with THEIR OWN authenticated client — no service
--      key, no new Vercel env var (Downloads decision, PROJECT-STATUS §1).
--      anon / pending stay default-deny (no matching policy). The PUBLIC
--      `booklets` bucket needs no policy — public buckets serve via public URL.
--
--   2) get_resource_download(p_id) — a narrow, is_approved()-gated SECURITY
--      DEFINER lookup returning ONLY one resource's bucket + path + is_public.
--      get_resources() deliberately omits the raw path, so the download Server
--      Action uses this to resolve where the file lives SERVER-SIDE; the client
--      only ever receives the resulting signed/public URL, never the raw path.
--      Same hardening as every S5 RPC: search_path = '', auth comes from the
--      is_approved() guard, EXECUTE revoked from public/anon, granted to
--      authenticated. A pending/anon caller gets zero rows.

-- 1) Approved-only SELECT on the private resources bucket.
drop policy if exists resources_bucket_select_approved on storage.objects;
create policy resources_bucket_select_approved
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'resources' and public.is_approved());

-- 2) Single-resource path lookup for the download Server Action (approved only).
create or replace function public.get_resource_download(p_id uuid)
returns table (
  storage_bucket text,
  storage_path   text,
  is_public      boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.storage_bucket, r.storage_path, r.is_public
  from public.resources r
  where r.id = p_id and public.is_approved();
$$;

revoke execute on function public.get_resource_download(uuid) from public, anon;
grant execute on function public.get_resource_download(uuid) to authenticated;
