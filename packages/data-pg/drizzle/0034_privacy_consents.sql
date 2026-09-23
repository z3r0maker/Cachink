-- Proof of consent to the aviso de privacidad (N-34, audit PRIV-REG-01).
--
-- ── Why a ledger, not a column ──────────────────────────────────────────────
-- LFPDPPP 2025 puts the burden of proving consent on the responsable (art. 5,
-- responsabilidad). A boolean on the account proves nothing about *which* text
-- was accepted or *when*. This table keeps one append-only row per purpose per
-- act, tied to the exact aviso by version and by the SHA-256 of its text.
--
-- ── Hash chain ──────────────────────────────────────────────────────────────
-- Every row hashes the previous row's hash with its own fields, so an edit or a
-- deletion anywhere breaks every later row. A nightly job seals the day's last
-- `row_hash` externally (NOM-151 constancia, or an RFC 3161 timestamp) — the
-- chain makes one seal per day cover every row of that day.
--
-- ── Append-only by construction ─────────────────────────────────────────────
-- No role holds INSERT, UPDATE or DELETE; the only write path is the definer
-- function, and a trigger refuses UPDATE and DELETE even to the owner. Reads
-- for the console come later through their own definer, as `geo_counters`.
--
-- ── What is stored ──────────────────────────────────────────────────────────
-- Identity of the act (user, business, surface), the aviso (version + sha256),
-- the purpose and whether it was granted, how (casilla / boton / tacito), the
-- IP as a SHA-256 (ADR-079: never the raw address) and the user agent.

CREATE TABLE IF NOT EXISTS xangarro.privacy_consents (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  business_id text NOT NULL,
  aviso_version text NOT NULL,
  aviso_sha256 char(64) NOT NULL CHECK (aviso_sha256 ~ '^[0-9a-f]{64}$'),
  surface text NOT NULL CHECK (surface IN ('registro', 'reconsentimiento', 'configuracion')),
  purpose text NOT NULL CHECK (purpose IN ('necesarias', 'novedades')),
  granted boolean NOT NULL,
  method text NOT NULL CHECK (method IN ('casilla', 'boton', 'tacito')),
  ip_hash char(64) NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  prev_hash char(64) NOT NULL,
  row_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL
);

REVOKE ALL ON xangarro.privacy_consents FROM PUBLIC;

CREATE INDEX IF NOT EXISTS privacy_consents_user_idx
  ON xangarro.privacy_consents (user_id, created_at);
CREATE INDEX IF NOT EXISTS privacy_consents_business_idx
  ON xangarro.privacy_consents (business_id, created_at);
CREATE INDEX IF NOT EXISTS privacy_consents_day_idx
  ON xangarro.privacy_consents (created_at);

-- Nothing here is ever rewritten.
CREATE OR REPLACE FUNCTION xangarro.privacy_consents_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'privacy_consents is append-only' USING ERRCODE = '0A000';
END
$$;

DROP TRIGGER IF EXISTS privacy_consents_immutable ON xangarro.privacy_consents;
CREATE TRIGGER privacy_consents_immutable
  BEFORE UPDATE OR DELETE ON xangarro.privacy_consents
  FOR EACH ROW EXECUTE FUNCTION xangarro.privacy_consents_immutable();

-- Record one consent row and return its hash. The advisory lock serialises the
-- chain; the caller's transaction already holds the account insert, so a
-- rollback of the signup takes the consent rows with it.
CREATE OR REPLACE FUNCTION xangarro.privacy_consent_record(
  p_user_id uuid, p_business_id text,
  p_aviso_version text, p_aviso_sha256 text,
  p_surface text, p_purpose text, p_granted boolean, p_method text,
  p_ip_hash text, p_user_agent text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_prev text;
  v_at timestamptz := clock_timestamp();
  v_row text;
BEGIN
  IF p_user_id IS NULL OR p_business_id IS NULL OR btrim(p_business_id) = '' THEN
    RAISE EXCEPTION 'privacy consent needs a user and a business' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('xangarro.privacy_consents'));
  SELECT c.row_hash INTO v_prev FROM xangarro.privacy_consents c ORDER BY c.id DESC LIMIT 1;
  v_prev := coalesce(v_prev, repeat('0', 64));
  v_row := encode(sha256(convert_to(
    v_prev || '|' || p_user_id::text || '|' || p_business_id || '|' ||
    left(coalesce(p_aviso_version, ''), 40) || '|' || coalesce(p_aviso_sha256, '') || '|' ||
    p_surface || '|' || p_purpose || '|' || p_granted::text || '|' || p_method || '|' ||
    left(coalesce(p_ip_hash, ''), 64) || '|' || left(coalesce(p_user_agent, ''), 300) || '|' ||
    to_char(v_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    'UTF8')), 'hex');

  INSERT INTO xangarro.privacy_consents
    (user_id, business_id, aviso_version, aviso_sha256, surface, purpose, granted, method,
     ip_hash, user_agent, prev_hash, row_hash, created_at)
  VALUES
    (p_user_id, p_business_id, left(coalesce(p_aviso_version, ''), 40), p_aviso_sha256,
     p_surface, p_purpose, p_granted, p_method,
     left(coalesce(p_ip_hash, ''), 64), left(coalesce(p_user_agent, ''), 300),
     v_prev, v_row, v_at);
  RETURN v_row;
END
$$;

REVOKE ALL ON FUNCTION xangarro.privacy_consent_record(
  uuid, text, text, text, text, text, boolean, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.privacy_consent_record(
  uuid, text, text, text, text, text, boolean, text, text, text
) TO xangarro_app;

-- The value the nightly seal signs: the last hash written on a given day.
CREATE OR REPLACE FUNCTION xangarro.privacy_consents_day_root(p_day date)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT c.row_hash FROM xangarro.privacy_consents c
  WHERE (c.created_at AT TIME ZONE 'America/Mexico_City')::date = p_day
  ORDER BY c.id DESC LIMIT 1;
$$;

REVOKE ALL ON FUNCTION xangarro.privacy_consents_day_root(date) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT EXECUTE ON FUNCTION xangarro.privacy_consents_day_root(date) TO xangarro_admin;
  END IF;
END
$$;

ALTER TABLE xangarro.privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE xangarro.privacy_consents FORCE ROW LEVEL SECURITY;
