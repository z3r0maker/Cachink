import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, NewUser } from '@cachink/domain';
import {
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
  makeNewUser,
} from '../../testing/src/index.js';
import { CrearUsuarioUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('CrearUsuarioUseCase', () => {
  let users: InMemoryUsersRepository;
  let useCase: CrearUsuarioUseCase;

  beforeEach(() => {
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    useCase = new CrearUsuarioUseCase(users);
  });

  it('creates a user with hashed PIN (not plaintext)', async () => {
    const input = makeNewUser({ businessId: BIZ });
    const created = await useCase.execute(input);

    expect(created.nombre).toBe(input.nombre);
    expect(created.role).toBe('director');
    expect(created.pinHash).not.toBe(input.pin);
    expect(created.pinHash).toMatch(/^\$2[aby]?\$/);
    expect(created.mustChangePin).toBe(true);
  });

  it('hashes the recovery password (not stored as plaintext)', async () => {
    const input = makeNewUser({ businessId: BIZ, recoveryPassword: 'recovery123' });
    const created = await useCase.execute(input);

    expect(created.recoveryPasswordHash).not.toBe('recovery123');
    expect(created.recoveryPasswordHash).toMatch(/^\$2[aby]?\$/);
  });

  it('rejects duplicate nombre within the same business', async () => {
    const input = makeNewUser({ businessId: BIZ, nombre: 'Maria' });
    await useCase.execute(input);

    await expect(useCase.execute(input)).rejects.toThrow(/Ya existe/);
  });

  it('persists the user so findById returns it', async () => {
    const input = makeNewUser({ businessId: BIZ });
    const created = await useCase.execute(input);

    const found = await users.findById(created.id);
    expect(found?.id).toBe(created.id);
  });

  it('rejects invalid input (non-6-digit PIN)', async () => {
    const input = makeNewUser({
      businessId: BIZ,
      pin: '12345',
    });
    await expect(useCase.execute(input)).rejects.toThrow();
  });

  it('rejects invalid recovery password format (too short)', async () => {
    const input = {
      ...makeNewUser({ businessId: BIZ }),
      recoveryPassword: '12345',
    } as NewUser;
    await expect(useCase.execute(input)).rejects.toThrow();
  });

  it('allows creating operativo users', async () => {
    const input = makeNewUser({
      businessId: BIZ,
      nombre: 'Operativo Juan',
      role: 'operativo',
    });
    const created = await useCase.execute(input);
    expect(created.role).toBe('operativo');
  });

  it('respects mustChangePin: false (DirectorSetup flow)', async () => {
    const input = makeNewUser({
      businessId: BIZ,
      mustChangePin: false,
    });
    const created = await useCase.execute(input);
    expect(created.mustChangePin).toBe(false);
  });

  it('defaults mustChangePin to true when not specified', async () => {
    const input = makeNewUser({ businessId: BIZ, nombre: 'DefaultTest' });
    const created = await useCase.execute(input);
    expect(created.mustChangePin).toBe(true);
  });

  it('sets email when provided', async () => {
    const input = makeNewUser({
      businessId: BIZ,
      email: 'test@example.com',
    });
    const created = await useCase.execute(input);
    expect(created.email).toBe('test@example.com');
  });
});
