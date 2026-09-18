/**
 * Cloud schema — caja tables.
 *
 * Bootstrapped from the device's SQLite schema so that **column names are
 * identical on both sides by construction**, then maintained by hand.
 * `tests/drift.test.ts` is what keeps them that way: the sync wire format
 * addresses columns by name, so a silent rename would corrupt rows rather than
 * fail loudly.
 *
 * Types differ where Postgres has better ones — `timestamptz` for the audit
 * stamps, `bigint` for centavos — but never the names.
 */

import { sql } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { auditColumns, centavos } from './_columns';

export const cajaMovimientos = pgTable('caja_movimientos', {
  id: text('id').primaryKey(),
  turnoId: text('turno_id').notNull(),
  tipo: text('tipo', { enum: ['deposito', 'retiro'] }).notNull(),
  montoCentavos: centavos('monto_centavos').notNull(),
  motivo: text('motivo').notNull(),
  userId: text('user_id').notNull(),
  ...auditColumns,
});

export const cajaTurnos = pgTable('caja_turnos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  fecha: text('fecha').notNull(),
  aperturaAt: timestamp('apertura_at', { withTimezone: true, mode: 'string' }).notNull(),
  cierreAt: timestamp('cierre_at', { withTimezone: true, mode: 'string' }),
  montoAperturaCentavos: centavos('monto_apertura_centavos').notNull(),
  efectivoAdicionalCentavos: centavos('efectivo_adicional_centavos').notNull(),
  montoCierreCentavos: centavos('monto_cierre_centavos'),
  efectivoEsperadoCentavos: centavos('efectivo_esperado_centavos'),
  diferenciaCentavos: centavos('diferencia_centavos'),
  discrepancyReason: text('discrepancy_reason'),
  explicacion: text('explicacion'),
  totalTransferencias: centavos('total_transferencias')
    .notNull()
    .default(sql`0`),
  totalTarjeta: centavos('total_tarjeta')
    .notNull()
    .default(sql`0`),
  totalQr: centavos('total_qr')
    .notNull()
    .default(sql`0`),
  totalCredito: centavos('total_credito')
    .notNull()
    .default(sql`0`),
  egresoAutoId: text('egreso_auto_id'),
  conteoCentavos: centavos('conteo_centavos'),
  conteoAt: timestamp('conteo_at', { withTimezone: true, mode: 'string' }),
  ...auditColumns,
});

export const cancelacionLogs = pgTable('cancelacion_logs', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull(),
  cancelledByUserId: text('cancelled_by_user_id').notNull(),
  motivo: text('motivo').notNull(),
  montoOriginalCentavos: centavos('monto_original_centavos').notNull(),
  metodoOriginal: text('metodo_original', {
    enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'],
  }).notNull(),
  cashReturnedCentavos: centavos('cash_returned_centavos'),
  stockReversed: boolean('stock_reversed').notNull().default(false),
  cantidadDevuelta: integer('cantidad_devuelta'),
  productoId: text('producto_id'),
  ...auditColumns,
});

export const dayCloses = pgTable('day_closes', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  efectivoEsperadoCentavos: centavos('efectivo_esperado_centavos').notNull(),
  efectivoContadoCentavos: centavos('efectivo_contado_centavos').notNull(),
  diferenciaCentavos: centavos('diferencia_centavos').notNull(),
  explicacion: text('explicacion'),
  cerradoPor: text('cerrado_por', { enum: ['Operativo', 'Director'] }).notNull(),
  ...auditColumns,
});
