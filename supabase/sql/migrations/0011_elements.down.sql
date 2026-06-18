-- 0011_elements.down.sql — reverses 0011_elements.up.sql.
-- Drop the RPCs first, then the table (which removes its RLS + constraints).

drop function if exists public.get_element(text);
drop function if exists public.get_elements();
drop table if exists public.elements;
