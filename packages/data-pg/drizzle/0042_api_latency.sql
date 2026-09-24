-- Per-endpoint latency, as a bounded histogram (N-07's capacity card).
--
-- The card's sync p95 has read «sin datos» since it shipped: B-18 times every
-- phone call in `deviceRoute`, but the `ms` only reaches a stdout JSON line and
-- Sentry runs with `tracesSampleRate: 0`. Nothing Postgres can query holds it.
--
-- ── Why a histogram and not an event log ───────────────────────────────────
-- `apps/backoffice/docs/b18-b16-integration.md` proposed `api_call_timings
-- (endpoint, ms, at)` — one row per call, pruned at 30 days — read with
-- `percentile_cont`. That is exact, and it puts an unbounded append on the
-- hottest path the product has: every push and every pull from every device,
-- forever, with a retention job that has to keep running or the table is the
-- largest thing in the database. The same audit that asks for this card
-- (docs/audits/db-2026-09-17.md) is the one that sets N-51's partitioning
-- trigger at 50 M rows.
--
-- This is `xangarro.geo_counters`' shape instead, for its reasons (ADR-092):
-- an aggregate **from birth**, bounded by construction — 4 endpoints x 15
-- buckets x 365 days is about 22k rows a year — so no partitioning, no urgent
-- retention, and a device retrying in a loop increments an integer rather than
-- growing the table. One `ON CONFLICT DO UPDATE` per call, the same write the
-- login pixel already does on the sign-in path.
--
-- What that forfeits, permanently: the exact percentile, per-call outliers, and
-- any correlation to a business or a device. The card needs a number to compare
-- against 800 ms, and `bucket_ms` is each bucket's **upper** bound, so the
-- reader can only ever over-state latency — a capacity alarm that errs towards
-- crying wolf, never towards silence.
--
-- No business_id and no device_id: this is platform telemetry about our own
-- servers. A row saying "sync/push was slow today" belongs to no tenant, which
-- is also why nothing here needs a retention promise in the aviso.

CREATE TABLE IF NOT EXISTS xangarro.api_latency_counters (
  day date NOT NULL,
  endpoint text NOT NULL,
  -- The bucket's inclusive upper bound in ms; 0 is the overflow bucket
  -- ("slower than the top bound"), which must sort last, not first.
  bucket_ms integer NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, endpoint, bucket_ms),
  CONSTRAINT api_latency_endpoint_known
    CHECK (endpoint IN ('sync/push', 'sync/pull', 'entitlement', 'comprobante')),
  CONSTRAINT api_latency_hits_positive CHECK (hits >= 0)
);

REVOKE ALL ON xangarro.api_latency_counters FROM PUBLIC;

-- No index beyond the primary key: `day` leads it and every read is a range
-- scan over a span of days, as it is for geo_counters.

/*
 * Record one call. The bucket is computed here so no caller can invent a
 * bound, and `day` is CDMX's so no caller can backdate a row.
 *
 * An unknown endpoint raises rather than quietly opening a fifth dimension —
 * the table is bounded only as long as that list is. The caller swallows the
 * error (a statistic must never fail a phone's sync), so a typo surfaces in
 * Sentry instead of in the data.
 */
CREATE OR REPLACE FUNCTION xangarro.api_latency_record(p_endpoint text, p_ms integer)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_endpoint text := trim(coalesce(p_endpoint, ''));
  v_ms integer := greatest(coalesce(p_ms, 0), 0);
  v_bucket integer;
BEGIN
  IF v_endpoint NOT IN ('sync/push', 'sync/pull', 'entitlement', 'comprobante') THEN
    RAISE EXCEPTION 'unknown api endpoint %', v_endpoint USING ERRCODE = '22023';
  END IF;

  -- Bounds chosen around the 800 ms trigger (ADR-068): dense where the alarm
  -- lives, coarse where the answer is only "fast" or "far too slow".
  v_bucket := CASE
    WHEN v_ms <= 25 THEN 25
    WHEN v_ms <= 50 THEN 50
    WHEN v_ms <= 100 THEN 100
    WHEN v_ms <= 200 THEN 200
    WHEN v_ms <= 300 THEN 300
    WHEN v_ms <= 400 THEN 400
    WHEN v_ms <= 500 THEN 500
    WHEN v_ms <= 600 THEN 600
    WHEN v_ms <= 700 THEN 700
    WHEN v_ms <= 800 THEN 800
    WHEN v_ms <= 1000 THEN 1000
    WHEN v_ms <= 1500 THEN 1500
    WHEN v_ms <= 2000 THEN 2000
    WHEN v_ms <= 5000 THEN 5000
    ELSE 0
  END;

  INSERT INTO xangarro.api_latency_counters AS a (day, endpoint, bucket_ms, hits)
  VALUES ((now() AT TIME ZONE 'America/Mexico_City')::date, v_endpoint, v_bucket, 1)
  ON CONFLICT (day, endpoint, bucket_ms) DO UPDATE SET hits = a.hits + 1;
END
$$;

REVOKE ALL ON FUNCTION xangarro.api_latency_record(text, integer) FROM PUBLIC;

/*
 * Retention, for the reason `geo_prune` exists: data nobody is using should
 * not be kept indefinitely, even as an aggregate. A definer function because
 * no role holds DELETE, and `p_keep_days` is clamped so a caller cannot erase
 * the history in one call.
 */
CREATE OR REPLACE FUNCTION xangarro.api_latency_prune(p_keep_days integer DEFAULT 400)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_keep integer := greatest(coalesce(p_keep_days, 400), 90);
  v_deleted integer;
BEGIN
  DELETE FROM xangarro.api_latency_counters
  WHERE day < (now() AT TIME ZONE 'America/Mexico_City')::date - v_keep;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END
$$;

REVOKE ALL ON FUNCTION xangarro.api_latency_prune(integer) FROM PUBLIC;

/*
 * The console's read: p95 of the sync endpoints, from the histogram above.
 *
 * It lives here rather than in the console's own migrations — where
 * `admin_geo_rollup` sits — because both halves of one contract belong
 * together: the writer decides that `bucket_ms` is an *upper* bound and that 0
 * means overflow, and this reader is the only thing that has to agree. Split
 * across two migration sets, the day someone changes a bound is the day the
 * two halves disagree silently.
 *
 * ── What this p95 is, exactly ──────────────────────────────────────────────
 * The smallest bucket whose cumulative share reaches 95 %, reported as that
 * bucket's upper bound. The answer is rounded *up* to a bound the calls did
 * not necessarily reach: against the card's 800 ms trigger (ADR-068) it can
 * cry wolf, never fall silent. An exact percentile would need the per-call
 * rows this table exists to avoid.
 *
 * The grain is a **day**, because that is the grain the counters are kept at.
 * `p_days = 1` is "today so far", not "the last 24 hours" — a window this
 * function cannot honestly offer.
 */
CREATE OR REPLACE FUNCTION xangarro.admin_sync_p95(p_days integer DEFAULT 1)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  WITH por_bucket AS (
    SELECT CASE WHEN a.bucket_ms = 0 THEN 2147483647 ELSE a.bucket_ms END AS orden,
           sum(a.hits) AS hits
      FROM xangarro.api_latency_counters a
     WHERE a.endpoint IN ('sync/push', 'sync/pull')
       AND a.day > (now() AT TIME ZONE 'America/Mexico_City')::date
                   - greatest(coalesce(p_days, 1), 1)
     GROUP BY 1
  ),
  acumulado AS (
    SELECT orden,
           sum(hits) OVER (ORDER BY orden ROWS UNBOUNDED PRECEDING) AS hasta_aqui,
           sum(hits) OVER () AS total
      FROM por_bucket
  )
  -- `least(min(orden), 5000)` looks equivalent and is not: `least` ignores
  -- NULLs, so an empty table answered 5000 — a red 5-second p95 on a database
  -- where nothing had synced. CASE propagates the NULL, and NULL is «sin datos».
  SELECT CASE WHEN min(orden) = 2147483647 THEN 5000 ELSE min(orden) END::integer
    FROM acumulado
   WHERE total > 0
     AND hasta_aqui::numeric >= total::numeric * 0.95;
$$;

REVOKE ALL ON FUNCTION xangarro.admin_sync_p95(integer) FROM PUBLIC;

-- Zero policies with RLS forced, so even a future stray GRANT denies every
-- row: the function bodies are the whole surface, as they are for geo_counters.
ALTER TABLE xangarro.api_latency_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE xangarro.api_latency_counters FORCE ROW LEVEL SECURITY;

REVOKE ALL ON xangarro.api_latency_counters FROM xangarro_app;
GRANT EXECUTE ON FUNCTION xangarro.api_latency_record(text, integer) TO xangarro_app;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    -- The console reads this data and prunes it; it never records a call.
    EXECUTE 'REVOKE ALL ON xangarro.api_latency_counters FROM xangarro_admin';
    EXECUTE 'GRANT USAGE ON SCHEMA xangarro TO xangarro_admin';
    EXECUTE 'GRANT EXECUTE ON FUNCTION xangarro.api_latency_prune(integer) TO xangarro_admin';
    EXECUTE 'GRANT EXECUTE ON FUNCTION xangarro.admin_sync_p95(integer) TO xangarro_admin';
  END IF;
END
$$;
