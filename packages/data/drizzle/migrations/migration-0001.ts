/**
 * Raw SQL for migration 0001 — mirrors `0001_change_log_and_sync_state.sql`.
 *
 * Introduces the sync infrastructure tables (`__cachink_change_log`,
 * `__cachink_sync_state`, `__cachink_conflicts`) plus `AFTER INSERT` and
 * `AFTER UPDATE` triggers on each of the 10 synced business tables. The
 * triggers record a row in `__cachink_change_log` for every row-level
 * change so sync clients can paginate by autoincrementing `id`.
 *
 * See ADR-029 (LAN wire protocol) and ADR-030 (change-log triggers).
 */

export const migration0001Sql = `CREATE TABLE \`__cachink_change_log\` (
\t\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
\t\`table_name\` text NOT NULL,
\t\`row_id\` text NOT NULL,
\t\`row_updated_at\` text NOT NULL,
\t\`row_device_id\` text NOT NULL,
\t\`op\` text NOT NULL,
\t\`captured_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
\tCHECK (op IN ('insert', 'update'))
);
--> statement-breakpoint
CREATE INDEX \`idx_cachink_change_log_id\` ON \`__cachink_change_log\` (\`id\`);
--> statement-breakpoint
CREATE TABLE \`__cachink_sync_state\` (
\t\`scope\` text PRIMARY KEY NOT NULL,
\t\`value\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`__cachink_conflicts\` (
\t\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
\t\`detected_at\` text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
\t\`direction\` text NOT NULL,
\t\`table_name\` text NOT NULL,
\t\`row_id\` text NOT NULL,
\t\`loser_updated_at\` text NOT NULL,
\t\`loser_device_id\` text NOT NULL,
\t\`winner_updated_at\` text NOT NULL,
\t\`winner_device_id\` text NOT NULL,
\t\`reason\` text NOT NULL,
\tCHECK (direction IN ('inbound', 'outbound'))
);
--> statement-breakpoint
CREATE INDEX \`idx_cachink_conflicts_detected_at\` ON \`__cachink_conflicts\` (\`detected_at\`);
--> statement-breakpoint
CREATE TRIGGER \`trg_sales_ai\` AFTER INSERT ON \`sales\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_sales_au\` AFTER UPDATE ON \`sales\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_expenses_ai\` AFTER INSERT ON \`expenses\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('expenses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_expenses_au\` AFTER UPDATE ON \`expenses\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('expenses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_products_ai\` AFTER INSERT ON \`products\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('products', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_products_au\` AFTER UPDATE ON \`products\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('products', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_inventory_movements_ai\` AFTER INSERT ON \`inventory_movements\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('inventory_movements', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_inventory_movements_au\` AFTER UPDATE ON \`inventory_movements\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('inventory_movements', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_employees_ai\` AFTER INSERT ON \`employees\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('employees', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_employees_au\` AFTER UPDATE ON \`employees\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('employees', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_clients_ai\` AFTER INSERT ON \`clients\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('clients', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_clients_au\` AFTER UPDATE ON \`clients\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('clients', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_client_payments_ai\` AFTER INSERT ON \`client_payments\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('client_payments', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_client_payments_au\` AFTER UPDATE ON \`client_payments\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('client_payments', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_day_closes_ai\` AFTER INSERT ON \`day_closes\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('day_closes', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_day_closes_au\` AFTER UPDATE ON \`day_closes\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('day_closes', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_recurring_expenses_ai\` AFTER INSERT ON \`recurring_expenses\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('recurring_expenses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_recurring_expenses_au\` AFTER UPDATE ON \`recurring_expenses\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('recurring_expenses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_businesses_ai\` AFTER INSERT ON \`businesses\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('businesses', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER \`trg_businesses_au\` AFTER UPDATE ON \`businesses\`
BEGIN
\tINSERT INTO \`__cachink_change_log\` (\`table_name\`, \`row_id\`, \`row_updated_at\`, \`row_device_id\`, \`op\`)
\tVALUES ('businesses', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;`;
