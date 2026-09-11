/**
 * User entity — an **Operator**: a person who rings sales on a device,
 * identified by name + PIN (ADR-053, docs/plan Q1/Q2).
 *
 * Operators are created and PIN-set in the portal and synced down; the
 * device never writes this table. `active` is the portal's deactivation
 * switch. PIN hashes are bcrypt — never plaintext.
 *
 * Transitional (removed by A-03 / A-17, see docs/plan/05-app.md):
 * `role`, `mustChangePin`, `recoveryPasswordHash` and `email` still exist so
 * the current UI compiles; production code only ever produces
 * `role: 'operativo'`.
 */

import { z } from 'zod';
import type { BusinessId, UserId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

/** @deprecated Single-role app (ADR-053). Kept until A-03 removes the last UI branch. */
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
export function canUserCancelSales(role: UserRole, permissions: UserPermissions): boolean {
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
    /** @deprecated see file header — always 'operativo' in new data. */
    role: UserRoleEnum,
    /** @deprecated PINs are set in the portal (Q2); dropped in A-17. */
    mustChangePin: z.boolean().default(false),
    avatarColor: z.string().default('blue'),
    /** Portal-managed deactivation. Inactive operators cannot authenticate. */
    active: z.boolean().default(true),
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
  /** @deprecated defaults to 'operativo'; removed in A-03. */
  role: UserRoleEnum.default('operativo'),
  /** @deprecated removed in A-17. */
  mustChangePin: z.boolean().default(true),
  businessId: ulidField<BusinessId>(),
});

export type NewUser = z.infer<typeof NewUserSchema>;

/** Login PIN must be exactly 6 digits. */
export const PIN_LENGTH = 6;

/** Minimum recovery password length for validation. */
export const RECOVERY_PASSWORD_MIN_LENGTH = 6;
