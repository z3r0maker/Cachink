/**
 * Drizzle-backed {@link UsersRepository}. Follows the same audit +
 * mapping pattern as DrizzleSalesRepository.
 *
 * Phase 1 of the Feature Flags plan: user management + auth.
 * ADR-049: PIN for login, Password for recovery.
 */

import { and, eq, isNull, sql } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  IsoTimestamp,
  User,
  UserId,
  UserRole,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type {
  CreateUserInput,
  UserPatch,
  UsersRepository,
} from '../users-repository.js';
import { users } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type UserRow = typeof users.$inferSelect;

export class DrizzleUsersRepository implements UsersRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: CreateUserInput): Promise<User> {
    const id = newEntityId<UserId>();
    const ts = now();
    const row = {
      id,
      nombre: input.nombre,
      email: input.email,
      pinHash: input.pinHash,
      recoveryPasswordHash: input.recoveryPasswordHash,
      role: input.role,
      mustChangePin: input.mustChangePin,
      avatarColor: input.avatarColor,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(users).values(row).run();
    return this.#mapRow(row as unknown as UserRow);
  }

  async findById(id: UserId): Promise<User | null> {
    const row = await this.#db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByNombre(
    nombre: string,
    businessId: BusinessId,
  ): Promise<User | null> {
    const rows = await this.#db
      .select()
      .from(users)
      .where(
        and(
          eq(users.businessId, businessId),
          isNull(users.deletedAt),
        ),
      )
      .all();
    const match = rows.find(
      (r) => r.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    return match ? this.#mapRow(match) : null;
  }

  async findAllByBusiness(
    businessId: BusinessId,
  ): Promise<readonly User[]> {
    const rows = await this.#db
      .select()
      .from(users)
      .where(
        and(
          eq(users.businessId, businessId),
          isNull(users.deletedAt),
        ),
      )
      .all();
    return rows
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((r) => this.#mapRow(r));
  }

  async update(id: UserId, patch: UserPatch): Promise<User> {
    const ts = now();
    const set: Record<string, unknown> = { updatedAt: ts };
    if (patch.nombre !== undefined) set['nombre'] = patch.nombre;
    if (patch.email !== undefined) set['email'] = patch.email;
    if (patch.pinHash !== undefined) {
      set['pinHash'] = patch.pinHash;
    }
    if (patch.recoveryPasswordHash !== undefined) {
      set['recoveryPasswordHash'] = patch.recoveryPasswordHash;
    }
    if (patch.mustChangePin !== undefined) {
      set['mustChangePin'] = patch.mustChangePin;
    }
    if (patch.avatarColor !== undefined) {
      set['avatarColor'] = patch.avatarColor;
    }
    await this.#db
      .update(users)
      .set(set)
      .where(eq(users.id, id))
      .run();
    const row = await this.#db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .get();
    if (!row) throw new Error(`User ${id} not found after update`);
    return this.#mapRow(row);
  }

  async delete(id: UserId): Promise<void> {
    const ts = now();
    await this.#db
      .update(users)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(users.id, id))
      .run();
  }

  async countDirectors(businessId: BusinessId): Promise<number> {
    const result = await this.#db
      .select({ value: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.businessId, businessId),
          eq(users.role, 'director'),
          isNull(users.deletedAt),
        ),
      )
      .get();
    return result?.value ?? 0;
  }

  #mapRow(row: UserRow): User {
    return {
      id: row.id as UserId,
      nombre: row.nombre,
      email: row.email ?? null,
      pinHash: row.pinHash,
      recoveryPasswordHash: row.recoveryPasswordHash,
      role: row.role as UserRole,
      mustChangePin: row.mustChangePin,
      avatarColor: row.avatarColor,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
