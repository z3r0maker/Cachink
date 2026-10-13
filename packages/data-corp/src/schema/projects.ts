import { text } from 'drizzle-orm/pg-core';

import { at, corp } from './corp.js';

/**
 * A line of business MEXIA runs (ADR-124 §3). Every corp row that belongs to
 * one carries its id; shared costs and the company-wide caps do not. Xangarro
 * is the first and, today, the only one (seeded by the grants migration).
 */
export const projects = corp.table('projects', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nombre: text('nombre').notNull(),
  createdAt: at('created_at').notNull(),
});
