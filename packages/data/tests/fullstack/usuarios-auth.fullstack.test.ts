/**
 * Usuarios + Auth (fullstack) — the operator-only model (A-05, ADR-072).
 *
 * The device authenticates operators; it never creates, changes or
 * recovers a NIP (the owner does, from the portal). What remains
 * device-side: authenticate, lockout-free wrong-NIP, duplicate names.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import { hashSync } from 'bcryptjs';
import type { BusinessId } from '@xangarro/domain';
import { InMemoryUsersRepository, TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { AutenticarUsuarioUseCase, CrearOperadorUseCase } from '../../../application/src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('Usuarios + Auth [fullstack]', () => {
  let users: InMemoryUsersRepository;
  let crear: CrearOperadorUseCase;
  let autenticar: AutenticarUsuarioUseCase;

  beforeAll(() => {
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    crear = new CrearOperadorUseCase(users);
    autenticar = new AutenticarUsuarioUseCase(users);
  });

  it('creates an operator and authenticates with its 4-digit NIP', async () => {
    const op = await crear.execute({
      businessId: BIZ,
      nombre: 'Juan Operador',
      pin: '1234',
      operatorLimit: 5,
    });
    expect(op.active).toBe(true);

    const ok = await autenticar.execute({ nombre: 'Juan Operador', pin: '1234', businessId: BIZ });
    expect(ok.success).toBe(true);
  });

  it('rejects a wrong NIP', async () => {
    const bad = await autenticar.execute({ nombre: 'Juan Operador', pin: '9999', businessId: BIZ });
    expect(bad.success).toBe(false);
  });

  it('rejects a duplicate operator name in the same business', async () => {
    await expect(
      crear.execute({ businessId: BIZ, nombre: 'Juan Operador', pin: '4321', operatorLimit: 5 }),
    ).rejects.toThrow(/ya existe/i);
  });

  it('enforces the plan operator allowance', async () => {
    await expect(
      crear.execute({ businessId: BIZ, nombre: 'Segundo', pin: '2222', operatorLimit: 1 }),
    ).rejects.toThrow(/límite|plan/i);
  });

  it('rejects a NIP that is not four digits (ADR-072)', async () => {
    await expect(
      crear.execute({ businessId: BIZ, nombre: 'Tercer', pin: '12345', operatorLimit: 5 }),
    ).rejects.toThrow();
  });

  it('a deactivated operator cannot authenticate (portal-managed active)', async () => {
    const op = await crear.execute({
      businessId: BIZ,
      nombre: 'Baja',
      pin: '3333',
      operatorLimit: 5,
    });
    await users.update(op.id, { active: false });
    const result = await autenticar.execute({
      nombre: 'Baja',
      pin: '3333',
      businessId: BIZ,
    });
    expect(result.success).toBe(false);
    void hashSync; // bcrypt stays on the NIP hash path
  });
});
