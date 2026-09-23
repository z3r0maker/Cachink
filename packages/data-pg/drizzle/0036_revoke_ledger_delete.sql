-- DB-RLS-01 (N-27 audit, closes B-03): the app role can no longer hard-delete.
--
-- `0001_rls.sql` granted `SELECT, INSERT, UPDATE, DELETE ON ALL TABLES` to
-- `xangarro_app` and made DELETE a default privilege for every table created
-- since. Later migrations revoked it one table at a time (0025, 0026, …), but
-- the ledger from `0000_*` — sales, expenses, inventory_movements, tickets,
-- sync_log — was never covered, and `tenant_isolation` carries no `FOR`
-- clause, so it permits DELETE as readily as SELECT. One portal bug could
-- hard-delete a tenant's books, which breaks "rows are never dropped" and CFF
-- art. 30 retention (ADR-064).
--
-- No production path deletes as `xangarro_app`: the portal soft-deletes
-- (`users_active`, `business_archive`), the assisted-import purge and the
-- dormancy job run as `xangarro_admin`, and pruning is SECURITY DEFINER. So
-- the revoke is blanket, and the default privilege goes with it so a table
-- added tomorrow does not quietly reopen the hole. A future intentional
-- delete gets its own per-table `GRANT DELETE` with the reason next to it.
--
-- `0001` says of itself that it is "not pushable as written". That was true
-- for the PostgREST/`authenticated` posture it was written against; ADR-079
-- and ADR-080 replaced it (own auth, the portal connects as `xangarro_app`,
-- the Data API is off and its grants revoked by `hosted/0000`). The file is
-- left as applied — migrations are append-only (CLAUDE.md §2.9).
--
-- `tests/ledger-delete.integration.test.ts` proves all three: no DELETE
-- privilege remains on any public table, a DELETE on the ledger is refused
-- even for the tenant's own rows, and a table created after this migration
-- inherits none.

REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM xangarro_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE DELETE ON TABLES FROM xangarro_app;
