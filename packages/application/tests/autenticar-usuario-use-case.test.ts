import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import {
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
  makeNewUser,
} from '../../testing/src/index.js';
import {
  AutenticarUsuarioUseCase,
  CrearUsuarioUseCase,
} from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('AutenticarUsuarioUseCase', () => {
  let users: InMemoryUsersRepository;
  let auth: AutenticarUsuarioUseCase;
  let crear: CrearUsuarioUseCase;

  beforeEach(async () => {
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    auth = new AutenticarUsuarioUseCase(users);
    crear = new CrearUsuarioUseCase(users);

    // Seed a user
    await crear.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Test Director',
        pin: '123456',
      }),
    );
  });

  it('returns success with correct credentials', async () => {
    const result = await auth.execute({
      nombre: 'Test Director',
      pin: '123456',
      businessId: BIZ,
    });

    expect(result.success).toBe(true);
    expect(result.userId).not.toBeNull();
    expect(result.role).toBe('director');
    expect(result.mustChangePin).toBe(true);
  });

  it('returns failure for wrong PIN', async () => {
    const result = await auth.execute({
      nombre: 'Test Director',
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
      nombre: 'test director',
      pin: '123456',
      businessId: BIZ,
    });

    expect(result.success).toBe(true);
  });

  it('returns mustChangePin from user record', async () => {
    const result = await auth.execute({
      nombre: 'Test Director',
      pin: '123456',
      businessId: BIZ,
    });

    // Users created via CrearUsuario always have mustChangePin=true
    expect(result.mustChangePin).toBe(true);
  });
});
