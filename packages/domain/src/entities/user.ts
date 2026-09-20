/**
 * User entity — an **Operator**: a person who rings sales on a device,
 * identified by name + NIP (ADR-053, docs/plan Q1/Q2).
 *
 * Operators are created and NIP-set in the portal and synced down; the
 * device never writes this table. `active` is the portal's deactivation
 * switch. NIP hashes are bcrypt — never plaintext. There is one role on
 * the device; the Director lives in the portal (A-05 removed `role`,
 * `mustChangePin`, `recoveryPasswordHash` and `email`; the merge's 0007
 * migration drops the columns — ADR-072's promised removal).
 */

import { z } from 'zod';
import type { UserId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

/** Per-operator permissions, granted in the portal. */
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

/** Whether an operator may cancel sales (portal-granted permission). */
export function canUserCancelSales(permissions: UserPermissions): boolean {
  return permissions.canCancelSales;
}

/** Persisted user record. */
export const UserSchema = z
  .object({
    id: ulidField<UserId>(),
    nombre: z.string().min(1).max(120),
    pinHash: z.string().min(1),
    avatarColor: z.string().default('blue'),
    /** Portal-granted permissions (e.g. cancelling sales). */
    permissions: UserPermissionsSchema.default({ canCancelSales: false }),
    /** Portal-managed deactivation. Inactive operators cannot authenticate. */
    active: z.boolean().default(true),
  })
  .merge(auditSchema);

export type User = z.infer<typeof UserSchema>;

/** Login NIP is exactly four digits (ADR-072 / C-16). */
export const PIN_LENGTH = 4;
