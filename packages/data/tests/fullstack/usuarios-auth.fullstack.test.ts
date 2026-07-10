/**
 * Fullstack scenario 7 — User management and authentication.
 *
 * Business narrative:
 *   1. Create Director → authenticate → change PIN → recover PIN
 *   2. Create Operativo with duplicate name → rejected
 *   3. Delete last Director → blocked
 *   4. Create second Director → delete first → succeeds
 *
 * Covers: USR-01 through USR-12
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, UserId } from '@cachink/domain';
import { newEntityId } from '@cachink/domain';
import {
  makeNewBusiness,
} from '../../../testing/src/index.js';
import { buildHarness, type FullstackHarness } from './fullstack-harness.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = newEntityId<UserId>();

describe('Usuarios + Auth [fullstack]', () => {
  let h: FullstackHarness;

  beforeEach(async () => {
    h = buildHarness({ userId: USER_ID });
    await h.repos.businesses.create(makeNewBusiness({ businessId: BIZ }));
  });

  it('creates a Director, authenticates, changes PIN, recovers PIN', async () => {
    // 1. Create Director
    const user = await h.useCases.crearUsuario.execute({
      nombre: 'Juan Director',
      pin: '123456',
      recoveryPassword: 'Recover1',
      role: 'director',
      mustChangePin: true,
      businessId: BIZ,
    });
    expect(user.role).toBe('director');
    expect(user.mustChangePin).toBe(true);

    // 2. Authenticate with correct PIN
    const authOk = await h.useCases.autenticarUsuario.execute({
      nombre: 'Juan Director',
      pin: '123456',
      businessId: BIZ,
    });
    expect(authOk.success).toBe(true);
    expect(authOk.userId).toBe(user.id);
    expect(authOk.mustChangePin).toBe(true);

    // 3. Authenticate with wrong PIN → failure
    const authFail = await h.useCases.autenticarUsuario.execute({
      nombre: 'Juan Director',
      pin: '000000',
      businessId: BIZ,
    });
    expect(authFail.success).toBe(false);

    // 4. Change PIN (clears mustChangePin)
    await h.useCases.cambiarPin.execute({
      userId: user.id,
      currentPin: '123456',
      newPin: '654321',
    });

    // Verify new PIN works
    const authNew = await h.useCases.autenticarUsuario.execute({
      nombre: 'Juan Director',
      pin: '654321',
      businessId: BIZ,
    });
    expect(authNew.success).toBe(true);
    expect(authNew.mustChangePin).toBe(false);

    // Old PIN no longer works
    const authOld = await h.useCases.autenticarUsuario.execute({
      nombre: 'Juan Director',
      pin: '123456',
      businessId: BIZ,
    });
    expect(authOld.success).toBe(false);

    // 5. Recover PIN via recovery password
    await h.useCases.recuperarPin.execute({
      userId: user.id,
      recoveryPassword: 'Recover1',
      newPin: '111111',
    });

    const authRecovered = await h.useCases.autenticarUsuario.execute({
      nombre: 'Juan Director',
      pin: '111111',
      businessId: BIZ,
    });
    expect(authRecovered.success).toBe(true);
  });

  it('change PIN with wrong current PIN is rejected', async () => {
    const user = await h.useCases.crearUsuario.execute({
      nombre: 'Director Test',
      pin: '123456',
      recoveryPassword: 'Recover1',
      role: 'director',
      mustChangePin: false,
      businessId: BIZ,
    });

    await expect(
      h.useCases.cambiarPin.execute({
        userId: user.id,
        currentPin: '000000',
        newPin: '654321',
      }),
    ).rejects.toThrow(/PIN actual incorrecto/i);
  });

  it('recovery with wrong password is rejected', async () => {
    const user = await h.useCases.crearUsuario.execute({
      nombre: 'Director Test',
      pin: '123456',
      recoveryPassword: 'Recover1',
      role: 'director',
      mustChangePin: false,
      businessId: BIZ,
    });

    await expect(
      h.useCases.recuperarPin.execute({
        userId: user.id,
        recoveryPassword: 'WrongPass',
        newPin: '654321',
      }),
    ).rejects.toThrow(/contraseña de recuperación/i);
  });

  it('rejects duplicate username in same business', async () => {
    await h.useCases.crearUsuario.execute({
      nombre: 'Ana Operativa',
      pin: '111111',
      recoveryPassword: 'RecoverA',
      role: 'operativo',
      mustChangePin: false,
      businessId: BIZ,
    });

    await expect(
      h.useCases.crearUsuario.execute({
        nombre: 'Ana Operativa', // duplicate
        pin: '222222',
        recoveryPassword: 'RecoverB',
        role: 'operativo',
        mustChangePin: false,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/ya existe.*usuario/i);
  });

  it('cannot delete the last Director', async () => {
    const director = await h.useCases.crearUsuario.execute({
      nombre: 'Solo Director',
      pin: '123456',
      recoveryPassword: 'Recover1',
      role: 'director',
      mustChangePin: false,
      businessId: BIZ,
    });

    await expect(
      h.useCases.eliminarUsuario.execute({ userId: director.id }),
    ).rejects.toThrow(/último Director/i);
  });

  it('can delete a Director when another exists', async () => {
    const dir1 = await h.useCases.crearUsuario.execute({
      nombre: 'Director Uno',
      pin: '123456',
      recoveryPassword: 'Recover1',
      role: 'director',
      mustChangePin: false,
      businessId: BIZ,
    });

    await h.useCases.crearUsuario.execute({
      nombre: 'Director Dos',
      pin: '654321',
      recoveryPassword: 'Recover2',
      role: 'director',
      mustChangePin: false,
      businessId: BIZ,
    });

    // Now deleting dir1 should succeed
    await h.useCases.eliminarUsuario.execute({ userId: dir1.id });

    // Verify deleted
    const found = await h.repos.users.findById(dir1.id);
    expect(found).toBeNull();
  });

  it('rejects new PIN that is not 6 digits', async () => {
    const user = await h.useCases.crearUsuario.execute({
      nombre: 'Director Test',
      pin: '123456',
      recoveryPassword: 'Recover1',
      role: 'director',
      mustChangePin: false,
      businessId: BIZ,
    });

    await expect(
      h.useCases.cambiarPin.execute({
        userId: user.id,
        currentPin: '123456',
        newPin: '12345', // 5 digits
      }),
    ).rejects.toThrow(/6 dígitos/i);

    await expect(
      h.useCases.cambiarPin.execute({
        userId: user.id,
        currentPin: '123456',
        newPin: 'abcdef', // letters
      }),
    ).rejects.toThrow(/6 dígitos/i);
  });
});
