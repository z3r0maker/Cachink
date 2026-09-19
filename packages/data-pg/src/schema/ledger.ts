/**
 * Cloud schema — ledger tables.
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

import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { auditColumns, centavos } from './_columns';

export const clientPayments = pgTable('client_payments', {
  id: text('id').primaryKey(),
  /** The abono belongs to the client (ADR-074); balances are derived. */
  clienteId: text('cliente_id').notNull(),
  fecha: text('fecha').notNull(),
  montoCentavos: centavos('monto_centavos').notNull(),
  metodo: text('metodo', {
    enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'],
  }).notNull(),
  nota: text('nota'),
  ...auditColumns,
});

export const entregasCredito = pgTable('entregas_credito', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id').notNull(),
  fecha: text('fecha').notNull(),
  totalCentavos: centavos('total_centavos').notNull(),
  nota: text('nota'),
  saleIds: text('sale_ids').notNull(),
  ...auditColumns,
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  fecha: text('fecha').notNull(),
  concepto: text('concepto').notNull(),
  categoria: text('categoria', {
    enum: [
      'Materia Prima',
      'Inventario',
      'Nómina',
      'Renta',
      'Servicios',
      'Publicidad',
      'Mantenimiento',
      'Impuestos',
      'Logística',
      'Otro',
    ],
  }).notNull(),
  /** Same key as the device (`monto`); the column is `monto_centavos`. */
  monto: centavos('monto_centavos').notNull(),
  proveedor: text('proveedor'),
  gastoRecurrenteId: text('gasto_recurrente_id'),
  /** The turno the gasto came out of (ADR-074). */
  cajaTurnoId: text('caja_turno_id'),
  ...auditColumns,
});

export const recurringExpenses = pgTable('recurring_expenses', {
  id: text('id').primaryKey(),
  concepto: text('concepto').notNull(),
  categoria: text('categoria', {
    enum: [
      'Materia Prima',
      'Inventario',
      'Nómina',
      'Renta',
      'Servicios',
      'Publicidad',
      'Mantenimiento',
      'Impuestos',
      'Logística',
      'Otro',
    ],
  }).notNull(),
  montoCentavos: centavos('monto_centavos').notNull(),
  proveedor: text('proveedor'),
  frecuencia: text('frecuencia', { enum: ['semanal', 'quincenal', 'mensual'] }).notNull(),
  diaDelMes: integer('dia_del_mes'),
  diaDeLaSemana: integer('dia_de_la_semana'),
  proximoDisparo: text('proximo_disparo').notNull(),
  activo: boolean('activo').notNull().default(true),
  ...auditColumns,
});

/** The sale header (ADR-073): folio, method, client, cash, cancellation. */
export const tickets = pgTable('tickets', {
  id: text('id').primaryKey(),
  folio: integer('folio').notNull(),
  fecha: text('fecha').notNull(),
  hora: text('hora'),
  concepto: text('concepto').notNull(),
  metodo: text('metodo', {
    enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'],
  }).notNull(),
  clienteId: text('cliente_id'),
  estadoPago: text('estado_pago', { enum: ['pagado', 'pendiente', 'parcial'] }).notNull(),
  efectivoRecibidoCentavos: centavos('efectivo_recibido_centavos'),
  cambioCentavos: centavos('cambio_centavos'),
  cajaTurnoId: text('caja_turno_id'),
  cancelMotivo: text('cancel_motivo'),
  cancelledByUserId: text('cancelled_by_user_id'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'string' }),
  ...auditColumns,
});

/** A ticket's lines (ADR-073): product, quantity, amount. */
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull(),
  fecha: text('fecha').notNull(),
  concepto: text('concepto').notNull(),
  categoria: text('categoria', {
    enum: ['Producto', 'Servicio', 'Anticipo', 'Suscripción', 'Otro'],
  }).notNull(),
  /** Same key as the device (`monto`); the column is `monto_centavos`. */
  monto: centavos('monto_centavos').notNull(),
  productoId: text('producto_id').notNull(),
  cantidad: integer('cantidad').notNull().default(1),
  ...auditColumns,
});
