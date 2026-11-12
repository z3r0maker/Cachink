-- E-44: one line per corp table, `table|rows|fingerprint`. The fingerprint is
-- an md5 over the sorted md5 of every row's text, so it needs no ordering key
-- and no 1 GB string: a 4 MB blob is hashed on its own row.
--
-- A row's text depends on the session's settings, so they are pinned here:
-- the same rows print the same text on any server, in any time zone.
SET TimeZone = 'UTC';
SET DateStyle = 'ISO, YMD';
SET IntervalStyle = 'postgres';
SET bytea_output = 'hex';
SET extra_float_digits = 1;

SELECT format(
  $q$SELECT %L, count(*), md5(coalesce(string_agg(h, '' ORDER BY h), ''))
       FROM (SELECT md5(t::text) AS h FROM corp.%I t) s$q$,
  c.relname, c.relname)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'corp' AND c.relkind IN ('r', 'p')
ORDER BY c.relname
\gexec
