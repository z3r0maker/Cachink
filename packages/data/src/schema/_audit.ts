/**
 * Shared audit columns for every synced table (CLAUDE.md §9).
 *
 * SQLite stores timestamps as ISO 8601 strings; `deleted_at` is nullable
 * for soft deletes. Spread this object into each `sqliteTable` definition
 * so every row carries the same audit shape.
 */

import { text } from 'drizzle-orm/sqlite-core';

export const auditColumns = {
  businessId: text('business_id').notNull(),
  deviceId: text('device_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
} as const;
