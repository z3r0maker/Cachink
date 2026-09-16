import { describe, expect, it } from 'vitest';
import { UserSchema, PIN_LENGTH } from '../../src/entities/user.js';

const BASE = {
  id: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  nombre: 'Toni',
  pinHash: '$2a$10$somehash',
  avatarColor: 'blue',
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
  createdByUserId: null,
  createdAt: '2026-05-09T12:00:00.000Z',
  updatedAt: '2026-05-09T12:00:00.000Z',
  deletedAt: null,
};

describe('UserSchema', () => {
  it('validates an operator', () => {
    expect(UserSchema.safeParse({ ...BASE, active: true }).success).toBe(true);
  });

  it('defaults active to true for rows that predate the column', () => {
    expect(UserSchema.parse(BASE).active).toBe(true);
  });

  it('defaults permissions to none', () => {
    expect(UserSchema.parse(BASE).permissions).toEqual({ canCancelSales: false });
  });

  it('rejects a non-boolean active', () => {
    expect(UserSchema.safeParse({ ...BASE, active: 'yes' }).success).toBe(false);
  });

  it('rejects an operator without a PIN hash', () => {
    expect(UserSchema.safeParse({ ...BASE, pinHash: '' }).success).toBe(false);
  });

  it('drops the retired role/recovery/email fields from older payloads (A-05)', () => {
    const parsed = UserSchema.parse({
      ...BASE,
      email: 'x@y.mx',
      role: 'director',
      mustChangePin: true,
      recoveryPasswordHash: 'h',
    });
    expect(parsed).not.toHaveProperty('role');
    expect(parsed).not.toHaveProperty('mustChangePin');
    expect(parsed).not.toHaveProperty('recoveryPasswordHash');
    expect(parsed).not.toHaveProperty('email');
  });

  it('keeps the 6-digit PIN length', () => {
    expect(PIN_LENGTH).toBe(6);
  });
});
