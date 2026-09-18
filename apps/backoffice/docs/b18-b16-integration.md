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

## Not measurable: sync p95 (N-07 capacity card)

The card stays «sin datos». B-18 times every phone call in `deviceRoute`, but the `ms` only goes
to a stdout JSON line (`logApi`, `{evt:'api', endpoint, status, ms, …}`), and Sentry runs with
`tracesSampleRate: 0`. Nothing Postgres or the console can query holds it.

To feed `capacityStatus(p95, 800)` B-18 would need to expose, per call to `sync/push` and
`sync/pull`: `endpoint`, `ms`, and a timestamp, somewhere readable. Either:

- a Postgres table (`api_call_timings (endpoint, ms, at)`, append-only, pruned after 30 days,
  written by `deviceRoute` beside `logApi`), which the console reads with
  `percentile_cont(0.95) WITHIN GROUP (ORDER BY ms)` over the last 24 h; or
- Sentry performance tracing (`tracesSampleRate > 0`) plus a Sentry API read from the console,
  which adds a vendor dependency to the card.

The first keeps the card a single SQL read. Only `drizzleCapacityProbe` changes either way.

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
