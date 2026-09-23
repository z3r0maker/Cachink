-- Geographic analytics by Mexican state (N-55, ADR-092).
--
-- Lives in the `xangarro` schema beside `throttle` and `portal_sessions`,
-- where the app role has no table privileges and the SECURITY DEFINER function
-- below is the whole surface. Same pinned `search_path` as 0002 and 0005.
--
-- ── Why a daily counter and not an event log ────────────────────────────────
-- A per-event row carrying no IP still carries a timestamp, and a row reading
-- "BCS, 03:14" on a day with two visitors from Baja California Sur is close to
-- identifying a person. This table is an aggregate *from birth*: there is never
-- a moment at which a per-person row exists to leak, subpoena or mis-join.
-- It is also bounded — 3 sources x ~33 regions x 365 days is about 36k rows a
-- year, so no partitioning and no urgent retention job, and a bot hammering the
-- landing pixel increments an integer instead of growing the table.
--
-- What that forfeits, permanently: hour-of-day, page path, funnel, and any
-- per-visit dedup. If those are ever needed the escape hatch is an append-only
-- table plus a nightly rollup *behind the same read function*, with no caller
-- changes.
--
-- ── What is stored ──────────────────────────────────────────────────────────
-- `region` is the BARE ISO 3166-2 subdivision ('CHH'), which is what Vercel's
-- `x-vercel-ip-country-region` header actually sends — measured on a Hobby
-- deployment 2026-09-22, not the prefixed 'MX-CHH'. Readers prefix it with the
-- country to join against map geometry.
--
-- Unknown is recorded honestly and never guessed: country 'ZZ', region ''.
-- No IP, no city, no user id, no user agent, no per-event timestamp.

CREATE TABLE IF NOT EXISTS xangarro.geo_counters (
  day date NOT NULL,
  source text NOT NULL,
  country char(2) NOT NULL,
  region text NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, source, country, region),
  CONSTRAINT geo_counters_source_known CHECK (source IN ('login', 'compra', 'landing')),
  CONSTRAINT geo_counters_hits_positive CHECK (hits >= 0)
);

REVOKE ALL ON xangarro.geo_counters FROM PUBLIC;

-- No index beyond the primary key: `day` leads it, and every read is a range
-- scan over a span of days.

-- Count one visit. `day` is computed here, in CDMX time, so no caller can
-- backdate a row; an unknown source raises rather than silently recording a
-- typo under a fourth name.
CREATE OR REPLACE FUNCTION xangarro.geo_record(
  p_source text, p_country text, p_region text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_source text := lower(trim(coalesce(p_source, '')));
  v_country text := upper(trim(coalesce(p_country, '')));
  v_region text := upper(trim(coalesce(p_region, '')));
BEGIN
  IF v_source NOT IN ('login', 'compra', 'landing') THEN
    RAISE EXCEPTION 'unknown geo source %', v_source USING ERRCODE = '22023';
  END IF;
  IF v_country !~ '^[A-Z]{2}$' THEN
    v_country := 'ZZ';
    v_region := '';
  END IF;
  IF v_region !~ '^[A-Z0-9]{1,3}$' THEN
    v_region := '';
  END IF;

  INSERT INTO xangarro.geo_counters AS g (day, source, country, region, hits)
  VALUES ((now() AT TIME ZONE 'America/Mexico_City')::date, v_source, v_country, v_region, 1)
  ON CONFLICT (day, source, country, region) DO UPDATE SET hits = g.hits + 1;
END
$$;

REVOKE ALL ON FUNCTION xangarro.geo_record(text, text, text) FROM PUBLIC;
