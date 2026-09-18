-- In-house staff authentication (N-05 rework, ADR-080: no Supabase Auth).
--
-- Apply after 0001_staff.sql AND after data-pg's 0005_throttle_and_sessions.sql:
-- the console reuses `xangarro.throttle` through the same SECURITY DEFINER
-- functions as the portal (keys prefixed `admin:`), so it inherits their
-- prune job, unlock procedure and runbook instead of owning a second table.
--
-- Staff identity moves off `auth.users`: a staff member signs in with a
-- password hashed here (bcrypt, cost 10 — @xangarro/auth-core) and a TOTP
-- whose seed is sealed with AES-256-GCM under ADMIN_TOTP_KEY, never stored in
-- clear. `user_id` stays, nullable, for rows created before this migration.

ALTER TABLE public.staff_members
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS totp_secret_enc text,
  ADD COLUMN IF NOT EXISTS totp_enrolled_at timestamptz,
  -- The last TOTP step accepted, so a code cannot be replayed within its window.
  ADD COLUMN IF NOT EXISTS totp_last_step bigint,
  -- SHA-256 (hex) of each unused recovery code; using one removes it.
  ADD COLUMN IF NOT EXISTS recovery_codes text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_members_enrolled_has_secret') THEN
    ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_enrolled_has_secret
      CHECK (totp_enrolled_at IS NULL OR totp_secret_enc IS NOT NULL);
  END IF;
END
$$;

-- Sign-in is by email: at most one live staff member per address.
CREATE UNIQUE INDEX IF NOT EXISTS staff_members_live_email_idx
  ON public.staff_members (lower(email)) WHERE revoked_at IS NULL;

-- ── Staff sessions ──────────────────────────────────────────────────────────
-- Same design as the portal's (ADR-079): the cookie is 256 random bits and
-- only its SHA-256 is stored. `aal1` = password only (short-lived, can only
-- reach /mfa/*); `aal2` = password + TOTP. Every request re-reads the staff
-- row, so revoking a staff member ends their sessions at once.
CREATE TABLE IF NOT EXISTS public.staff_sessions (
  token_hash    text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  staff_id      text NOT NULL REFERENCES public.staff_members (id),
  aal           text NOT NULL CHECK (aal IN ('aal1', 'aal2')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS staff_sessions_staff_idx ON public.staff_sessions (staff_id);

ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON public.staff_sessions FROM xangarro_app;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    RETURN;
  END IF;

  -- Sessions: open, resolve (touch last_seen), revoke. No DELETE.
  GRANT SELECT, INSERT, UPDATE ON public.staff_sessions TO xangarro_admin;
  DROP POLICY IF EXISTS staff_sessions_admin ON public.staff_sessions;
  CREATE POLICY staff_sessions_admin ON public.staff_sessions
    FOR ALL TO xangarro_admin USING (true) WITH CHECK (true);

  -- Staff rows: the console writes only the second-factor columns. Creating a
  -- staff member or setting a password is an operator action
  -- (scripts/staff.ts, as the database owner), never the console's.
  GRANT UPDATE (totp_secret_enc, totp_enrolled_at, totp_last_step, recovery_codes)
    ON public.staff_members TO xangarro_admin;
  DROP POLICY IF EXISTS staff_admin_second_factor ON public.staff_members;
  CREATE POLICY staff_admin_second_factor ON public.staff_members
    FOR UPDATE TO xangarro_admin USING (revoked_at IS NULL) WITH CHECK (revoked_at IS NULL);

  -- The shared throttle (data-pg 0005), through its functions only.
  GRANT USAGE ON SCHEMA xangarro TO xangarro_admin;
  GRANT EXECUTE ON FUNCTION
    xangarro.throttle_wait(text),
    xangarro.throttle_fail(text, integer, integer, integer),
    xangarro.throttle_clear(text)
  TO xangarro_admin;
END
$$;
