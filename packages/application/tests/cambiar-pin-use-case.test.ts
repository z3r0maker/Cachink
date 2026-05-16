import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@cachink/domain';
import {
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
  makeNewUser,
} from '../../testing/src/index.js';
import {
  AutenticarUsuarioUseCase,
  CambiarPinUseCase,
  CrearUsuarioUseCase,
} from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('CambiarPinUseCase', () => {
  let users: InMemoryUsersRepository;
  let cambiar: CambiarPinUseCase;
  let auth: AutenticarUsuarioUseCase;
  let userId: UserId;

  beforeEach(async () => {
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    cambiar = new CambiarPinUseCase(users);
    auth = new AutenticarUsuarioUseCase(users);

    const crear = new CrearUsuarioUseCase(users);
    const user = await crear.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Test User',
        pin: '111111',
      }),
    );
    userId = user.id;
  });

  it('changes PIN and clears mustChangePin', async () => {
    await cambiar.execute({
      userId,
      currentPin: '111111',
      newPin: '222222',
    });

    const user = await users.findById(userId);
    expect(user?.mustChangePin).toBe(false);

    // New PIN works
    const result = await auth.execute({
      nombre: 'Test User',
      pin: '222222',
      businessId: BIZ,
    });
    expect(result.success).toBe(true);
  });

  it('rejects wrong current PIN', async () => {
    await expect(
      cambiar.execute({
        userId,
        currentPin: '999999',
        newPin: '222222',
      }),
    ).rejects.toThrow(/incorrecto/);
  });

  it('rejects non-6-digit new PIN', async () => {
    await expect(
      cambiar.execute({
        userId,
        currentPin: '111111',
        newPin: '12345',
      }),
    ).rejects.toThrow(/6 dígitos/);
  });

  it('rejects non-existent user', async () => {
    await expect(
      cambiar.execute({
        userId: '01HZ8XQN9GZJXV8AKQ5XGHOST' as UserId,
        currentPin: '111111',
        newPin: '222222',
      }),
    ).rejects.toThrow(/no encontrado/);
  });
});
