import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@cachink/domain';
import {
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
  makeNewUser,
} from '../../testing/src/index.js';
import {
  CrearUsuarioUseCase,
  EliminarUsuarioUseCase,
} from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('EliminarUsuarioUseCase', () => {
  let users: InMemoryUsersRepository;
  let eliminar: EliminarUsuarioUseCase;
  let crear: CrearUsuarioUseCase;

  beforeEach(() => {
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    eliminar = new EliminarUsuarioUseCase(users);
    crear = new CrearUsuarioUseCase(users);
  });

  it('soft-deletes an operativo user', async () => {
    const director = await crear.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Director',
        role: 'director',
      }),
    );
    const operativo = await crear.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Operativo',
        role: 'operativo',
      }),
    );

    await eliminar.execute({ userId: operativo.id });

    const found = await users.findById(operativo.id);
    expect(found).toBeNull(); // soft-deleted → findById returns null
    // Director still exists
    const dirFound = await users.findById(director.id);
    expect(dirFound).not.toBeNull();
  });

  it('prevents deleting the last Director', async () => {
    const director = await crear.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Solo Director',
        role: 'director',
      }),
    );

    await expect(
      eliminar.execute({ userId: director.id }),
    ).rejects.toThrow(/último Director/);
  });

  it('allows deleting a Director when another exists', async () => {
    const dir1 = await crear.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Director 1',
        role: 'director',
      }),
    );
    await crear.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Director 2',
        role: 'director',
      }),
    );

    await eliminar.execute({ userId: dir1.id });

    const found = await users.findById(dir1.id);
    expect(found).toBeNull();
  });

  it('rejects non-existent user', async () => {
    await expect(
      eliminar.execute({
        userId: '01HZ8XQN9GZJXV8AKQ5XGHOST' as UserId,
      }),
    ).rejects.toThrow(/no encontrado/);
  });
});
