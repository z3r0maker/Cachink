-- Who may touch the tables of 0008_metering_cfdi (N-02, N-03, N-33).
--
-- Hand-written for the same reason as 0001_rls.sql and 0007_billing_grants.sql:
-- Drizzle Kit models neither roles nor policies.
--
-- * `cfdi_payments` / `cfdi_globals` — Xangarro's own fiscal records for its
--   subscription revenue. Only `xangarro_billing` (the Stripe webhook and the
--   monthly CFDI close) reads or writes them. Tenants never see them.
-- * `usage_counters` / `usage_notices` — only `xangarro_metering` (the nightly
--   recompute) reads or writes them. The tenant's view of its usage reaches it
--   through the portal server, not through a grant (C-12's `usage` block).
-- * Nobody DELETEs anything here. A cancelled CFDI is a status; a notice that
--   was sent stays recorded so it is never sent twice.
-- * 0001's default privileges gave `xangarro_app` INSERT/UPDATE/DELETE on every
--   new table; they are revoked here.

-- NOLOGIN here, like every role a migration names: a hosted project gets its
-- login from the operator. The local login is in ../local/0000_supabase_compat.sql.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_billing') THEN
    CREATE ROLE xangarro_billing NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_metering') THEN
    CREATE ROLE xangarro_metering NOLOGIN;
  END IF;
END
$$;

ALTER TABLE public.cfdi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfdi_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cfdi_globals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfdi_globals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters FORCE ROW LEVEL SECURITY;
ALTER TABLE public.usage_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_notices FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.cfdi_payments, public.cfdi_globals,
              public.usage_counters, public.usage_notices FROM PUBLIC;
REVOKE ALL ON public.cfdi_payments, public.cfdi_globals,
              public.usage_counters, public.usage_notices FROM xangarro_app;

GRANT USAGE ON SCHEMA public, xangarro TO xangarro_billing, xangarro_metering;

-- CFDI: the billing writer, every row, no DELETE.
GRANT SELECT, INSERT, UPDATE ON public.cfdi_payments, public.cfdi_globals TO xangarro_billing;
DROP POLICY IF EXISTS billing_writer ON public.cfdi_payments;
CREATE POLICY billing_writer ON public.cfdi_payments TO xangarro_billing
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS billing_writer ON public.cfdi_globals;
CREATE POLICY billing_writer ON public.cfdi_globals TO xangarro_billing
  USING (true) WITH CHECK (true);

-- Usage: the metering writer, every row, no DELETE.
GRANT SELECT, INSERT, UPDATE ON public.usage_counters, public.usage_notices TO xangarro_metering;
DROP POLICY IF EXISTS metering_writer ON public.usage_counters;
CREATE POLICY metering_writer ON public.usage_counters TO xangarro_metering
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS metering_writer ON public.usage_notices;
CREATE POLICY metering_writer ON public.usage_notices TO xangarro_metering
  USING (true) WITH CHECK (true);
