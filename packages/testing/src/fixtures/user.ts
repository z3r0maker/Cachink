/**
 * User fixture builders for tests.
 *
 * Operators only (A-05): no role, no recovery password, no email.
 */

import type { BusinessId, DeviceId, IsoTimestamp, User, UserId } from '@xangarro/domain';
import { newEntityId } from '@xangarro/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeUser(overrides: Partial<User> = {}): User {
  const id = (overrides.id ?? newEntityId<UserId>()) as UserId;
  return {
    id,
    nombre: 'Juan Operador',
    pinHash: '$2a$10$fakehashfortest',
    avatarColor: 'blue',
    permissions: { canCancelSales: false },
    active: true,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdByUserId: null,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as User;
}
