/**
 * Clients — minimal-on-purpose per CLAUDE.md §9. Enables the Crédito
 * payment method and the Cuentas por Cobrar view.
 */

import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit.js';

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono'),
  email: text('email'),
  nota: text('nota'),
  ...auditColumns,
});
