-- 0051: self-service account deletion (LFPDPPP arts. 21–24, LFPC 76 Bis IX; ADR-136).
--
-- «Eliminar mi cuenta» closes the owner's account and every business it owns
-- at once, and erases them 30 days later. Until then a single-use link in the
-- confirmation email undoes it.
--
-- ── The ledger ──────────────────────────────────────────────────────────────
-- `xangarro.account_deletions`: one row per request, with the folio the owner
-- receives (the acuse), the hash of the undo link (never the link), and the
-- defensive minimum MEXIA must keep for 10 years after the erase (Código de
-- Comercio art. 38, CFF art. 30): the account's email and name, and each
-- business's name and fiscal identity, so the blocked billing rows stay tied
-- to someone. Like 0005's sessions it lives in the `xangarro` schema, where the
-- app role has no privileges: only the definer functions below reach it.
--
-- ── What is erased, what is kept ────────────────────────────────────────────
-- On day 30 `account_erase` deletes every row of the account's businesses from
-- every `public` table keyed by `business_id`, except the billing and CFDI
-- tables (`subscriptions`, `billing_customers`, `billing_cancellations`,
-- `billing_consents`, `cfdi_payments`), which nobody deletes (0007, 0009,
-- 0049) and which stay blocked: no member is left to read them. The account's
-- sessions, sign-in links, memberships elsewhere and `auth.users` row go too.
-- `privacy_consents` is append-only by design (0034) and stays, as proof.
--
-- ── Safety ──────────────────────────────────────────────────────────────────
-- Every function is SECURITY DEFINER and granted to `xangarro_app`. None takes
-- a business id: the request acts on the businesses the given account owns,
-- after the portal has checked the account's password; the undo needs the
-- link's hash; the erase only runs on a request whose 30 days are over and
-- that nobody undid. A caller can do nothing the owner did not ask for.

SET LOCAL lock_timeout = '200ms';

CREATE TABLE IF NOT EXISTS xangarro.account_deletions (
  folio text PRIMARY KEY CHECK (folio ~ '^EL-[0-9A-F]{6}$'),
  user_id uuid NOT NULL,
  email text NOT NULL,
  business_ids text[] NOT NULL CHECK (cardinality(business_ids) > 0),
  identidad jsonb NOT NULL,
  -- Subscriptions this request stopped renewing: an undo resumes exactly these.
  stopped_renewals text[] NOT NULL DEFAULT '{}',
  undo_token_hash char(64) NOT NULL UNIQUE CHECK (undo_token_hash ~ '^[0-9a-f]{64}$'),
  -- The reminder's own link: either link undoes the request, once.
  reminder_token_hash char(64) UNIQUE CHECK (reminder_token_hash ~ '^[0-9a-f]{64}$'),
  requested_at timestamptz NOT NULL DEFAULT now(),
  erase_at timestamptz NOT NULL,
  reminded_at timestamptz,
  undone_at timestamptz,
  erased_at timestamptz,
  blocked_until timestamptz
);
-- One open request per account.
CREATE UNIQUE INDEX IF NOT EXISTS account_deletions_open_idx
  ON xangarro.account_deletions (user_id) WHERE undone_at IS NULL AND erased_at IS NULL;
CREATE INDEX IF NOT EXISTS account_deletions_due_idx
  ON xangarro.account_deletions (erase_at) WHERE undone_at IS NULL AND erased_at IS NULL;
REVOKE ALL ON xangarro.account_deletions FROM PUBLIC;
ALTER TABLE xangarro.account_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xangarro.account_deletions FORCE ROW LEVEL SECURITY;

-- Whether this account has a deletion under way: it then signs in nowhere.
CREATE OR REPLACE FUNCTION xangarro.account_deletion_pending(p_user_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM xangarro.account_deletions d
     WHERE d.user_id::text = p_user_id AND d.undone_at IS NULL AND d.erased_at IS NULL);
$$;
REVOKE ALL ON FUNCTION xangarro.account_deletion_pending(text) FROM PUBLIC;

-- 0016's and 0048's lookups, unchanged but for the pending check: an account
-- being deleted has no business to sign in to, its own or anyone else's.
CREATE OR REPLACE FUNCTION xangarro.memberships_for_user(p_user_id text)
RETURNS TABLE (business_id text, role text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT m.business_id, m.role
  FROM public.business_members m
  JOIN public.businesses b ON b.id = m.business_id AND b.deleted_at IS NULL
  WHERE m.user_id = p_user_id AND NOT xangarro.account_deletion_pending(p_user_id)
  ORDER BY m.created_at;
$$;

CREATE OR REPLACE FUNCTION xangarro.negocios_for_user(p_user_id text)
RETURNS TABLE (business_id text, role text, nombre text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT m.business_id, m.role, b.nombre
  FROM public.business_members m
  JOIN public.businesses b ON b.id = m.business_id AND b.deleted_at IS NULL
  WHERE m.user_id = p_user_id AND NOT xangarro.account_deletion_pending(p_user_id)
  ORDER BY m.created_at;
$$;

-- The request: close every business the account owns, end every session and
-- device, and record the folio. Returns the folio, the erase day and the ids.
CREATE OR REPLACE FUNCTION xangarro.account_delete_request(
  p_user_id uuid, p_email text, p_hash text, p_stopped text[], p_days integer
) RETURNS TABLE (folio text, erase_at timestamptz, business_ids text[])
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_ids text[];
  v_folio text;
  v_erase timestamptz := now() + make_interval(days => p_days);
  v_identidad jsonb;
BEGIN
  SELECT array_agg(b.id ORDER BY m.created_at) INTO v_ids
    FROM public.business_members m
    JOIN public.businesses b ON b.id = m.business_id AND b.deleted_at IS NULL
   WHERE m.user_id = p_user_id::text AND m.role = 'owner';
  IF v_ids IS NULL THEN
    RAISE EXCEPTION 'account owns no business' USING ERRCODE = 'P0002';
  END IF;
  SELECT jsonb_build_object(
           'nombre', (SELECT u.raw_user_meta_data->>'nombre' FROM auth.users u WHERE u.id = p_user_id),
           'negocios', jsonb_agg(jsonb_build_object(
             'id', b.id, 'nombre', b.nombre, 'rfc', b.rfc, 'razon_social', b.razon_social,
             'codigo_postal', b.codigo_postal, 'regimen_sat', b.regimen_sat)))
    INTO v_identidad
    FROM public.businesses b WHERE b.id = ANY (v_ids);
  LOOP
    v_folio := 'EL-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM xangarro.account_deletions d WHERE d.folio = v_folio);
  END LOOP;
  INSERT INTO xangarro.account_deletions
    (folio, user_id, email, business_ids, identidad, stopped_renewals, undo_token_hash, erase_at)
  VALUES (v_folio, p_user_id, p_email, v_ids, v_identidad, coalesce(p_stopped, '{}'), p_hash, v_erase);
  UPDATE public.businesses SET deleted_at = now(), updated_at = now() WHERE id = ANY (v_ids);
  UPDATE public.devices SET revoked_at = now()
   WHERE business_id = ANY (v_ids) AND revoked_at IS NULL;
  UPDATE xangarro.portal_sessions SET revoked_at = now()
   WHERE (business_id = ANY (v_ids) OR user_id = p_user_id) AND revoked_at IS NULL;
  RETURN QUERY SELECT v_folio, v_erase, v_ids;
END
$$;

-- What the undo link shows. `estado`: pendiente (it can be undone), or vencido.
CREATE OR REPLACE FUNCTION xangarro.account_delete_peek(p_hash text)
RETURNS TABLE (folio text, email text, erase_at timestamptz, negocios text[], estado text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT d.folio, d.email, d.erase_at,
         ARRAY(SELECT n->>'nombre' FROM jsonb_array_elements(d.identidad->'negocios') n),
         CASE WHEN d.undone_at IS NULL AND d.erased_at IS NULL AND d.erase_at > now()
              THEN 'pendiente' ELSE 'vencido' END
    FROM xangarro.account_deletions d
   WHERE d.undo_token_hash = p_hash OR d.reminder_token_hash = p_hash;
$$;

-- The undo: reopen the businesses, once, while the 30 days last. Devices stay
-- revoked: the owner links them again. Returns what the portal must resume.
CREATE OR REPLACE FUNCTION xangarro.account_delete_undo(p_hash text)
RETURNS TABLE (folio text, user_id text, business_ids text[], stopped_renewals text[])
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  d xangarro.account_deletions%ROWTYPE;
BEGIN
  UPDATE xangarro.account_deletions a SET undone_at = now()
   WHERE (a.undo_token_hash = p_hash OR a.reminder_token_hash = p_hash)
     AND a.undone_at IS NULL AND a.erased_at IS NULL
     AND a.erase_at > now()
  RETURNING a.* INTO d;
  IF d.folio IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.businesses SET deleted_at = NULL, updated_at = now() WHERE id = ANY (d.business_ids);
  RETURN QUERY SELECT d.folio, d.user_id::text, d.business_ids, d.stopped_renewals;
END
$$;

-- The cron's two lists: requests whose 30 days are over, and those within 3
-- days of it that have not had their reminder.
CREATE OR REPLACE FUNCTION xangarro.account_deletions_open(p_until timestamptz)
RETURNS TABLE (folio text, email text, business_ids text[], negocios text[],
               stopped_renewals text[], erase_at timestamptz, reminded boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT d.folio, d.email, d.business_ids,
         ARRAY(SELECT n->>'nombre' FROM jsonb_array_elements(d.identidad->'negocios') n),
         d.stopped_renewals, d.erase_at, d.reminded_at IS NOT NULL
    FROM xangarro.account_deletions d
   WHERE d.undone_at IS NULL AND d.erased_at IS NULL AND d.erase_at <= p_until
   ORDER BY d.erase_at;
$$;

-- Record the reminder and its link's hash; false when it was already sent.
CREATE OR REPLACE FUNCTION xangarro.account_delete_reminded(p_folio text, p_hash text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  WITH r AS (
    UPDATE xangarro.account_deletions SET reminded_at = now(), reminder_token_hash = p_hash
     WHERE folio = p_folio AND reminded_at IS NULL AND undone_at IS NULL AND erased_at IS NULL
    RETURNING 1)
  SELECT EXISTS (SELECT 1 FROM r);
$$;

-- The erase. Refuses a request that is not due, undone or already erased.
-- Children before parents (the only foreign keys are logos and import files).
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
  DELETE FROM auth.users WHERE id = d.user_id;
  UPDATE xangarro.account_deletions
     SET erased_at = now(), blocked_until = now() + interval '10 years'
   WHERE folio = d.folio;
  RETURN now() + interval '10 years';
END
$$;

REVOKE ALL ON FUNCTION
  xangarro.account_delete_request(uuid, text, text, text[], integer),
  xangarro.account_delete_peek(text), xangarro.account_delete_undo(text),
  xangarro.account_deletions_open(timestamptz), xangarro.account_delete_reminded(text, text),
  xangarro.account_erase(text)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  xangarro.account_delete_request(uuid, text, text, text[], integer),
  xangarro.account_delete_peek(text), xangarro.account_delete_undo(text),
  xangarro.account_deletions_open(timestamptz), xangarro.account_delete_reminded(text, text),
  xangarro.account_erase(text)
TO xangarro_app;
