-- The console reads the real subscription state (N-06, ADR-063: "the admin
-- reads webhook-derived state"). Until now the tenant list's plan and Stripe
-- columns came from a stub because xangarro_admin had no access to
-- `subscriptions`; B-10's webhook has been writing it since 2026-09-18.
--
-- Same shape as 0004/0006: a permissive SELECT policy TO xangarro_admin beside
-- the table's `tenant_read`, a column-level grant of exactly what
-- `billingStatusSnapshot` reads, and no write grant — Stripe, through B-10's
-- `xangarro_billing` role, stays the only writer. Idempotent, like every
-- console migration (its e2e setup re-applies the set).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT SELECT (stripe_subscription_id, business_id, stripe_customer_id, plan_id, interval,
                  status, stripe_status, trial_end, current_period_start, current_period_end,
                  cancel_at, collection_method, created_at, updated_at)
      ON public.subscriptions TO xangarro_admin;
    DROP POLICY IF EXISTS subscriptions_admin_read ON public.subscriptions;
    EXECUTE 'CREATE POLICY subscriptions_admin_read ON public.subscriptions
               FOR SELECT TO xangarro_admin USING (true)';
  END IF;
END
$$;
