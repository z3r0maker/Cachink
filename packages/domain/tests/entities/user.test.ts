import { describe, expect, it } from 'vitest';
import { NewUserSchema, UserSchema, PIN_LENGTH, RECOVERY_PASSWORD_MIN_LENGTH } from '../../src/entities/user.js';

describe('UserSchema', () => {
  it('validates a complete user', () => {
    const result = UserSchema.safeParse({
      id: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
      nombre: 'Test User',
      email: null,
      pinHash: '$2a$10$somehash',
      recoveryPasswordHash: '$2a$10$somepinhash',
      role: 'director',
      mustChangePin: false,
      avatarColor: 'blue',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
      deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
      createdByUserId: null,
      createdAt: '2026-05-09T12:00:00.000Z',
      updatedAt: '2026-05-09T12:00:00.000Z',
      deletedAt: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = UserSchema.safeParse({
      id: '01HZ8XQN9GZJXV8AKQ5X0CUSR1',
      nombre: 'X', email: null, pinHash: 'h', recoveryPasswordHash: 'h',
      role: 'admin', mustChangePin: false, avatarColor: 'blue',
      businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
      deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV',
      createdAt: '2026-05-09T12:00:00.000Z',
      updatedAt: '2026-05-09T12:00:00.000Z',
      deletedAt: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('NewUserSchema', () => {
  it('validates valid input', () => {
    const result = NewUserSchema.safeParse({
      nombre: 'Test', pin: '123456', recoveryPassword: 'test123',
      role: 'operativo', businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-6-digit PIN', () => {
    const result = NewUserSchema.safeParse({
      nombre: 'Test', pin: '12345', recoveryPassword: 'test123',
      role: 'operativo', businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short recovery password', () => {
    const result = NewUserSchema.safeParse({
      nombre: 'Test', pin: '123456', recoveryPassword: '12345',
      role: 'operativo', businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
    });
    expect(result.success).toBe(false);
  });

  it('exports correct constants', () => {
    expect(PIN_LENGTH).toBe(6);
    expect(RECOVERY_PASSWORD_MIN_LENGTH).toBe(6);
  });
});
