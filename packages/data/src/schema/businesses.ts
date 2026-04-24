/**
 * Businesses — root tenant row. One per business; every other row carries
 * `business_id` as a foreign key (enforced at the app layer, not SQLite).
 */

import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit.js';

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  regimenFiscal: text('regimen_fiscal').notNull(),
  isrTasa: real('isr_tasa').notNull(),
  logoUrl: text('logo_url'),
  ...auditColumns,
});
