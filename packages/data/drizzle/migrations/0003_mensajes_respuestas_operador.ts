/**
 * Migration 0003 — owner↔operator messages (C-19, ADR-075).
 *
 * Two new tables, no data to move: `mensajes_operador` (DOWN — the portal
 * writes, devices pull) and `respuestas_operador` (UP — the device writes
 * from the Avisos reply box). Read marks stay device-local by design, so
 * neither table carries them.
 */

export const migration0003Sql = `
-- mensajes_operador: owner → operator (DOWN; portal-written)
CREATE TABLE mensajes_operador (
  id TEXT PRIMARY KEY NOT NULL,
  operador_id TEXT NOT NULL,
  caja_turno_id TEXT,
  severidad TEXT NOT NULL CHECK (severidad IN ('info','aclaracion')),
  cuerpo TEXT NOT NULL,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint
CREATE INDEX idx_mensajes_operador_operador ON mensajes_operador (business_id, operador_id);
--> statement-breakpoint
-- respuestas_operador: operator → owner (UP; device-written)
CREATE TABLE respuestas_operador (
  id TEXT PRIMARY KEY NOT NULL,
  mensaje_id TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint
CREATE INDEX idx_respuestas_operador_mensaje ON respuestas_operador (business_id, mensaje_id);
--> statement-breakpoint
CREATE TRIGGER trg_mensajes_operador_ai AFTER INSERT ON mensajes_operador
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('mensajes_operador', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_mensajes_operador_au AFTER UPDATE ON mensajes_operador
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('mensajes_operador', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
CREATE TRIGGER trg_respuestas_operador_ai AFTER INSERT ON respuestas_operador
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('respuestas_operador', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_respuestas_operador_au AFTER UPDATE ON respuestas_operador
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('respuestas_operador', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
`.trim();
