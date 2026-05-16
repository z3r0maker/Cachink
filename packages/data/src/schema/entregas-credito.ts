/**
 * EntregasCredito table — grouped credit delivery records.
 * Phase 11 of the Feature Flags plan.
 */

import { numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const entregasCredito = sqliteTable('entregas_credito', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id').notNull(),
  fecha: text('fecha').notNull(),
  totalCentavos: numeric('total_centavos', { mode: 'bigint' }).notNull(),
  nota: text('nota'),
  saleIds: text('sale_ids').notNull(),
  ...auditColumns,
});
