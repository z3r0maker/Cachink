import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@xangarro/domain';
import { InMemoryUsersRepository, TEST_DEVICE_ID, makeNewUser } from '../../testing/src/index.js';
import {
  AutenticarUsuarioUseCase,
  CrearUsuarioUseCase,
  RecuperarPinUseCase,
} from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('RecuperarPinUseCase', () => {
  let users: InMemoryUsersRepository;
  let recuperar: RecuperarPinUseCase;
  let auth: AutenticarUsuarioUseCase;
  let userId: UserId;

  beforeEach(async () => {
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    recuperar = new RecuperarPinUseCase(users);
    auth = new AutenticarUsuarioUseCase(users);

    const crear = new CrearUsuarioUseCase(users);
    const user = await crear.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Test User',
        pin: '1111',
        recoveryPassword: 'recovery123',
      }),
    );
    userId = user.id;
  });

  it('resets PIN with correct recovery password', async () => {
    await recuperar.execute({
      userId,
      recoveryPassword: 'recovery123',
      newPin: '2222',
    });

    const result = await auth.execute({
      nombre: 'Test User',
      pin: '2222',
      businessId: BIZ,
    });
    expect(result.success).toBe(true);
  });

  it('rejects wrong recovery password', async () => {
    await expect(
      recuperar.execute({
        userId,
        recoveryPassword: 'wrongpassword',
        newPin: '2222',
      }),
    ).rejects.toThrow(/contraseña de recuperación.*incorrecta/i);
  });

  it('rejects a PIN that is not 4 digits (ADR-072)', async () => {
    await expect(
      recuperar.execute({
        userId,
        recoveryPassword: 'recovery123',
        newPin: '12345',
      }),
    ).rejects.toThrow(/4 dígitos/);
  });

  it('rejects non-existent user', async () => {
    await expect(
      recuperar.execute({
        userId: '01HZ8XQN9GZJXV8AKQ5XGHOST' as UserId,
        recoveryPassword: 'recovery123',
        newPin: '2222',
      }),
    ).rejects.toThrow(/no encontrado/);
  });
});
