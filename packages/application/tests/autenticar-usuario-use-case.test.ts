import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@xangarro/domain';
import { hashSync } from 'bcryptjs';
import { InMemoryUsersRepository, TEST_DEVICE_ID } from '../../testing/src/index.js';
import { AutenticarUsuarioUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('AutenticarUsuarioUseCase', () => {
  let users: InMemoryUsersRepository;
  let auth: AutenticarUsuarioUseCase;

  beforeEach(async () => {
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    auth = new AutenticarUsuarioUseCase(users);

    // Seed an operator as sync would deliver it (portal-hashed PIN).
    await users.create({
      nombre: 'Test Operador',
      pinHash: hashSync('123456', 4),
      avatarColor: 'blue',
      businessId: BIZ,
    });
  });

  it('returns success with correct credentials', async () => {
    const result = await auth.execute({
      nombre: 'Test Operador',
      pin: '123456',
      businessId: BIZ,
    });

    expect(result.success).toBe(true);
    expect(result.userId).not.toBeNull();
  });

  it('returns failure for an operator deactivated in the portal', async () => {
    const seeded = await users.findByNombre('Test Operador', BIZ);
    if (!seeded) throw new Error('seed missing');
    await users.update(seeded.id, { active: false });

    const result = await auth.execute({
      nombre: 'Test Operador',
      pin: '123456',
      businessId: BIZ,
    });

    expect(result.success).toBe(false);
    expect(result.userId).toBeNull();
  });

  it('returns failure for wrong PIN', async () => {
    const result = await auth.execute({
      nombre: 'Test Operador',
      pin: '999999',
      businessId: BIZ,
    });

    expect(result.success).toBe(false);
    expect(result.userId).toBeNull();
  });

  it('returns failure for non-existent user', async () => {
    const result = await auth.execute({
      nombre: 'NonExistent',
      pin: '123456',
      businessId: BIZ,
    });

    expect(result.success).toBe(false);
    expect(result.userId).toBeNull();
  });

  it('is case-insensitive for nombre lookup', async () => {
    const result = await auth.execute({
      nombre: 'test operador',
      pin: '123456',
      businessId: BIZ,
    });

    expect(result.success).toBe(true);
  });
});
