-- 0017_verify_PROD_safe_readonly.sql
-- Read-only structural check for migration 0017 (resources download). Safe on
-- ANY database, including production — it only reads catalog metadata, never
-- writes. Run on TEST and PROD after applying 0017.
--
-- EXPECT (all rows return the values noted in the comments):

-- 1) The storage SELECT policy exists on the PRIVATE resources bucket, scoped to
--    authenticated, gated on is_approved(). EXPECT exactly one row; qual mentions
--    both bucket_id = 'resources' and is_approved().
select
  policyname,             -- resources_bucket_select_approved
  cmd,                    -- SELECT
  roles,                  -- {authenticated}
  qual                    -- ((bucket_id = 'resources'::text) AND is_approved())
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'resources_bucket_select_approved';

-- 2) get_resource_download is a hardened SECURITY DEFINER lookup:
--    secdef = true, config has search_path="", anon/public EXECUTE revoked,
--    authenticated granted.
select
  p.proname,                                                        -- get_resource_download
  p.prosecdef                                       as security_definer, -- true
  p.proconfig                                       as config,           -- {search_path=""}
  has_function_privilege('anon', p.oid, 'execute')  as anon_execute,     -- false
  has_function_privilege('public', p.oid, 'execute') as public_execute,  -- false
  has_function_privilege('authenticated', p.oid, 'execute') as auth_execute -- true
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_resource_download';

-- 3) Bucket visibility unchanged (resources PRIVATE, booklets PUBLIC).
select id, public
from storage.buckets
where id in ('resources', 'booklets')
order by id;  -- EXPECT booklets=true, resources=false
