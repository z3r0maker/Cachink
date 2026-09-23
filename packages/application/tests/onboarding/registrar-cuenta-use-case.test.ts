import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { compare } from 'bcryptjs';

import { RegistrarCuentaUseCase, SignupError } from '../../src/index.js';
import { InMemorySignupStore } from '../support/in-memory-onboarding.js';

const USER_ID = '3f1c0e2a-0000-4000-8000-00000000abcd';
const AVISO = { version: '0.1-borrador', sha256: 'b'.repeat(64) };
const CONSENT = { acepto: true, novedades: true };
const VALID = {
  nombre: '  Tortas Lupita ',
  email: ' Lupita@Ejemplo.MX ',
  password: 'tortas-2026',
  consentimiento: CONSENT,
};

function build(taken: readonly string[] = []) {
  const store = new InMemorySignupStore(taken);
  const useCase = new RegistrarCuentaUseCase(store, () => USER_ID, AVISO);
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
    assert.equal(owner.consentimientos.length, 2, 'necesarias + novedades, one row each');
    const necesarias = owner.consentimientos.find((c) => c.purpose === 'necesarias')!;
    assert.equal(necesarias.granted, true);
    assert.equal(necesarias.method, 'casilla', 'datos patrimoniales: express, never tacit');
    assert.equal(necesarias.avisoVersion, AVISO.version);
    assert.equal(necesarias.avisoSha256, AVISO.sha256);
    assert.equal(necesarias.surface, 'registro');
  });

  it('refuses a signup whose aviso was not accepted, and writes nothing', async () => {
    const { store, useCase } = build();
    await assert.rejects(
      useCase.execute({ ...VALID, consentimiento: { acepto: false, novedades: true } }),
      { code: 'CONSENT_REQUIRED' },
    );
    assert.equal(store.owners.length, 0);
  });

  it('refuses a signup with no consent object at all (an old client)', async () => {
    const { store, useCase } = build();
    const { consentimiento: _omitted, ...sinConsentimiento } = VALID;
    await assert.rejects(useCase.execute(sinConsentimiento), { code: 'CONSENT_REQUIRED' });
    assert.equal(store.owners.length, 0);
  });

  it('records an unticked novedades box as an explicit refusal', async () => {
    const { store, useCase } = build();
    await useCase.execute({ ...VALID, consentimiento: { acepto: true, novedades: false } });
    const novedades = store.owners[0]!.consentimientos.find((c) => c.purpose === 'novedades')!;
    assert.equal(novedades.granted, false);
  });

  it('refuses to be built on an aviso without a hash — the record would be unverifiable', () => {
    assert.throws(
      () =>
        new RegistrarCuentaUseCase(new InMemorySignupStore(), () => USER_ID, {
          version: '1',
          sha256: 'nope',
        }),
    );
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
