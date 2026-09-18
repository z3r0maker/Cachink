-- Platform flags and kill switches (N-09, ADR-053 level one, ADR-063).
-- Portal-only (ADR-060). Same temporary home as 0001_staff.sql; apply after it
-- (the updated_by FK) and after data-pg's 0001_rls.sql (xangarro schema,
-- xangarro.current_business_id()).
--
-- Posture: append-only events, current state as a VIEW. Every change is a new
-- row in platform_flag_events; `platform_flags` is the latest event per key.
-- So there is no mutable state table to upsert: the console gets SELECT and
-- INSERT on the events, nothing else, exactly like plan_overrides. A key with
-- no event has no row in the view and keeps its code default
-- (PLATFORM_FLAG_DEFAULTS in @xangarro/domain).
--
-- The portal gets SELECT on one narrow view and nothing on the events: no
-- reason, no author, and each allowlist cut down to the caller's own business,
-- so no tenant learns who else is in a beta.

CREATE TABLE IF NOT EXISTS public.platform_flag_events (
  id                      text PRIMARY KEY,
  flag_key                text NOT NULL CHECK (flag_key IN
                            ('stock', 'barcode', 'conversionMateriaPrima',
                             'conversionAutomatica', 'auditoriaInventario', 'merma',
                             'ventasCredito', 'asesorLlm', 'comprobanteShare',
                             'cobrosIntegrados')),
  mode                    text NOT NULL CHECK (mode IN ('off', 'on', 'allowlist')),
  allowlist_business_ids  text[] NOT NULL DEFAULT '{}',
  reason                  text NOT NULL CHECK (length(btrim(reason)) BETWEEN 3 AND 500),
  updated_by              text NOT NULL REFERENCES public.staff_members (id),
  updated_at              timestamptz NOT NULL,
  -- A list only in allowlist mode, and never an empty one there.
  CONSTRAINT platform_flag_events_shape CHECK (
    (mode = 'allowlist') = (cardinality(allowlist_business_ids) > 0)
  ),
  CONSTRAINT platform_flag_events_allowlist_max CHECK (cardinality(allowlist_business_ids) <= 500)
);

CREATE INDEX IF NOT EXISTS platform_flag_events_key_at_idx
  ON public.platform_flag_events (flag_key, updated_at DESC, id DESC);

-- Current state: the latest event per key (ties broken by the ULID).
CREATE OR REPLACE VIEW public.platform_flags AS
  SELECT DISTINCT ON (flag_key)
         flag_key, mode, allowlist_business_ids, reason, updated_by, updated_at
    FROM public.platform_flag_events
   ORDER BY flag_key, updated_at DESC, id DESC;

-- What the portal's entitlement computation reads (see
-- apps/backoffice/docs/platform-flags-integration.md). Evaluated inside the tenant
-- transaction, so current_business_id() is the business being entitled.
CREATE OR REPLACE VIEW public.platform_flags_for_entitlement
  WITH (security_barrier = true) AS
  SELECT flag_key,
         mode,
         CASE WHEN xangarro.current_business_id() = ANY (allowlist_business_ids)
              THEN ARRAY[xangarro.current_business_id()]
              ELSE '{}'::text[] END AS allowlist_business_ids,
         updated_at
    FROM public.platform_flags;

-- RLS on, but NOT forced: both views run with their owner's rights (the
-- migration role, which owns the table), and that is what lets the portal read
-- the narrow view without any grant on the events. The rows are platform-wide,
-- not tenant data, so FORCE would protect nothing here.
ALTER TABLE public.platform_flag_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON public.platform_flag_events FROM xangarro_app;
    REVOKE ALL ON public.platform_flags FROM xangarro_app;
    GRANT SELECT ON public.platform_flags_for_entitlement TO xangarro_app;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT SELECT, INSERT ON public.platform_flag_events TO xangarro_admin;
    GRANT SELECT ON public.platform_flags TO xangarro_admin;
    DROP POLICY IF EXISTS platform_flag_events_admin_read ON public.platform_flag_events;
    DROP POLICY IF EXISTS platform_flag_events_admin_append ON public.platform_flag_events;
    EXECUTE 'CREATE POLICY platform_flag_events_admin_read ON public.platform_flag_events
               FOR SELECT TO xangarro_admin USING (true)';
    EXECUTE 'CREATE POLICY platform_flag_events_admin_append ON public.platform_flag_events
               FOR INSERT TO xangarro_admin WITH CHECK (true)';
  END IF;
END
$$;
