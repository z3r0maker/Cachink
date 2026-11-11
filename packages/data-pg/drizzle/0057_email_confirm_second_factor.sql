-- 0057: signup confirms the email address, and owners and admins may add a
-- second factor (N-83, ADR-142; audit F-09, SEC-AUTH-02).
--
-- Same pattern as 0005 and 0015: everything lives in the `xangarro` schema,
-- where the app role has no table privileges, and is reached only through the
-- SECURITY DEFINER functions below, each with a pinned `search_path`.
--
-- `SET LOCAL`: the timeout dies with this file's transaction (R2-13), and the
-- hosted runner retries the whole file when it expires (ADR-119).
SET LOCAL lock_timeout = '200ms';

-- ── 1. Accounts that already exist count as confirmed ───────────────────────
-- Owner decision of 2026-11-11: they have been signing in with these
-- addresses, so a forced confirmation would stop each of them once for no
-- gain. From here on `account_create` leaves the stamp NULL and only the
-- emailed link, or a sign-in link, sets it.
UPDATE auth.users SET email_confirmed_at = coalesce(created_at, now())
 WHERE email_confirmed_at IS NULL;

-- ── 2. Three more kinds of link ─────────────────────────────────────────────
-- `confirm`: the emailed link that confirms an address (24 h, single use).
-- `pending`: the pass the browser that signed up holds until then, so only it
--            can resend the email or correct a mistyped address.
-- `challenge`: the password was right and the second factor is still owed.
ALTER TABLE xangarro.auth_links DROP CONSTRAINT IF EXISTS auth_links_kind_check;
ALTER TABLE xangarro.auth_links ADD CONSTRAINT auth_links_kind_check
  CHECK (kind IN ('reset', 'magic', 'confirm', 'pending', 'challenge'));

-- What a link is right now, without spending it. No row: no such link.
-- A link retired by a newer one reads `used` like a spent one; `confirmed`
-- tells the two apart for a `confirm` link.
CREATE OR REPLACE FUNCTION xangarro.link_peek(p_hash text, p_kind text)
RETURNS TABLE (state text, user_id text, email text, nombre text, confirmed boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT CASE WHEN l.used_at IS NOT NULL THEN 'used'
              WHEN l.expires_at <= now() THEN 'expired'
              ELSE 'fresh' END,
         l.user_id::text, u.email::text,
         NULLIF(btrim(coalesce(u.raw_user_meta_data->>'nombre', '')), ''),
         u.email_confirmed_at IS NOT NULL
    FROM xangarro.auth_links l
    JOIN auth.users u ON u.id = l.user_id
   WHERE l.token_hash = p_hash AND l.kind = p_kind;
$$;

-- Spend a `confirm` link: the address is the account's, proven. The signup
-- browser's pass is retired with it. The account's id, or NULL for a link that
-- is spent, expired or unknown.
CREATE OR REPLACE FUNCTION xangarro.email_confirm(p_hash text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  uid text;
BEGIN
  uid := xangarro.link_consume(p_hash, 'confirm');
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;
  UPDATE auth.users SET email_confirmed_at = now(), updated_at = now()
   WHERE id = uid::uuid AND email_confirmed_at IS NULL;
  UPDATE xangarro.auth_links SET used_at = now()
   WHERE user_id = uid::uuid AND kind = 'pending' AND used_at IS NULL;
  RETURN uid;
END
$$;

-- Whether the account's address is confirmed. NULL: no such account.
CREATE OR REPLACE FUNCTION xangarro.account_confirmed(p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT u.email_confirmed_at IS NOT NULL FROM auth.users u WHERE u.id = p_user;
$$;

-- An account reached through an emailed link before anyone confirmed it. The
-- link proves the inbox, so the address is confirmed. After a sign-in link,
-- whoever set the password without that proof loses it (`p_keep_password`
-- false); after a password reset the password is the one the inbox's owner
-- just chose, and stays. Every session and pending link goes either way.
-- False when the account was confirmed already: then nothing changes.
CREATE OR REPLACE FUNCTION xangarro.account_claim(p_user uuid, p_keep_password boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE auth.users
     SET email_confirmed_at = now(), updated_at = now(),
         encrypted_password = CASE WHEN p_keep_password THEN encrypted_password END
   WHERE id = p_user AND email_confirmed_at IS NULL;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  UPDATE xangarro.portal_sessions SET revoked_at = now()
   WHERE user_id = p_user AND revoked_at IS NULL;
  UPDATE xangarro.auth_links SET used_at = now()
   WHERE user_id = p_user AND kind IN ('confirm', 'pending', 'challenge') AND used_at IS NULL;
  RETURN true;
END
$$;

-- Correct a mistyped address while nobody has confirmed it. Links mailed to
-- the old address stop working. False when the account is already confirmed
-- or the new address belongs to another account.
CREATE OR REPLACE FUNCTION xangarro.account_change_email(p_user uuid, p_email text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF xangarro.account_email_taken(p_email) THEN
    RETURN false;
  END IF;
  UPDATE auth.users SET email = p_email, updated_at = now()
   WHERE id = p_user AND email_confirmed_at IS NULL;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  UPDATE xangarro.auth_links SET used_at = now()
   WHERE user_id = p_user AND kind IN ('confirm', 'magic', 'reset') AND used_at IS NULL;
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END
$$;

-- ── 3. The second factor ────────────────────────────────────────────────────
-- One row per account that ever opened «Seguridad». The seed is sealed by the
-- server (AES-256-GCM, bound to the account id); recovery codes are SHA-256.
-- `last_step` is the replay guard: a TOTP step is accepted once.
CREATE TABLE IF NOT EXISTS xangarro.portal_second_factor (
  user_id uuid PRIMARY KEY,
  secret_enc text,
  enrolled_at timestamptz,
  last_step bigint,
  recovery_codes text[] NOT NULL DEFAULT '{}',
  invite_dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portal_second_factor_enrolled_has_seed
    CHECK (enrolled_at IS NULL OR secret_enc IS NOT NULL)
);
REVOKE ALL ON xangarro.portal_second_factor FROM PUBLIC;

-- One row for an account that exists, enrolled or not; none for a stranger.
CREATE OR REPLACE FUNCTION xangarro.second_factor_state(p_user uuid)
RETURNS TABLE (
  secret_enc text, enrolled_at timestamptz, last_step bigint,
  codes_left integer, invite_dismissed boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT f.secret_enc, f.enrolled_at, f.last_step,
         coalesce(cardinality(f.recovery_codes), 0), f.invite_dismissed_at IS NOT NULL
    FROM auth.users u
    LEFT JOIN xangarro.portal_second_factor f ON f.user_id = u.id
   WHERE u.id = p_user;
$$;

-- Compare-and-swap of the pending seed, so two tabs cannot each show a
-- different QR. Never touches an enrolled account.
CREATE OR REPLACE FUNCTION xangarro.second_factor_save_pending(
  p_user uuid, p_previous text, p_sealed text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF p_previous IS NULL THEN
    INSERT INTO xangarro.portal_second_factor AS f (user_id, secret_enc)
    SELECT u.id, p_sealed FROM auth.users u WHERE u.id = p_user
    ON CONFLICT (user_id) DO UPDATE SET secret_enc = EXCLUDED.secret_enc, updated_at = now()
     WHERE f.enrolled_at IS NULL AND f.secret_enc IS NULL;
  ELSE
    UPDATE xangarro.portal_second_factor SET secret_enc = p_sealed, updated_at = now()
     WHERE user_id = p_user AND enrolled_at IS NULL AND secret_enc = p_previous;
  END IF;
  RETURN FOUND;
END
$$;

CREATE OR REPLACE FUNCTION xangarro.second_factor_complete(
  p_user uuid, p_step bigint, p_hashes text[]
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE xangarro.portal_second_factor
     SET enrolled_at = now(), last_step = p_step, recovery_codes = p_hashes, updated_at = now()
   WHERE user_id = p_user AND enrolled_at IS NULL AND secret_enc IS NOT NULL;
  RETURN FOUND;
END
$$;

CREATE OR REPLACE FUNCTION xangarro.second_factor_advance(p_user uuid, p_step bigint)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE xangarro.portal_second_factor SET last_step = p_step, updated_at = now()
   WHERE user_id = p_user AND enrolled_at IS NOT NULL
     AND (last_step IS NULL OR last_step < p_step);
  RETURN FOUND;
END
$$;

-- Remove one recovery code: how many are left, or NULL if it was not there.
CREATE OR REPLACE FUNCTION xangarro.second_factor_use_recovery(p_user uuid, p_hash text)
RETURNS integer
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  UPDATE xangarro.portal_second_factor
     SET recovery_codes = array_remove(recovery_codes, p_hash), updated_at = now()
   WHERE user_id = p_user AND enrolled_at IS NOT NULL AND p_hash = ANY (recovery_codes)
  RETURNING coalesce(cardinality(recovery_codes), 0);
$$;

-- «Generar códigos nuevos»: the earlier ones stop working.
CREATE OR REPLACE FUNCTION xangarro.second_factor_replace_recovery(p_user uuid, p_hashes text[])
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE xangarro.portal_second_factor SET recovery_codes = p_hashes, updated_at = now()
   WHERE user_id = p_user AND enrolled_at IS NOT NULL;
  RETURN FOUND;
END
$$;

-- «Desactivar»: the seed and the codes are gone, and a sign-in waiting on a
-- code is dropped. The invitation stays dismissed.
CREATE OR REPLACE FUNCTION xangarro.second_factor_disable(p_user uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE xangarro.portal_second_factor
     SET secret_enc = NULL, enrolled_at = NULL, last_step = NULL, recovery_codes = '{}',
         invite_dismissed_at = coalesce(invite_dismissed_at, now()), updated_at = now()
   WHERE user_id = p_user AND enrolled_at IS NOT NULL;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  UPDATE xangarro.auth_links SET used_at = now()
   WHERE user_id = p_user AND kind = 'challenge' AND used_at IS NULL;
  RETURN true;
END
$$;

-- «Ahora no» on the one-time invitation.
CREATE OR REPLACE FUNCTION xangarro.second_factor_dismiss_invite(p_user uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  INSERT INTO xangarro.portal_second_factor AS f (user_id, invite_dismissed_at)
  SELECT u.id, now() FROM auth.users u WHERE u.id = p_user
  ON CONFLICT (user_id) DO UPDATE SET invite_dismissed_at = now(), updated_at = now()
   WHERE f.invite_dismissed_at IS NULL;
$$;

-- ── 4. The re-ask: when this session last proved the second factor ──────────
ALTER TABLE xangarro.portal_sessions ADD COLUMN IF NOT EXISTS stepped_up_at timestamptz;

CREATE OR REPLACE FUNCTION xangarro.session_step_up(p_hash text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE xangarro.portal_sessions SET stepped_up_at = now()
   WHERE token_hash = p_hash AND revoked_at IS NULL AND expires_at > now();
  RETURN FOUND;
END
$$;

-- True while the last proof is younger than `p_window` seconds.
CREATE OR REPLACE FUNCTION xangarro.session_stepped_up(p_hash text, p_window integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM xangarro.portal_sessions s
     WHERE s.token_hash = p_hash AND s.revoked_at IS NULL AND s.expires_at > now()
       AND s.stepped_up_at > now() - make_interval(secs => p_window));
$$;

-- ── 5. Erasing an account erases its second factor ──────────────────────────
-- 0051's function, with one more DELETE. Its grants are unchanged.
CREATE OR REPLACE FUNCTION xangarro.account_erase(p_folio text)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  d xangarro.account_deletions%ROWTYPE;
  t record;
  keep constant text[] := ARRAY['subscriptions', 'billing_customers', 'billing_cancellations',
                                'billing_consents', 'cfdi_payments'];
BEGIN
  SELECT * INTO d FROM xangarro.account_deletions a
   WHERE a.folio = p_folio AND a.undone_at IS NULL AND a.erased_at IS NULL AND a.erase_at <= now()
   FOR UPDATE;
  IF d.folio IS NULL THEN
    RAISE EXCEPTION 'deletion % is not due', p_folio USING ERRCODE = 'P0002';
  END IF;
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
      JOIN information_schema.tables tb
        ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
       AND tb.table_type = 'BASE TABLE'
     WHERE c.table_schema = 'public' AND c.column_name = 'business_id'
       AND NOT c.table_name = ANY (keep)
     ORDER BY c.table_name = 'businesses', c.table_name = 'assisted_imports', c.table_name
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE business_id = ANY ($1)', t.table_name)
      USING d.business_ids;
  END LOOP;
  DELETE FROM public.businesses WHERE id = ANY (d.business_ids);
  DELETE FROM public.business_members WHERE user_id = d.user_id::text;
  DELETE FROM xangarro.signup_attribution WHERE business_id = ANY (d.business_ids);
  DELETE FROM xangarro.portal_sessions WHERE user_id = d.user_id OR business_id = ANY (d.business_ids);
  DELETE FROM xangarro.auth_links WHERE user_id = d.user_id;
  DELETE FROM xangarro.portal_second_factor WHERE user_id = d.user_id;
  DELETE FROM auth.users WHERE id = d.user_id;
  UPDATE xangarro.account_deletions
     SET erased_at = now(), blocked_until = now() + interval '10 years'
   WHERE folio = d.folio;
  RETURN now() + interval '10 years';
END
$$;

REVOKE ALL ON FUNCTION
  xangarro.link_peek(text, text), xangarro.email_confirm(text),
  xangarro.account_confirmed(uuid), xangarro.account_claim(uuid, boolean),
  xangarro.account_change_email(uuid, text),
  xangarro.second_factor_state(uuid), xangarro.second_factor_save_pending(uuid, text, text),
  xangarro.second_factor_complete(uuid, bigint, text[]),
  xangarro.second_factor_advance(uuid, bigint),
  xangarro.second_factor_use_recovery(uuid, text),
  xangarro.second_factor_replace_recovery(uuid, text[]),
  xangarro.second_factor_disable(uuid), xangarro.second_factor_dismiss_invite(uuid),
  xangarro.session_step_up(text), xangarro.session_stepped_up(text, integer)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  xangarro.link_peek(text, text), xangarro.email_confirm(text),
  xangarro.account_confirmed(uuid), xangarro.account_claim(uuid, boolean),
  xangarro.account_change_email(uuid, text),
  xangarro.second_factor_state(uuid), xangarro.second_factor_save_pending(uuid, text, text),
  xangarro.second_factor_complete(uuid, bigint, text[]),
  xangarro.second_factor_advance(uuid, bigint),
  xangarro.second_factor_use_recovery(uuid, text),
  xangarro.second_factor_replace_recovery(uuid, text[]),
  xangarro.second_factor_disable(uuid), xangarro.second_factor_dismiss_invite(uuid),
  xangarro.session_step_up(text), xangarro.session_stepped_up(text, integer)
TO xangarro_app;
