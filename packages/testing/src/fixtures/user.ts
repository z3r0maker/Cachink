/**
 * User fixture builders for tests.
 *
 * Phase 1 of the Feature Flags plan: user management + auth.
 * ADR-049: PIN for login, Password for recovery.
 */

import type {
  BusinessId,
  DeviceId,
  IsoTimestamp,
  NewUser,
  User,
  UserId,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewUser(
  overrides: Partial<NewUser> = {},
): NewUser {
  return {
    nombre: 'Juan Director',
    pin: '123456',
    recoveryPassword: 'test123',
    role: 'director',
    mustChangePin: true,
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeUser(
  overrides: Partial<User> = {},
): User {
  const id = (overrides.id ?? newEntityId<UserId>()) as UserId;
  return {
    id,
    nombre: 'Juan Director',
    email: null,
    pinHash: '$2a$10$fakehashfortest',
    recoveryPasswordHash: '$2a$10$fakepinhashfortest',
    role: 'director',
    mustChangePin: false,
    avatarColor: 'blue',
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdByUserId: null,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as User;
}
