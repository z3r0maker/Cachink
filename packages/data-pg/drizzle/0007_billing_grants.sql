-- Who may touch the billing tables of 0004_billing (B-10, ADR-063).
--
-- Hand-written for the same reason as 0001_rls.sql: Drizzle Kit models neither
-- roles nor policies.
--
-- * The tenant (`xangarro_app` with a business claim) may READ its own
--   customer and subscription rows — the entitlement and the Suscripción
--   screen need them. It may not write them: 0001's default privileges gave it
--   INSERT/UPDATE/DELETE on every new table, so they are revoked here.
-- * `xangarro_billing` — the Stripe webhook and the portal's billing actions —
--   may SELECT, INSERT and UPDATE across tenants, because a webhook carries no
--   tenant claim. It is never the service role (ADR-063, N-26 SEC-SEC-01).
-- * Nobody DELETEs. A cancelled subscription is a row that says `lapsed`; an
--   event that happened stays recorded.
-- * `stripe_events` is invisible to tenants: it is Stripe's traffic, not theirs.

-- NOLOGIN here, like every role a migration names: a hosted project gets its
-- login (and a secret password) from the operator, never from this repository.
-- The local container's login is provisioned in ../local/0000_supabase_compat.sql.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_billing') THEN
    CREATE ROLE xangarro_billing NOLOGIN;
  END IF;
END
$$;

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.billing_customers, public.subscriptions, public.stripe_events FROM PUBLIC;
REVOKE ALL ON public.billing_customers, public.subscriptions, public.stripe_events FROM xangarro_app;
GRANT SELECT ON public.billing_customers, public.subscriptions TO xangarro_app;

GRANT USAGE ON SCHEMA public, xangarro TO xangarro_billing;
-- The tenant read policy below applies to every role, so evaluating it needs this.
GRANT EXECUTE ON FUNCTION xangarro.current_business_id() TO xangarro_billing;
GRANT SELECT, INSERT, UPDATE
  ON public.billing_customers, public.subscriptions, public.stripe_events TO xangarro_billing;

-- Tenant reads: the same claim every other table checks. SELECT only.
DROP POLICY IF EXISTS tenant_read ON public.billing_customers;
CREATE POLICY tenant_read ON public.billing_customers FOR SELECT
  USING (business_id = xangarro.current_business_id());
DROP POLICY IF EXISTS tenant_read ON public.subscriptions;
CREATE POLICY tenant_read ON public.subscriptions FOR SELECT
  USING (business_id = xangarro.current_business_id());

-- The billing writer: every row, but only the verbs granted above (no DELETE
-- is granted, so none is possible whatever the policy says).
DROP POLICY IF EXISTS billing_writer ON public.billing_customers;
CREATE POLICY billing_writer ON public.billing_customers TO xangarro_billing
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS billing_writer ON public.subscriptions;
CREATE POLICY billing_writer ON public.subscriptions TO xangarro_billing
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS billing_writer ON public.stripe_events;
CREATE POLICY billing_writer ON public.stripe_events TO xangarro_billing
  USING (true) WITH CHECK (true);
