/**
 * AppConfig — key/value singleton settings. Holds mode selection, current
 * business id, notification preferences, etc. JSON-encoded value strings.
 * No audit columns (device-local settings, not a synced entity).
 */

import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const appConfig = sqliteTable('app_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
