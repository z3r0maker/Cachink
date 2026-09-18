-- Tenant isolation for the sync bookkeeping tables of 0002_sync_cursor
-- (B-08, B-09). Same policy as 0001_rls: a row is visible and writable only
-- under the tenant the request's claims or GUC name. Hand-written because
-- Drizzle does not model policies.
--
-- `sync_cursors` matters most: it is the per-tenant counter every write
-- increments. Without the policy, one tenant's writer could lock — and bump —
-- another's.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sync_cursors', 'sync_receipts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I
         USING (business_id = xangarro.current_business_id())
         WITH CHECK (business_id = xangarro.current_business_id())',
      t
    );
  END LOOP;
END
$$;
