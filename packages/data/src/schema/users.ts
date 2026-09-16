/**
 * Users table — operators synced down from the portal (A-05).
 *
 * PINs are bcrypt hashes set in the portal. `active` is the portal's
 * deactivation switch; `permissions` is a JSON object parsed with
 * `UserPermissionsSchema`. The device never creates or edits operators.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  pinHash: text('pin_hash').notNull(),
  avatarColor: text('avatar_color').notNull().default('blue'),
  /** Portal-managed deactivation (migration 0001). */
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  /** JSON permissions object, parsed with UserPermissionsSchema. */
  permissions: text('permissions').notNull().default('{}'),
  ...auditColumns,
});
