# B-18 / B-16 in the admin console

What the console takes from B-18 (observability, `fb1a37b`) and B-16 (support tooling, `dc4d748`),
and what it cannot take yet.

## Reused: the rejection digest (N-10)

The staff digest's «Rechazos de sincronización (24 h)» section calls B-18's
`rejectionDigest(tx, since)` from `@xangarro/data-pg` unchanged (`src/server/db/rejections.ts`).
There is no second copy of the query. `0007_admin_sync_rejections_read.sql` gives `xangarro_admin`
SELECT on four columns of `sync_rejections` (`business_id, code, received_at, resolved_at`) and a
permissive `admin_read` policy, so the same function counts every tenant when the console runs it.
`payload` and `message` stay unreadable. Checked against a scratch Postgres: two tenants' unresolved
rows counted together; resolved and >24 h rows left out; `payload` and `UPDATE` both denied.

A failed read does not stop the email: the section says «No disponible» and the cron logs it.

## Measured since 2026-09-24: sync p95 (N-07 capacity card)

The card read «sin datos» because B-18's `ms` only reached a stdout JSON line (`logApi`) and
Sentry runs with `tracesSampleRate: 0`. It now reads a number.

This note proposed two options: an `api_call_timings (endpoint, ms, at)` table with one row per
call, or Sentry performance tracing. **Neither was taken.** A row per call is an unbounded append
on the hottest path the product has — every push and pull from every device — kept honest only by
a retention job that has to keep running, in a database whose own audit sets N-51's partitioning
trigger at 50 M rows. Sentry adds a vendor dependency to a card that should be one SQL read.

What shipped is `xangarro.api_latency_counters` (data-pg `0042_api_latency.sql`), shaped like
`geo_counters` and for its reasons: a **bounded histogram** of `(day, endpoint, bucket_ms) → hits`,
about 22k rows a year, written with one `ON CONFLICT DO UPDATE` per call from `deviceRoute` beside
`logApi` — not awaited, never able to fail a phone's sync. `xangarro.admin_sync_p95(p_days)` reads
it, and lives in the same migration as the writer because both halves of one contract — `bucket_ms`
is an _upper_ bound, 0 is overflow — have to agree.

What that forfeits, permanently: the exact percentile, per-call outliers, and any correlation to a
business or a device. The p95 is the smallest bucket whose cumulative share reaches 95 %, reported
as that bucket's bound, so it rounds **up**: against the 800 ms trigger the card can cry wolf,
never fall silent. It is «sin datos» — null, not a number — when no sync was recorded.

The counters are pruned at 400 days on the same daily cron as the geo counters
(`pruneApiLatency`). Only `drizzleCapacityProbe` changed on the console side, as this note
predicted.

## Overlap with B-16's Studio queries (noted, not changed)

- **"Last seen" rule in three places:** `supabase/studio/stale-devices.sql`,
  `src/server/db/tenants.ts` and `src/server/db/tenant-queries.ts` each spell
  `GREATEST(last_push_at, last_pull_at)`. N-07's active-tenant count (`src/server/db/capacity.ts`)
  uses `last_push_at` only — a different definition of activity, on purpose or not.
- **Unresolved rejections:** `supabase/studio/unresolved-rejections.sql` re-states
  `rejectionDigest`'s filter (`resolved_at IS NULL`) with a per-business breakdown. N-46 replaces
  the Studio query; when it does, a per-business variant belongs next to `rejectionDigest` in
  `packages/data-pg`, not in the console.
- B-16's `0006_security_support.sql` functions (`security_prune`, `session_revoke_user`) do not
  overlap anything in N-06/N-07.
