-- xangarro:no-transaction
--
-- The indexes the 2026-09-26 scale audit measured (DB2-IDX-01, DB2-USE-01;
-- ADR-117), as round 3 corrected them before any database applied the file
-- (DB3-MIG-01, DB3-IDX-01, DB3-QRY-01, DB3-OPS-01). The first file to use
-- the runner's no-transaction mode: each statement below commits on its own,
-- so every build is CONCURRENTLY and never blocks the writes of a table
-- with millions of rows. The runner re-runs the whole file after a failure,
-- so each statement is repeatable, and it drops the INVALID index an
-- interrupted build leaves behind first.
--
-- `db-local.sh` applies it with `psql -f`, which already sends statement by
-- statement outside any transaction.
--
-- No lock timeout (DB3-MIG-01). Everything here takes SHARE UPDATE EXCLUSIVE
-- at most, which no reader or writer waits on. A concurrent build also waits
-- for every transaction in the database that holds an older snapshot — a
-- 60 s metering recount, a slow report — and under the 3 s this file first
-- had, that wait failed the build and left an INVALID index behind. Waiting
-- harms nobody here; `pg_stat_activity` shows what it is waiting for.

SET lock_timeout = 0;

-- A duplicate membership would make the unique build below fail half-way.
-- Refuse up front, naming the fix, before anything is built.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.business_members
     GROUP BY business_id, user_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'business_members has duplicate (business_id, user_id) rows'
      USING HINT = 'Keep one row per member (the highest role), then re-run.';
  END IF;
END
$$;

-- ── Usage recount and recent activity (DB2-USE-01) ─────────────────────────
-- `xangarro.usage_counts` filters on created_at; with only (business_id,
-- fecha) the planner chose a parallel seq scan of every tenant's rows:
-- 0.6–1.2 s per push, whatever the tenant's size. 17–148 ms with these.
-- The INCLUDEd column is the one other thing the recount reads, so it never
-- visits the heap (DB3-IDX-01: 2,124 heap blocks against 95 index blocks).
CREATE INDEX CONCURRENTLY IF NOT EXISTS sales_business_created_idx
  ON public.sales (business_id, created_at) INCLUDE (ticket_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS expenses_business_created_idx
  ON public.expenses (business_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS inventory_movements_business_created_idx
  ON public.inventory_movements (business_id, created_at) INCLUDE (origen);

-- ── Stock per product (DB2-QRY-05's interim step) ──────────────────────────
-- Seven readers sum a product's movements; covering, so none visits the heap.
CREATE INDEX CONCURRENTLY IF NOT EXISTS inventory_movements_business_producto_idx
  ON public.inventory_movements (business_id, producto_id) INCLUDE (tipo, cantidad, deleted_at);

-- ── Keyset lists (DB2-QRY-02) ───────────────────────────────────────────────
-- `ORDER BY fecha DESC, id DESC LIMIT n` over live rows, one tenant.
CREATE INDEX CONCURRENTLY IF NOT EXISTS sales_business_fecha_id_live_idx
  ON public.sales (business_id, fecha DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS expenses_business_fecha_id_live_idx
  ON public.expenses (business_id, fecha DESC, id DESC) WHERE deleted_at IS NULL;

-- ── Lookups by turno, client and product (/cortes, fiado, revisión) ───────
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_business_turno_idx
  ON public.tickets (business_id, caja_turno_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS expenses_business_turno_idx
  ON public.expenses (business_id, caja_turno_id);
-- Only fiado tickets name a client; the rest would be index weight for nothing.
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_business_cliente_idx
  ON public.tickets (business_id, cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS sales_business_producto_idx
  ON public.sales (business_id, producto_id);

-- ── Cancelled tickets (DB3-QRY-01) ─────────────────────────────────────────
-- Every total excludes cancelled sales with `NOT EXISTS (tickets … cancelled_at
-- IS NOT NULL)`, which hashed all of a tenant's tickets (77 ms on the audit's
-- whale, growing with history) and once flipped to a 19.5 s plan. Cancelled
-- tickets are few, so this stays tiny: 45 ms whatever the history.
CREATE INDEX CONCURRENTLY IF NOT EXISTS tickets_business_cancelled_idx
  ON public.tickets (business_id, id) WHERE cancelled_at IS NOT NULL;

-- ── Sync history (/sincronizacion) ─────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS sync_receipts_business_received_idx
  ON public.sync_receipts (business_id, received_at);

-- ── The login path (carried from DB-IDX-02) ────────────────────────────────
-- `memberships_for_user` and `session_resolve` look a member up by user; and
-- one person is one member of a business, which nothing enforced until now.
CREATE INDEX CONCURRENTLY IF NOT EXISTS business_members_user_idx
  ON public.business_members (user_id);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS business_members_business_user_uq
  ON public.business_members (business_id, user_id);

-- ── Portal sessions by business (archive, the console's last login) ────────
-- Not (business_id, last_seen_at): `session_resolve` updates last_seen_at, and
-- an indexed column makes every such touch a non-HOT update (DB3-IDX-01).
CREATE INDEX CONCURRENTLY IF NOT EXISTS portal_sessions_business_idx
  ON xangarro.portal_sessions (business_id);

-- ── Usage history by month (every business) ────────────────────────────────
-- `usageCountersOf` asks for a few periods across all tenants; the primary
-- key leads with business_id and cannot serve `period IN (…)`.
CREATE INDEX CONCURRENTLY IF NOT EXISTS usage_counters_period_idx
  ON public.usage_counters (period, business_id);

-- ── Redundant: each repeats its table's primary key or a prefix of it ─────
-- Pure write cost (79 MB on sync_receipts, the hottest table). The primary
-- key still leads with business_id, which is what DB-IDX-01's guard asks.
DROP INDEX CONCURRENTLY IF EXISTS public.sync_receipts_business_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.sync_cursors_business_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.billing_customers_business_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.business_logos_business_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.business_onboarding_business_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.notice_preferences_business_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.usage_counters_business_idx;

-- ── Redundant after the builds above (DB3-IDX-01) ──────────────────────────
-- A prefix of business_members_business_user_uq.
DROP INDEX CONCURRENTLY IF EXISTS public.business_members_business_idx;
-- (business_id, fecha): every query that ranges sales or expenses by fecha
-- also says `deleted_at IS NULL`, so the partial *_business_fecha_id_live_idx
-- serves it, and on sales the pair doubled insert time (1.20 → 2.43 s per
-- 300K rows). Each table keeps other business_id-leading indexes for the
-- tenant guard (tests/tenant-indexes*.test.ts).
DROP INDEX CONCURRENTLY IF EXISTS public.sales_business_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.expenses_business_idx;

-- ── Storage and autovacuum per table (DB3-OPS-01) ──────────────────────────
-- `SET (…)` of these options takes SHARE UPDATE EXCLUSIVE, like the builds.
-- Rows updated in place all day keep room on their page, so the update stays
-- HOT (no index write, no page split):
ALTER TABLE public.devices SET (fillfactor = 80);
ALTER TABLE public.sync_cursors SET (fillfactor = 80);
ALTER TABLE xangarro.throttle SET (fillfactor = 80);
ALTER TABLE xangarro.api_latency_counters SET (fillfactor = 80);
ALTER TABLE xangarro.portal_sessions SET (fillfactor = 80);
-- Append-mostly tables get vacuumed (visibility map, so index-only scans stay
-- index-only) and analysed (fresh statistics, so plans do not flip — the
-- 19.5 s of DB3-QRY-01) every 2 % of new rows instead of the default 20 % /
-- 10 %, which on a 50 M-row table meant millions of rows between runs.
ALTER TABLE public.sales
  SET (autovacuum_vacuum_insert_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.tickets
  SET (autovacuum_vacuum_insert_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.expenses
  SET (autovacuum_vacuum_insert_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.inventory_movements
  SET (autovacuum_vacuum_insert_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.sync_log
  SET (autovacuum_vacuum_insert_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.sync_receipts
  SET (autovacuum_vacuum_insert_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);
