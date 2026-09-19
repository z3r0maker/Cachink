-- Clients gain an optional RFC (N-16: the Clientes import template carries
-- one). Nullable and additive: every pre-0020 row keeps its shape with
-- `rfc = NULL`, the DOWN wire sends it only when set, and old devices strip
-- what they do not know. The SQLite half of the column lands with the app
-- branch (C-15-style split), so the phone keeps writing clients without it.
--
-- No grants change: the column inherits `clients`'s table ACLs, which
-- `xangarro_app` already holds from 0000/0009.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS rfc text;
