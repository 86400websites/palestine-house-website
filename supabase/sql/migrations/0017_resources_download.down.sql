-- 0017_resources_download.down.sql — reverses 0017 exactly.
-- Restores default-deny on the resources bucket (drops the SELECT policy) and
-- removes the path-lookup RPC. The booklets bucket is untouched (no policy was
-- added). No data is affected.

drop function if exists public.get_resource_download(uuid);
drop policy if exists resources_bucket_select_approved on storage.objects;
