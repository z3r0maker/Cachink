import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { compare } from 'bcryptjs';

import { RegistrarCuentaUseCase, SignupError } from '../../src/index.js';
import { InMemorySignupStore } from '../support/in-memory-onboarding.js';

const USER_ID = '3f1c0e2a-0000-4000-8000-00000000abcd';
const VALID = { nombre: '  Tortas Lupita ', email: ' Lupita@Ejemplo.MX ', password: 'tortas-2026' };

function build(taken: readonly string[] = []) {
  const store = new InMemorySignupStore(taken);
  const useCase = new RegistrarCuentaUseCase(store, () => USER_ID);
  return { store, useCase };
}

describe('RegistrarCuentaUseCase (P-03)', () => {
  it('creates the owner, the business and the membership in one call', async () => {
    const { store, useCase } = build();
    const result = await useCase.execute(VALID);

    assert.equal(result.userId, USER_ID);
    assert.equal(store.owners.length, 1);
    const owner = store.owners[0]!;
    assert.equal(owner.email, 'lupita@ejemplo.mx', 'email is trimmed and lower-cased');
    assert.equal(owner.nombreNegocio, 'Tortas Lupita');
    assert.equal(owner.businessId, result.businessId);
    assert.match(owner.businessId, /^[0-9A-HJKMNP-TV-Z]{26}$/, 'business id is a ULID');
    assert.notEqual(owner.memberId, owner.businessId);
    assert.equal(owner.regimenFiscal, 'RESICO');
    assert.equal(owner.isrTasa, 125);
    assert.notEqual(owner.passwordHash, VALID.password);
    assert.equal(await compare(VALID.password, owner.passwordHash), true);
  });

  it('refuses an address that already has an account', async () => {
    const { store, useCase } = build(['lupita@ejemplo.mx']);
    await assert.rejects(useCase.execute(VALID), (e: unknown) => {
      assert.ok(e instanceof SignupError);
      assert.equal(e.code, 'EMAIL_TAKEN');
      return true;
    });
    assert.equal(store.owners.length, 0);
  });

  it('refuses a malformed email', async () => {
    const { useCase } = build();
    await assert.rejects(useCase.execute({ ...VALID, email: 'no-es-correo' }), {
      code: 'INVALID_SIGNUP',
    });
  });

  it('refuses a password shorter than 8 characters', async () => {
    const { useCase } = build();
    await assert.rejects(useCase.execute({ ...VALID, password: 'corta' }), {
      code: 'INVALID_SIGNUP',
    });
  });

  it('refuses a blank business name', async () => {
    const { store, useCase } = build();
    await assert.rejects(useCase.execute({ ...VALID, nombre: '   ' }), {
      code: 'INVALID_SIGNUP',
    });
    assert.equal(store.owners.length, 0);
  });
});
