-- Staff overrides of a tenant's plan (N-06, ADR-063). Portal-only (ADR-060).
-- Same temporary home as 0001_staff.sql; apply after it (the created_by FK)
-- and after data-pg's 0001_rls.sql (see 0001's header).
--
-- Append-only: an override ends by expiring, never by being edited or
-- deleted, so the console gets SELECT and INSERT and nothing else.

CREATE TABLE IF NOT EXISTS public.plan_overrides (
  id           text PRIMARY KEY,
  business_id  text NOT NULL,
  kind         text NOT NULL CHECK (kind IN
                 ('extend_trial', 'comp_plan', 'reissue_entitlement')),
  days         integer CHECK (days BETWEEN 1 AND 90),
  plan_id      text CHECK (plan_id IN ('xangarro', 'xangarrote')),
  reason       text CHECK (reason IS NULL OR length(btrim(reason)) BETWEEN 3 AND 500),
  expires_at   timestamptz,
  created_by   text NOT NULL REFERENCES public.staff_members (id),
  created_at   timestamptz NOT NULL,
  -- Each kind carries exactly its own fields; extend and comp must expire.
  CONSTRAINT plan_overrides_shape CHECK (
       (kind = 'extend_trial' AND days IS NOT NULL AND plan_id IS NULL
          AND reason IS NULL AND expires_at IS NOT NULL)
    OR (kind = 'comp_plan' AND days IS NULL AND plan_id IS NOT NULL
          AND reason IS NOT NULL AND expires_at IS NOT NULL)
    OR (kind = 'reissue_entitlement' AND days IS NULL AND plan_id IS NULL AND reason IS NULL)
  ),
  CONSTRAINT plan_overrides_expiry_after_creation CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS plan_overrides_business_created_idx
  ON public.plan_overrides (business_id, created_at DESC);

ALTER TABLE public.plan_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_overrides FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- The portal never reads staff rows directly. When B-06 consumes overrides
  -- it does so through a SECURITY DEFINER function scoped to the caller's
  -- tenant (see the N-06 integration note), not through a grant here.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON public.plan_overrides FROM xangarro_app;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT SELECT, INSERT ON public.plan_overrides TO xangarro_admin;
    DROP POLICY IF EXISTS plan_overrides_admin ON public.plan_overrides;
    EXECUTE 'CREATE POLICY plan_overrides_admin ON public.plan_overrides
               FOR ALL TO xangarro_admin USING (true) WITH CHECK (true)';
  END IF;
END
$$;
