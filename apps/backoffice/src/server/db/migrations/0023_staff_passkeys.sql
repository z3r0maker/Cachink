-- The console signs in with passkeys only (N-85, ADR-160), release 1 of 2.
--
-- Adds the passkeys, the one-time enrolment links the owner-role CLI mints,
-- the WebAuthn challenges, and two session columns. Nothing is rewritten:
-- `password_hash`, `totp_*` and `recovery_codes` stay (unread) so a rollback
-- to the password release still works, and release 2's migration drops them.
-- A session opened by a password has no `passkey_id`, and the console stops
-- resolving those, so every member's next request goes through a passkey.
--
-- Idempotent, like every admin migration: e2e and CI psql the whole set.

SET LOCAL lock_timeout = '200ms';

-- ── Passkeys ────────────────────────────────────────────────────────────────
-- `id` is the WebAuthn credential id, base64url. `public_key` is the COSE key
-- @simplewebauthn/server verifies with. A removed passkey keeps its row
-- (`revoked_at`) so the audit log's references stay readable.
CREATE TABLE IF NOT EXISTS public.staff_passkeys (
  id            text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]+$' AND length(id) BETWEEN 16 AND 1400),
  staff_id      text NOT NULL REFERENCES public.staff_members (id),
  public_key    bytea NOT NULL,
  counter       bigint NOT NULL DEFAULT 0 CHECK (counter >= 0),
  transports    text[] NOT NULL DEFAULT '{}',
  aaguid        text NOT NULL,
  backed_up     boolean NOT NULL,
  nombre        text NOT NULL CHECK (length(nombre) BETWEEN 1 AND 80),
  origen        text NOT NULL CHECK (origen IN ('enlace', 'mi_acceso')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);
CREATE INDEX IF NOT EXISTS staff_passkeys_live_staff_idx
  ON public.staff_passkeys (staff_id) WHERE revoked_at IS NULL;

-- ── Enrolment links ─────────────────────────────────────────────────────────
-- Minted only by scripts/staff.ts as the owner role; only the token's
-- SHA-256 is stored. A link is spent by registering a passkey (`used_at`),
-- and minting a new one voids the last (`voided_at`).
CREATE TABLE IF NOT EXISTS public.staff_enrolment_links (
  token_hash  text PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  staff_id    text NOT NULL REFERENCES public.staff_members (id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  voided_at   timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS staff_enrolment_links_staff_idx
  ON public.staff_enrolment_links (staff_id);

-- ── WebAuthn challenges ─────────────────────────────────────────────────────
-- Single use: taking one deletes it. `purpose` binds it to one ceremony
-- (`login`, `register:<staff>`, `enlace:<token hash>`, `stepup:<staff>`).
CREATE TABLE IF NOT EXISTS public.staff_webauthn_challenges (
  challenge_hash  text PRIMARY KEY CHECK (challenge_hash ~ '^[0-9a-f]{64}$'),
  purpose         text NOT NULL CHECK (length(purpose) BETWEEN 1 AND 120),
  expires_at      timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS staff_webauthn_challenges_expiry_idx
  ON public.staff_webauthn_challenges (expires_at);

-- ── Sessions ────────────────────────────────────────────────────────────────
-- The passkey that opened a session (removing it ends the session), and the
-- last tap, which unlocks adding or removing a passkey for 5 minutes.
ALTER TABLE public.staff_sessions
  ADD COLUMN IF NOT EXISTS passkey_id text REFERENCES public.staff_passkeys (id),
  ADD COLUMN IF NOT EXISTS stepped_up_at timestamptz;
CREATE INDEX IF NOT EXISTS staff_sessions_passkey_idx
  ON public.staff_sessions (passkey_id) WHERE passkey_id IS NOT NULL;

ALTER TABLE public.staff_passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_passkeys FORCE ROW LEVEL SECURITY;
ALTER TABLE public.staff_enrolment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_enrolment_links FORCE ROW LEVEL SECURITY;
ALTER TABLE public.staff_webauthn_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_webauthn_challenges FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON public.staff_passkeys FROM xangarro_app;
    REVOKE ALL ON public.staff_enrolment_links FROM xangarro_app;
    REVOKE ALL ON public.staff_webauthn_challenges FROM xangarro_app;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    RETURN;
  END IF;

  -- Passkeys: register from «Mi acceso» or a link, record a use, remove.
  -- No DELETE, and no UPDATE of the key, its owner or its id.
  GRANT SELECT, INSERT ON public.staff_passkeys TO xangarro_admin;
  GRANT UPDATE (counter, last_used_at, revoked_at) ON public.staff_passkeys TO xangarro_admin;
  DROP POLICY IF EXISTS staff_passkeys_admin ON public.staff_passkeys;
  CREATE POLICY staff_passkeys_admin ON public.staff_passkeys
    FOR ALL TO xangarro_admin USING (true) WITH CHECK (true);

  -- Links: read one and spend it. Minting (INSERT) and voiding are the
  -- owner role's, through the CLI.
  GRANT SELECT ON public.staff_enrolment_links TO xangarro_admin;
  GRANT UPDATE (used_at) ON public.staff_enrolment_links TO xangarro_admin;
  DROP POLICY IF EXISTS staff_enrolment_links_admin ON public.staff_enrolment_links;
  CREATE POLICY staff_enrolment_links_admin ON public.staff_enrolment_links
    FOR ALL TO xangarro_admin USING (true) WITH CHECK (true);

  -- Challenges: save, take (DELETE … RETURNING), prune.
  GRANT SELECT, INSERT, DELETE ON public.staff_webauthn_challenges TO xangarro_admin;
  DROP POLICY IF EXISTS staff_webauthn_challenges_admin ON public.staff_webauthn_challenges;
  CREATE POLICY staff_webauthn_challenges_admin ON public.staff_webauthn_challenges
    FOR ALL TO xangarro_admin USING (true) WITH CHECK (true);
END
$$;
