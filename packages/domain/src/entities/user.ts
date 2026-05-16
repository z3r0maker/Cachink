/**
 * User entity — local user accounts with hashed PINs + recovery passwords.
 *
 * Every business must have at least one Director. The Director creates
 * other users (Operativo or additional Directors). PINs and recovery
 * passwords are stored as bcrypt hashes — never plaintext.
 *
 * Phase 1 of the Feature Flags plan (user management).
 * ADR-049: PIN for daily login, Password for recovery.
 */

import { z } from 'zod';
import type { BusinessId, UserId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

/** The two user roles from CLAUDE.md §1 — now derived from User.role. */
export const UserRoleEnum = z.enum(['operativo', 'director']);
export type UserRole = z.infer<typeof UserRoleEnum>;

/** Per-user permissions. Director always has all permissions implicitly. */
export const UserPermissionsSchema = z.object({
  canCancelSales: z.boolean().default(false),
});
export type UserPermissions = z.infer<typeof UserPermissionsSchema>;

/** Parse a permissions JSON string safely, defaulting all to false. */
export function parseUserPermissions(raw: string): UserPermissions {
  try {
    return UserPermissionsSchema.parse(JSON.parse(raw));
  } catch {
    return { canCancelSales: false };
  }
}

/** Check if a user (by role + permissions) can cancel sales. */
export function canUserCancelSales(
  role: UserRole,
  permissions: UserPermissions,
): boolean {
  return role === 'director' || permissions.canCancelSales;
}

/** Persisted user record. */
export const UserSchema = z
  .object({
    id: ulidField<UserId>(),
    nombre: z.string().min(1).max(120),
    email: z.string().email().nullable(),
    pinHash: z.string().min(1),
    recoveryPasswordHash: z.string().min(1),
    role: UserRoleEnum,
    mustChangePin: z.boolean().default(false),
    avatarColor: z.string().default('blue'),
  })
  .merge(auditSchema);

export type User = z.infer<typeof UserSchema>;

/**
 * Input for creating a new user — hashing happens in the use case.
 *
 * `mustChangePin` defaults to `true` (operativo with temp PIN).
 * Pass `false` when the user chose their own PIN (e.g. DirectorSetup).
 */
export const NewUserSchema = z.object({
  nombre: z.string().min(1).max(120),
  email: z.string().email().optional(),
  pin: z.string().regex(/^\d{6}$/),
  recoveryPassword: z.string().min(6).max(128),
  role: UserRoleEnum,
  mustChangePin: z.boolean().default(true),
  businessId: ulidField<BusinessId>(),
});

export type NewUser = z.infer<typeof NewUserSchema>;

/** Login PIN must be exactly 6 digits. */
export const PIN_LENGTH = 6;

/** Minimum recovery password length for validation. */
export const RECOVERY_PASSWORD_MIN_LENGTH = 6;
