/**
 * Users table — local user accounts with hashed credentials.
 *
 * PINs (6-digit login) and recovery passwords are stored as bcrypt
 * hashes. The `must_change_pin` flag forces a PIN reset on next login
 * (set when a Director creates a user with a temporary PIN).
 *
 * ADR-049: PIN for login, Password for recovery.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditColumns } from './_audit';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  email: text('email'),
  pinHash: text('pin_hash').notNull(),
  recoveryPasswordHash: text('recovery_password_hash').notNull(),
  role: text('role', { enum: ['operativo', 'director'] }).notNull(),
  mustChangePin: integer('must_change_pin', { mode: 'boolean' })
    .notNull()
    .default(false),
  avatarColor: text('avatar_color').notNull().default('blue'),
  ...auditColumns,
});
