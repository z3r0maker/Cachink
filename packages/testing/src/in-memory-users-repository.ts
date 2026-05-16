/**
 * In-memory implementation of {@link UsersRepository}. Used by
 * use-case tests and the shared contract suite.
 *
 * Phase 1 of the Feature Flags plan: user management + auth.
 * ADR-049: PIN for login, Password for recovery.
 */

import type {
  BusinessId,
  DeviceId,
  IsoTimestamp,
  User,
  UserId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type {
  CreateUserInput,
  UserPatch,
  UsersRepository,
} from '@cachink/data';

export class InMemoryUsersRepository implements UsersRepository {
  private readonly rows = new Map<UserId, User>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: CreateUserInput): Promise<User> {
    const id = newEntityId<UserId>();
    const ts = now();
    const row: User = {
      id,
      nombre: input.nombre,
      email: input.email,
      pinHash: input.pinHash,
      recoveryPasswordHash: input.recoveryPasswordHash,
      role: input.role,
      mustChangePin: input.mustChangePin,
      avatarColor: input.avatarColor,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdByUserId: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: UserId): Promise<User | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findByNombre(
    nombre: string,
    businessId: BusinessId,
  ): Promise<User | null> {
    for (const row of this.rows.values()) {
      if (
        row.businessId === businessId &&
        row.deletedAt === null &&
        row.nombre.toLowerCase() === nombre.toLowerCase()
      ) {
        return row;
      }
    }
    return null;
  }

  async findAllByBusiness(
    businessId: BusinessId,
  ): Promise<readonly User[]> {
    return [...this.rows.values()]
      .filter(
        (r) => r.businessId === businessId && r.deletedAt === null,
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async update(id: UserId, patch: UserPatch): Promise<User> {
    const existing = this.rows.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`User ${id} not found`);
    }
    const ts = now();
    const updated: User = {
      ...existing,
      ...(patch.nombre !== undefined && { nombre: patch.nombre }),
      ...(patch.email !== undefined && { email: patch.email }),
      ...(patch.pinHash !== undefined && {
        pinHash: patch.pinHash,
      }),
      ...(patch.recoveryPasswordHash !== undefined && {
        recoveryPasswordHash: patch.recoveryPasswordHash,
      }),
      ...(patch.mustChangePin !== undefined && {
        mustChangePin: patch.mustChangePin,
      }),
      ...(patch.avatarColor !== undefined && {
        avatarColor: patch.avatarColor,
      }),
      updatedAt: ts,
    };
    this.rows.set(id, updated);
    return updated;
  }

  async delete(id: UserId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, {
      ...existing,
      deletedAt: ts,
      updatedAt: ts,
    });
  }

  async countDirectors(businessId: BusinessId): Promise<number> {
    let count = 0;
    for (const row of this.rows.values()) {
      if (
        row.businessId === businessId &&
        row.role === 'director' &&
        row.deletedAt === null
      ) {
        count++;
      }
    }
    return count;
  }

  /** Test helper: wipe all users. Not part of UsersRepository. */
  _reset(): void {
    this.rows.clear();
  }
}
