-- Cross-tenant READ of sync rejections for the staff digest (N-10, B-18).
--
-- The digest's «Rechazos de sincronización (24 h)» section calls B-18's own
-- `rejectionDigest(tx, since)` from @xangarro/data-pg — no second copy of the
-- query. Under xangarro_app it sees one tenant (tenant_isolation); this adds
-- the same permissive `admin_read` policy as 0004 so that, run as
-- xangarro_admin, it counts every tenant. Apply after 0006.
--
-- Column-level and SELECT only: the four columns the count filters and groups
-- on. The row's own columns that hold what the phone tried to send (names,
-- amounts) stay unreadable, so the digest carries codes and counts, never
-- rows. No write grant: a rejection is resolved through the portal or a
-- function (docs/ops/back-office.md), never by hand.
--
-- N-46 (sync health) will want `device_id` and `table_name` too; it widens
-- this grant in its own migration.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    RETURN;
  END IF;

  GRANT SELECT (business_id, code, received_at, resolved_at) ON public.sync_rejections TO xangarro_admin;

  DROP POLICY IF EXISTS admin_read ON public.sync_rejections;
  CREATE POLICY admin_read ON public.sync_rejections FOR SELECT TO xangarro_admin USING (true);
END
$$;
