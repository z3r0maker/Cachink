/**
 * UsersRepository — CRUD for local user accounts.
 *
 * Follows the same interface/Drizzle/in-memory triple pattern as
 * SalesRepository. The `User` and `NewUser` domain types live in
 * `@cachink/domain/entities`; we re-export them here for convenience.
 *
 * Phase 1 of the Feature Flags plan: user management + auth.
 * ADR-049: PIN for login, Password for recovery.
 */

import type { User, UserRole } from '@cachink/domain';
import type { BusinessId, UserId } from '@cachink/domain';

export type { User };

/** Patchable fields on an existing User (excludes id + audit). */
export type UserPatch = Partial<
  Pick<
    User,
    | 'nombre'
    | 'email'
    | 'pinHash'
    | 'recoveryPasswordHash'
    | 'mustChangePin'
    | 'avatarColor'
  >
>;

/** Input for creating a user — hashed credentials, not plaintext. */
export interface CreateUserInput {
  readonly nombre: string;
  readonly email: string | null;
  readonly pinHash: string;
  readonly recoveryPasswordHash: string;
  readonly role: UserRole;
  readonly mustChangePin: boolean;
  readonly avatarColor: string;
  readonly businessId: BusinessId;
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

  /** Count non-deleted users with role='director' for a business. */
  countDirectors(businessId: BusinessId): Promise<number>;
}
