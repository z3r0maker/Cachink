/**
 * What the 90-day retention purge may delete, per UP table (A-11), in the
 * order it runs: children before parents so foreign keys hold.
 *
 * Beyond "server-acknowledged and older than the cutoff", a row stays when
 * the device still needs it:
 *   - `keep`   — still in use locally (unpaid credit ticket, open caja
 *                turno, payments and movimientos of those);
 *   - `guards` — still referenced by a row that was kept.
 * Products and clients (HYBRID) are reference data and are never purged.
 * Payment state lives on the ticket header since ADR-073; abonos belong
 * to the client since ADR-074.
 */

export interface RetentionRule {
  readonly table: string;
  /** SQL over alias `t`: when true the row is kept. */
  readonly keep?: string;
  /** `[childTable, childColumn]` pairs that must not reference the row. */
  readonly guards?: ReadonlyArray<readonly [string, string]>;
}

export const RETENTION_DAYS = 90;

export const RETENTION_RULES: readonly RetentionRule[] = [
  {
    table: 'client_payments',
    keep: "t.cliente_id IN (SELECT cliente_id FROM tickets WHERE estado_pago <> 'pagado' AND cliente_id IS NOT NULL)",
  },
  { table: 'respuestas_operador' },
  { table: 'cancelacion_logs' },
  { table: 'conversions' },
  {
    table: 'caja_movimientos',
    keep: 't.turno_id IN (SELECT id FROM caja_turnos WHERE cierre_at IS NULL)',
  },
  {
    table: 'sales',
    keep: "t.ticket_id IN (SELECT id FROM tickets WHERE estado_pago <> 'pagado')",
    guards: [],
  },
  {
    table: 'tickets',
    keep: "t.estado_pago <> 'pagado'",
    guards: [
      ['sales', 'ticket_id'],
      ['client_payments', 'cliente_id'],
      ['cancelacion_logs', 'ticket_id'],
    ],
  },
  {
    table: 'caja_turnos',
    keep: 't.cierre_at IS NULL',
    guards: [
      ['tickets', 'caja_turno_id'],
      ['caja_movimientos', 'turno_id'],
    ],
  },
  {
    table: 'inventory_movements',
    guards: [
      ['conversions', 'movimiento_salida_id'],
      ['conversions', 'movimiento_entrada_id'],
    ],
  },
  { table: 'expenses', guards: [['caja_turnos', 'egreso_auto_id']] },
  { table: 'day_closes' },
  { table: 'entregas_credito' },
  { table: 'auditorias_inventario' },
];
