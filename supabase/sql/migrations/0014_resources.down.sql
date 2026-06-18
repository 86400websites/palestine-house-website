-- 0014_resources.down.sql — reverses 0014_resources.up.sql.
-- Drop the RPC + table, then remove the bucket rows (objects first, since
-- storage.objects references the bucket).
--
-- NOTE: the storage.objects delete clears the object METADATA rows only. If you
-- are truly rolling back after the ingestion uploaded files, also delete the
-- blobs via the Storage API / dashboard — a SQL delete here does not remove the
-- stored files themselves.

drop function if exists public.get_resources();
drop table if exists public.resources;

delete from storage.objects where bucket_id in ('resources', 'booklets');
delete from storage.buckets where id in ('resources', 'booklets');
