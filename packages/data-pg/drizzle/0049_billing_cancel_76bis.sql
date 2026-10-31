-- 0049: cancelling and renewing under LFPC art. 76 Bis (ADR-132).
--
-- Three billing tables, written only by `xangarro_billing` (like 0007's) and
-- deleted by nobody:
--
-- * `billing_renewal_notices` — one row per renewal announced: the reminder
--   owed at least five días hábiles before every charge, and the single-use
--   cancel link inside it. Only the SHA-256 of the link's token is stored, so
--   a copy of this table cancels nothing. A row whose email never went out
--   (`sent_at` null) may be re-claimed with a new link.
-- * `billing_cancellations` — the acuse: one append-only row per cancellation,
--   with the folio the owner receives, where it was asked (Plan y pagos or
--   the email link), who asked and when the plan ends.
-- * `billing_consents` — the owner's tick on the Términos box inside Stripe
--   Checkout, copied from the webhook with the Términos version, so the proof
--   of the recurring-charge consent does not live only at Stripe.
--
-- Tenants read none of them: the screen reads `subscriptions.cancel_at`.

-- `SET LOCAL`: the timeout dies with this file's transaction (R2-13).
SET LOCAL lock_timeout = '200ms';

CREATE TABLE IF NOT EXISTS public.billing_renewal_notices (
  stripe_subscription_id text NOT NULL,
  period_end timestamptz NOT NULL,
  business_id text NOT NULL,
  token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  used_at timestamptz,
  PRIMARY KEY (stripe_subscription_id, period_end)
);

-- Every RLS table keyed by business_id leads an index with it (DB-IDX-01).
CREATE INDEX IF NOT EXISTS billing_renewal_notices_business_idx
  ON public.billing_renewal_notices (business_id, period_end);

CREATE TABLE IF NOT EXISTS public.billing_cancellations (
  folio text PRIMARY KEY CHECK (folio ~ '^CX-[0-9A-F]{6}$'),
  business_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('portal', 'correo')),
  ends_at timestamptz NOT NULL,
  requested_by uuid,
  requested_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS billing_cancellations_business_idx
  ON public.billing_cancellations (business_id, requested_at);

CREATE TABLE IF NOT EXISTS public.billing_consents (
  checkout_session_id text PRIMARY KEY,
  business_id text NOT NULL,
  stripe_subscription_id text,
  terms_version text NOT NULL,
  accepted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS billing_consents_business_idx
  ON public.billing_consents (business_id, accepted_at);

ALTER TABLE public.billing_renewal_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_renewal_notices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cancellations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.billing_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_consents FORCE ROW LEVEL SECURITY;

-- 0001's default privileges gave the app role every verb on new tables.
REVOKE ALL ON public.billing_renewal_notices, public.billing_cancellations,
  public.billing_consents FROM PUBLIC;
REVOKE ALL ON public.billing_renewal_notices, public.billing_cancellations,
  public.billing_consents FROM xangarro_app;

-- A notice is updated (sent, used, re-claimed); an acuse or a consent never is.
GRANT SELECT, INSERT, UPDATE ON public.billing_renewal_notices TO xangarro_billing;
GRANT SELECT, INSERT ON public.billing_cancellations, public.billing_consents TO xangarro_billing;

DROP POLICY IF EXISTS billing_writer ON public.billing_renewal_notices;
CREATE POLICY billing_writer ON public.billing_renewal_notices TO xangarro_billing
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS billing_writer ON public.billing_cancellations;
CREATE POLICY billing_writer ON public.billing_cancellations TO xangarro_billing
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS billing_writer ON public.billing_consents;
CREATE POLICY billing_writer ON public.billing_consents TO xangarro_billing
  USING (true) WITH CHECK (true);
