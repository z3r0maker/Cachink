-- The latency histogram stops being one hot row for the whole platform
-- (DB2-HOT-01; ADR-119).
--
-- 0042 counts every push, pull, entitlement and comprobante call with
-- `ON CONFLICT (day, endpoint, bucket_ms) DO UPDATE SET hits = hits + 1`.
-- Traffic lands in about three rows a day, so at the evening peak every call
-- from every tenant queues on the same row lock: the audit's batched-push run
-- put `api_latency_record` at 65.8 % of all statement time, 30 ms mean, almost
-- all of it lock wait — for a statistic.
--
-- Each call now picks one of 16 `slot`s at random, so concurrent calls
-- contend 16× less, and readers sum the slots. The function keeps its
-- signature and its callers; the console's `admin_sync_p95` already sums
-- `hits` per bucket, so it reads the slotted table unchanged. The table stays
-- bounded by construction: 4 endpoints × 15 buckets × 16 slots × 365 days is
-- about 350k rows a year at most, and `api_latency_prune` keeps 400 days.
--
-- Rows written before this file keep their counts in slot 0.
--
-- The three ALTERs take the table's ACCESS EXCLUSIVE lock, and every latency
-- write from every request queues behind a statement waiting for it. So they
-- wait only 200 ms (DB3-MIG-01); the runner retries the whole file with
-- backoff when that expires. `SET LOCAL`: the timeout dies with this file's
-- transaction instead of staying on the runner's session (R2-13).

SET LOCAL lock_timeout = '200ms';

ALTER TABLE xangarro.api_latency_counters
  ADD COLUMN IF NOT EXISTS slot smallint NOT NULL DEFAULT 0;

ALTER TABLE xangarro.api_latency_counters
  DROP CONSTRAINT IF EXISTS api_latency_slot_range,
  ADD CONSTRAINT api_latency_slot_range CHECK (slot BETWEEN 0 AND 15);

ALTER TABLE xangarro.api_latency_counters
  DROP CONSTRAINT IF EXISTS api_latency_counters_pkey,
  ADD CONSTRAINT api_latency_counters_pkey PRIMARY KEY (day, endpoint, bucket_ms, slot);

/*
 * Record one call — 0042's body, with the slot. `random()` is enough: the
 * point is to spread concurrent writers, not to balance the slots exactly.
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

  INSERT INTO xangarro.api_latency_counters AS a (day, endpoint, bucket_ms, slot, hits)
  VALUES ((now() AT TIME ZONE 'America/Mexico_City')::date, v_endpoint, v_bucket,
          floor(random() * 16)::smallint, 1)
  ON CONFLICT (day, endpoint, bucket_ms, slot) DO UPDATE SET hits = a.hits + 1;
END
$$;

REVOKE ALL ON FUNCTION xangarro.api_latency_record(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.api_latency_record(text, integer) TO xangarro_app;
