# DB scale benchmark (audit 2026-09-26)

Reproduces the numbers in `../db-2026-09-26.html`. Throwaway container only — never the shared `xangarro-pg`.

1. Start a disposable Postgres 17 (`--cpus=4 --memory=4g`, `max_wal_size=1GB`), then
   `XG_PG_NAME=<name> XG_PG_PORT=55498 packages/data-pg/scripts/db-local.sh apply`.
   Check `docker run --rm alpine df -h /` first: the load needs ~10 GB of the Docker VM's disk.
2. `psql … -f 01_tenants.sql`, `02_ledger.sql`, then `03_sync.sql` (≈3 min, 8.2 GB).
3. Reads: `./q.sh <business_id> "<label>" "<sql>"` — runs as `xangarro_app` with the tenant claim.
4. Push: `node docs/audits/db-2026-09-26-bench/push.mjs <rows|batch> <ticketsPerPush> <clients> <seconds> [hot] [rttMs]`
   from the repo root. `rows` replays today's per-row push; `batch` is the proposed one.
