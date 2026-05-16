/**
 * CajaMovimientos table — manual cash deposits/withdrawals.
 *
 * Part of the Caja Completa feature.
 */

import { sqliteTable, text, numeric } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const cajaMovimientos = sqliteTable('caja_movimientos', {
  id: text('id').primaryKey(),
  turnoId: text('turno_id').notNull(),
  tipo: text('tipo', { enum: ['deposito', 'retiro'] }).notNull(),
  montoCentavos: numeric('monto_centavos', { mode: 'bigint' }).notNull(),
  motivo: text('motivo').notNull(),
  userId: text('user_id').notNull(),
  ...auditColumns,
});
