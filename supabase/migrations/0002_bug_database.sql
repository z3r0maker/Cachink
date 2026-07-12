-- Bug database tables (error_events + bug_reports).
--
-- These tables are NOT synced via PowerSync — they receive data
-- exclusively through the bug-report Edge Function using the
-- service-role key. RLS is enabled with ZERO policies so PostgREST
-- (anon/authenticated) cannot touch them at all.

-- =========================================================================
-- ERROR EVENTS (auto-shipped handled errors)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.error_events (
  id               TEXT PRIMARY KEY DEFAULT public.cachink_generate_ulid(),
  fingerprint      TEXT NOT NULL,
  error_name       TEXT NOT NULL,
  error_message    TEXT NOT NULL,
  source           TEXT NOT NULL CHECK (source IN ('use-case', 'repository', 'ui', 'sync', 'system')),
  operation        TEXT,
  context          JSONB,
  device_id        TEXT NOT NULL,
  business_id      TEXT,
  user_id          TEXT,
  app_version      TEXT,
  os_name          TEXT,
  os_version       TEXT,
  device_model     TEXT,
  platform         TEXT,
  feature_flags    JSONB,
  occurred_at      TIMESTAMPTZ NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_events_fingerprint_ts
  ON public.error_events (fingerprint, occurred_at);
CREATE INDEX IF NOT EXISTS idx_error_events_device_received
  ON public.error_events (device_id, received_at);

-- =========================================================================
-- BUG REPORTS (user-initiated reports)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.bug_reports (
  id               TEXT PRIMARY KEY DEFAULT public.cachink_generate_ulid(),
  description      TEXT NOT NULL,
  snapshot         JSONB,
  device_id        TEXT NOT NULL,
  business_id      TEXT,
  user_id          TEXT,
  app_version      TEXT,
  os_name          TEXT,
  os_version       TEXT,
  device_model     TEXT,
  platform         TEXT,
  feature_flags    JSONB,
  status           TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'resolved')),
  submitted_at     TIMESTAMPTZ NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- ROW LEVEL SECURITY — deny-by-default
-- =========================================================================
-- Enable RLS with ZERO policies. This means:
--   - anon key: cannot SELECT, INSERT, UPDATE, or DELETE
--   - authenticated key: same — cannot access
--   - service-role key: bypasses RLS → can INSERT (used by Edge Function)

ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports  ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- pg_cron: nightly prune of old error events (90-day retention)
-- =========================================================================
-- Requires the pg_cron extension to be enabled in Supabase dashboard
-- (Database → Extensions → pg_cron → Enable).
-- Bug reports are kept until manually resolved (no auto-prune).

SELECT cron.schedule(
  'prune-old-error-events',
  '0 3 * * *',
  $$DELETE FROM public.error_events WHERE occurred_at < now() - interval '90 days'$$
);
