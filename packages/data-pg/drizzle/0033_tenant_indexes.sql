-- Tenant-leading indexes (DB-IDX-01, the 2026-09-17 database audit).
--
-- RLS filters every read by `business_id`, and only two tables had an index
-- leading with it. Every other portal query therefore scanned all tenants'
-- rows and discarded them in the policy. The audit measured 24–169 ms before
-- and 0.02–3.9 ms after at 200 tenants, and seq-scan time grows with the
-- table's TOTAL rows, not the tenant's — so the cost is set by the largest
-- tenant and by ADR-068's ~36 M rows a year, not by the reader.
--
-- One index per tenant table, leading with `business_id`, with the second
-- column chosen for the query that table serves (fecha for the ledgers and
-- cortes, nombre for the catalogues, seq for the pull cursor). Tables whose
-- primary key already leads with `business_id` (`celebraciones`, `sync_log`)
-- need nothing: Postgres backs a PK with an index.
--
-- Deviation from the audit's §2.2: these are NOT partial on
-- `deleted_at IS NULL`. A partial index only serves a query that repeats the
-- predicate, and not every read filters soft deletes; an unconditional index
-- is a little larger and always usable. Revisit when the tables are big
-- enough for the size to matter.
--
-- `IF NOT EXISTS` throughout: four of these names already exist from earlier
-- migrations, and the file must be replayable on a database at any point in
-- the series.

CREATE INDEX IF NOT EXISTS "activation_codes_business_idx" ON public."activation_codes" ("business_id");
CREATE INDEX IF NOT EXISTS "assisted_import_files_business_idx" ON public."assisted_import_files" ("business_id");
CREATE INDEX IF NOT EXISTS "assisted_imports_business_idx" ON public."assisted_imports" ("business_id");
CREATE INDEX IF NOT EXISTS "auditorias_inventario_business_idx" ON public."auditorias_inventario" ("business_id");
CREATE INDEX IF NOT EXISTS "billing_customers_business_idx" ON public."billing_customers" ("business_id");
CREATE INDEX IF NOT EXISTS "business_logos_business_idx" ON public."business_logos" ("business_id");
CREATE INDEX IF NOT EXISTS "business_members_business_idx" ON public."business_members" ("business_id");
CREATE INDEX IF NOT EXISTS "business_onboarding_business_idx" ON public."business_onboarding" ("business_id");
CREATE INDEX IF NOT EXISTS "businesses_business_idx" ON public."businesses" ("business_id");
CREATE INDEX IF NOT EXISTS "caja_movimientos_business_idx" ON public."caja_movimientos" ("business_id");
CREATE INDEX IF NOT EXISTS "caja_turnos_business_idx" ON public."caja_turnos" ("business_id", "fecha");
CREATE INDEX IF NOT EXISTS "cancelacion_logs_business_idx" ON public."cancelacion_logs" ("business_id");
CREATE INDEX IF NOT EXISTS "cfdi_payments_business_idx" ON public."cfdi_payments" ("business_id");
CREATE INDEX IF NOT EXISTS "client_payments_business_idx" ON public."client_payments" ("business_id", "fecha");
CREATE INDEX IF NOT EXISTS "clients_business_idx" ON public."clients" ("business_id", "nombre");
CREATE INDEX IF NOT EXISTS "conversion_recetas_business_idx" ON public."conversion_recetas" ("business_id");
CREATE INDEX IF NOT EXISTS "conversions_business_idx" ON public."conversions" ("business_id");
CREATE INDEX IF NOT EXISTS "day_closes_business_idx" ON public."day_closes" ("business_id", "fecha");
CREATE INDEX IF NOT EXISTS "devices_business_idx" ON public."devices" ("business_id");
CREATE INDEX IF NOT EXISTS "employees_business_idx" ON public."employees" ("business_id");
CREATE INDEX IF NOT EXISTS "entregas_credito_business_idx" ON public."entregas_credito" ("business_id");
CREATE INDEX IF NOT EXISTS "expenses_business_idx" ON public."expenses" ("business_id", "fecha");
CREATE INDEX IF NOT EXISTS "inventory_movements_business_idx" ON public."inventory_movements" ("business_id", "fecha");
CREATE INDEX IF NOT EXISTS "mensajes_operador_business_idx" ON public."mensajes_operador" ("business_id");
CREATE INDEX IF NOT EXISTS "metas_business_idx" ON public."metas" ("business_id");
CREATE INDEX IF NOT EXISTS "notice_preferences_business_idx" ON public."notice_preferences" ("business_id");
CREATE INDEX IF NOT EXISTS "opening_balance_clients_business_idx" ON public."opening_balance_clients" ("business_id");
CREATE INDEX IF NOT EXISTS "opening_balances_business_idx" ON public."opening_balances" ("business_id");
CREATE INDEX IF NOT EXISTS "products_business_idx" ON public."products" ("business_id", "nombre");
CREATE INDEX IF NOT EXISTS "recurring_expenses_business_idx" ON public."recurring_expenses" ("business_id");
CREATE INDEX IF NOT EXISTS "respuestas_operador_business_idx" ON public."respuestas_operador" ("business_id");
CREATE INDEX IF NOT EXISTS "sales_business_idx" ON public."sales" ("business_id", "fecha");
CREATE INDEX IF NOT EXISTS "subscriptions_business_idx" ON public."subscriptions" ("business_id", "updated_at");
CREATE INDEX IF NOT EXISTS "sync_cursors_business_idx" ON public."sync_cursors" ("business_id");
CREATE INDEX IF NOT EXISTS "sync_receipts_business_idx" ON public."sync_receipts" ("business_id");
CREATE INDEX IF NOT EXISTS "sync_rejections_business_idx" ON public."sync_rejections" ("business_id", "resolved_at");
CREATE INDEX IF NOT EXISTS "tickets_business_idx" ON public."tickets" ("business_id", "fecha");
CREATE INDEX IF NOT EXISTS "usage_counters_business_idx" ON public."usage_counters" ("business_id");
CREATE INDEX IF NOT EXISTS "usage_notices_business_idx" ON public."usage_notices" ("business_id");
CREATE INDEX IF NOT EXISTS "users_business_idx" ON public."users" ("business_id");
