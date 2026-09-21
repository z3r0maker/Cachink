/**
 * Migration 0011 — `origen` on `inventory_movements` (C-12 step 7).
 *
 * Where a movement came from: `manual` (a person on a phone), `portal` (the
 * owner, in the web), `apertura` (N-17's one-time opening stock), `venta`,
 * `cancelacion`, `conversion` (use-case writes). Usage counts only `manual`
 * and `portal` (OQ-5). Existing rows are backfilled with the same heuristic
 * `classifyMovementOrigin` applies (apertura motivo first — those rows are
 * portal-written — then the portal device, then the use-case motiva).
 * Postgres side: data-pg 0029.
 */

export const migration0011Sql = `
-- 0011_movimiento_origen
--> statement-breakpoint
ALTER TABLE inventory_movements ADD COLUMN origen TEXT NOT NULL DEFAULT 'manual'
--> statement-breakpoint
UPDATE inventory_movements SET origen = CASE
  WHEN motivo = 'Apertura de inventario' THEN 'apertura'
  WHEN device_id = '01HZ8XQN9GZJXV8AKQ5X0WEB01' THEN 'portal'
  WHEN motivo = 'Venta' THEN 'venta'
  WHEN motivo = 'Conversión' THEN 'conversion'
  WHEN motivo = 'Devolución de cliente' AND coalesce(nota, '') LIKE 'Cancelación de venta:%' THEN 'cancelacion'
  ELSE 'manual' END
`;
