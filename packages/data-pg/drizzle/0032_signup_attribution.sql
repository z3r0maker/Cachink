-- Which campaign brought a business to signup (N-57, ADR-092).
--
-- ── Why its own table, in the xangarro schema ───────────────────────────────
-- `businesses` is a DOWN table: every column on it syncs to every phone. A
-- marketing label has no business travelling to a shopkeeper's device, and
-- widening a synced table would drag a sync-schema migration into what is
-- otherwise a half-day change. This lives beside `geo_counters` instead —
-- platform data, invisible to tenants, reached only through definer functions.
--
-- ── First touch, never overwritten ──────────────────────────────────────────
-- `business_id` is the primary key and the writer is ON CONFLICT DO NOTHING,
-- so the campaign recorded is the one that brought them, not the last link
-- they happened to click. For a product with a 14-day trial that is the
-- honest attribution.
--
-- ── What is stored ──────────────────────────────────────────────────────────
-- Five labels a marketer chose (not personal data) plus the state at signup,
-- so "which campaign, in which state, produced a paying customer" is one join.
-- `geo_counters` cannot answer that: it is an aggregate by design.
--
-- The region here is per-business rather than aggregate, which is a step
-- beyond the counter and is deliberate: a business is a commercial entity
-- whose fiscal address the tenant already gives us
-- (`businesses.codigo_postal`), and state granularity is coarser than that.
-- Still no IP, no city, no coordinates.
--
-- '' means "not given" for every text column, so no query handles both '' and
-- NULL.

CREATE TABLE IF NOT EXISTS xangarro.signup_attribution (
  business_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT '',
  medium text NOT NULL DEFAULT '',
  campaign text NOT NULL DEFAULT '',
  term text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  country char(2) NOT NULL DEFAULT 'ZZ',
  region text NOT NULL DEFAULT ''
);

REVOKE ALL ON xangarro.signup_attribution FROM PUBLIC;

-- The console groups by campaign, and by campaign within a state.
CREATE INDEX IF NOT EXISTS signup_attribution_campaign_idx
  ON xangarro.signup_attribution (campaign, created_at);

-- Record the first touch for a business. A second call is a no-op, so a retry
-- or a re-run cannot rewrite history. Labels are capped here as well as in the
-- caller: the database is the last place that can still say no.
CREATE OR REPLACE FUNCTION xangarro.signup_attribution_record(
  p_business_id text,
  p_source text, p_medium text, p_campaign text, p_term text, p_content text,
  p_country text, p_region text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_country text := upper(trim(coalesce(p_country, '')));
  v_region text := upper(trim(coalesce(p_region, '')));
BEGIN
  IF p_business_id IS NULL OR btrim(p_business_id) = '' THEN
    RAISE EXCEPTION 'signup attribution needs a business' USING ERRCODE = '22023';
  END IF;
  IF v_country !~ '^[A-Z]{2}$' THEN
    v_country := 'ZZ';
    v_region := '';
  END IF;
  IF v_region !~ '^[A-Z0-9]{1,3}$' THEN
    v_region := '';
  END IF;

  INSERT INTO xangarro.signup_attribution
    (business_id, source, medium, campaign, term, content, country, region)
  VALUES (
    p_business_id,
    left(coalesce(p_source, ''), 120),
    left(coalesce(p_medium, ''), 120),
    left(coalesce(p_campaign, ''), 120),
    left(coalesce(p_term, ''), 120),
    left(coalesce(p_content, ''), 120),
    v_country, v_region
  )
  ON CONFLICT (business_id) DO NOTHING;
END
$$;

REVOKE ALL ON FUNCTION xangarro.signup_attribution_record(
  text, text, text, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.signup_attribution_record(
  text, text, text, text, text, text, text, text
) TO xangarro_app;

ALTER TABLE xangarro.signup_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE xangarro.signup_attribution FORCE ROW LEVEL SECURITY;
