-- E-44: the migration ledger db:migrate:hosted keeps (data-pg's
-- scripts/hosted/ledger.ts, `ensureLedger`). `importar` creates it on the
-- target and copies in the corp rows, so the next corp migration there starts
-- at the right file. data-pg's tests/salida-ledger.test.ts holds this to the
-- runner's table.
CREATE SCHEMA IF NOT EXISTS xangarro_ops;
REVOKE ALL ON SCHEMA xangarro_ops FROM PUBLIC;
CREATE TABLE IF NOT EXISTS xangarro_ops.migrations (
  name text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
