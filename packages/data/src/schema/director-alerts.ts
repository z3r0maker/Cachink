/**
 * DirectorAlerts table — unified notification inbox.
 * Phase 11 of the Feature Flags plan.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const directorAlerts = sqliteTable('director_alerts', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  severity: text('severity', { enum: ['info', 'warning', 'critical'] }).notNull(),
  titleKey: text('title_key').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  actionRoute: text('action_route'),
  metadata: text('metadata').notNull().default('{}'),
  ...auditColumns,
});
