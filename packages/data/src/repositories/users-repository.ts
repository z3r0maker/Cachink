/**
 * UsersRepository — operators on this device.
 *
 * Operators are created, PIN-set and deactivated in the portal and arrive by
 * sync (A-05). The device reads them to sign in; `create`/`update`/`delete`
 * remain for tests, fixtures and dev tooling. The `User` domain type lives
 * in `@xangarro/domain/entities`; it is re-exported here for convenience.
 */

import type { BusinessId, User, UserId, UserPermissions } from '@xangarro/domain';

export type { User };

/** Patchable fields on an existing User (excludes id + audit). */
export type UserPatch = Partial<
  Pick<User, 'nombre' | 'pinHash' | 'avatarColor' | 'active' | 'permissions'>
>;

/** Input for creating a user — hashed PIN, not plaintext. */
export interface CreateUserInput {
  readonly nombre: string;
  readonly pinHash: string;
  readonly avatarColor: string;
  readonly businessId: BusinessId;
  /** Defaults to no permissions. */
  readonly permissions?: UserPermissions;
}

export interface UsersRepository {
  /** Create a new user and return the persisted record. */
  create(input: CreateUserInput): Promise<User>;

  /** Look up a user by ID. Returns null if not found or soft-deleted. */
  findById(id: UserId): Promise<User | null>;

  /** Find a user by nombre within a business. Case-insensitive. */
  findByNombre(nombre: string, businessId: BusinessId): Promise<User | null>;

  /** List all non-deleted users for a business, ordered by nombre. */
  findAllByBusiness(businessId: BusinessId): Promise<readonly User[]>;

  /** Partial update. Returns the updated user. */
  update(id: UserId, patch: UserPatch): Promise<User>;

  /** Soft-delete a user (sets deletedAt). */
  delete(id: UserId): Promise<void>;
}
