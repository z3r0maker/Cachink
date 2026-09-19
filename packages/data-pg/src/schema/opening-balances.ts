import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { auditColumns, centavos, isoDate } from './_columns';

/**
 * Opening balances (C-20, migration 0024): day-one facts so the Balance is
 * right from the first statement. DOWN to devices (the wire sends them;
 * the SQLite half lands with the app branch). Portal-written only; the
 * header becomes read-only once `locked_at` is set (N-17's owner lock).
 */
export const openingBalances = pgTable('opening_balances', {
  id: text('id').primaryKey(),
  fechaApertura: isoDate('fecha_apertura').notNull(),
  cajaCentavos: centavos('caja_centavos').notNull(),
  bancosCentavos: centavos('bancos_centavos').notNull(),
  lockedAt: timestamp('locked_at', { withTimezone: true, mode: 'string' }),
  ...auditColumns,
});

/** One saldo inicial per cliente; the third fact of `estadoDeCuenta` (C-20). */
export const openingBalanceClients = pgTable('opening_balance_clients', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id').notNull(),
  saldoCentavos: centavos('saldo_centavos').notNull(),
  ...auditColumns,
});
