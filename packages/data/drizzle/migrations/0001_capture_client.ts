/**
 * Migration 0001 — capture client (A-17, ADR-053).
 *
 *   1. `users.active` — portal-managed deactivation; existing rows stay active.
 *   2. `__sync_row_status` — per-row cloud outcome (pending / accepted /
 *      rejected with server code), so a rejected row is never silently lost
 *      (Q4) and retention can purge only server-acknowledged rows (Q9).
 *   3. Change-log triggers for the six UP tables that LAN sync never
 *      captured — caja_turnos, caja_movimientos, cancelacion_logs,
 *      entregas_credito, conversions, auditorias_inventario. Without them
 *      shifts and cancellations would never reach the cloud.
 *
 * Deliberately NOT here: dropping users.role / must_change_pin /
 * recovery_password_hash / email. They go with the domain removal in A-05
 * (the first-run path still writes them until activation replaces it).
 */

export const migration0001Sql = `
-- 0001_capture_client
--> statement-breakpoint
ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1
--> statement-breakpoint
CREATE TABLE __sync_row_status (
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  status TEXT NOT NULL,
  server_seq INTEGER,
  code TEXT,
  message TEXT,
  retryable INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  retry_after TEXT,
  last_attempt_at TEXT,
  PRIMARY KEY (table_name, row_id),
  CHECK (status IN ('pending', 'accepted', 'rejected'))
)
--> statement-breakpoint
CREATE INDEX idx_sync_row_status_status ON __sync_row_status (status)
--> statement-breakpoint
CREATE TRIGGER trg_caja_turnos_ai AFTER INSERT ON caja_turnos
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('caja_turnos', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_caja_turnos_au AFTER UPDATE ON caja_turnos
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('caja_turnos', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_caja_movimientos_ai AFTER INSERT ON caja_movimientos
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('caja_movimientos', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_caja_movimientos_au AFTER UPDATE ON caja_movimientos
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('caja_movimientos', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_cancelacion_logs_ai AFTER INSERT ON cancelacion_logs
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('cancelacion_logs', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_cancelacion_logs_au AFTER UPDATE ON cancelacion_logs
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('cancelacion_logs', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_entregas_credito_ai AFTER INSERT ON entregas_credito
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('entregas_credito', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_entregas_credito_au AFTER UPDATE ON entregas_credito
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('entregas_credito', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_conversions_ai AFTER INSERT ON conversions
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('conversions', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_conversions_au AFTER UPDATE ON conversions
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('conversions', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_auditorias_inventario_ai AFTER INSERT ON auditorias_inventario
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('auditorias_inventario', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_auditorias_inventario_au AFTER UPDATE ON auditorias_inventario
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('auditorias_inventario', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
`.trim();
