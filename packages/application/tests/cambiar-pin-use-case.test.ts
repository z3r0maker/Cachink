import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@xangarro/domain';
import { InMemoryUsersRepository, TEST_DEVICE_ID, makeNewUser } from '../../testing/src/index.js';
import { AutenticarUsuarioUseCase, CambiarPinUseCase, CrearUsuarioUseCase } from '../src/index.js';

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
        pin: '1111',
      }),
    );
    userId = user.id;
  });

  it('changes PIN and clears mustChangePin', async () => {
    await cambiar.execute({
      userId,
      currentPin: '1111',
      newPin: '2222',
    });

    const user = await users.findById(userId);
    expect(user?.mustChangePin).toBe(false);

    // New PIN works
    const result = await auth.execute({
      nombre: 'Test User',
      pin: '2222',
      businessId: BIZ,
    });
    expect(result.success).toBe(true);
  });

  it('rejects wrong current PIN', async () => {
    await expect(
      cambiar.execute({
        userId,
        currentPin: '9999',
        newPin: '2222',
      }),
    ).rejects.toThrow(/incorrecto/);
  });

  it('rejects a PIN that is not 4 digits (ADR-072)', async () => {
    await expect(
      cambiar.execute({
        userId,
        currentPin: '1111',
        newPin: '12345',
      }),
    ).rejects.toThrow(/4 dígitos/);
  });

  it('rejects non-existent user', async () => {
    await expect(
      cambiar.execute({
        userId: '01HZ8XQN9GZJXV8AKQ5XGHOST' as UserId,
        currentPin: '1111',
        newPin: '2222',
      }),
    ).rejects.toThrow(/no encontrado/);
  });
});
