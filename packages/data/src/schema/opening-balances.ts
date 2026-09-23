/**
 * Saldos iniciales (C-20, N-17) — the day-one facts, so the Balance (NIF B-6)
 * is right from the first statement.
 *
 * Both are DOWN tables: the portal writes them, the device only reads what a
 * pull brings down. The header goes read-only once `locked_at` is set (N-17's
 * owner lock, v1's stand-in for the first period close). Inventory valuation
 * is derived (apertura movements × costo), never stored.
 *
 * Postgres side: data-pg 0025. SQLite side: migration 0013.
 */

import { numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const openingBalances = sqliteTable('opening_balances', {
  id: text('id').primaryKey(),
  /** `YYYY-MM-DD`: the day the books open. */
  fechaApertura: text('fecha_apertura').notNull(),
  cajaCentavos: numeric('caja_centavos', { mode: 'bigint' }).notNull(),
  bancosCentavos: numeric('bancos_centavos', { mode: 'bigint' }).notNull(),
  /** Set once; from then on the row is read-only. */
  lockedAt: text('locked_at'),
  ...auditColumns,
});

/** One saldo inicial per cliente; the third fact of `estadoDeCuenta` (ADR-074). */
export const openingBalanceClients = sqliteTable('opening_balance_clients', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id').notNull(),
  saldoCentavos: numeric('saldo_centavos', { mode: 'bigint' }).notNull(),
  ...auditColumns,
});
