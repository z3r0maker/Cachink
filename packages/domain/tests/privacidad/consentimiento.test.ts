import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  AvisoVigenteSchema,
  ConsentGrantSchema,
  consentimientosDeRegistro,
} from '../../src/index.js';

const SHA = 'a'.repeat(64);
const AVISO = { version: '0.1-borrador', sha256: SHA };

describe('consentimiento (N-34 / PRIV-REG-01)', () => {
  it('a signup yields an express grant for necesarias and a record for novedades', () => {
    const grants = consentimientosDeRegistro(AVISO, { acepto: true, novedades: true });
    assert.equal(grants.length, 2);
    const [necesarias, novedades] = grants;
    assert.deepEqual(necesarias, {
      avisoVersion: '0.1-borrador',
      avisoSha256: SHA,
      surface: 'registro',
      purpose: 'necesarias',
      granted: true,
      method: 'casilla',
    });
    assert.equal(novedades!.purpose, 'novedades');
    assert.equal(novedades!.granted, true);
    assert.equal(novedades!.method, 'tacito', 'a pre-ticked box left alone is tacit consent');
    for (const g of grants) assert.ok(ConsentGrantSchema.safeParse(g).success);
  });

  it('unticking novedades records an explicit refusal, not an absence', () => {
    const [, novedades] = consentimientosDeRegistro(AVISO, { acepto: true, novedades: false });
    assert.equal(novedades!.granted, false);
    assert.equal(novedades!.method, 'casilla');
  });

  it('refuses a tacit grant for the necessary purposes (art. 7, datos patrimoniales)', () => {
    const r = ConsentGrantSchema.safeParse({
      avisoVersion: '1',
      avisoSha256: SHA,
      surface: 'registro',
      purpose: 'necesarias',
      granted: true,
      method: 'tacito',
    });
    assert.equal(r.success, false);
  });

  it('refuses an aviso without a real sha256', () => {
    assert.equal(AvisoVigenteSchema.safeParse({ version: '1', sha256: 'abc' }).success, false);
    assert.equal(AvisoVigenteSchema.safeParse({ version: '', sha256: SHA }).success, false);
  });

  it('refuses unknown surfaces and purposes', () => {
    const base = { avisoVersion: '1', avisoSha256: SHA, granted: true, method: 'casilla' };
    assert.equal(
      ConsentGrantSchema.safeParse({ ...base, surface: 'correo', purpose: 'necesarias' }).success,
      false,
    );
    assert.equal(
      ConsentGrantSchema.safeParse({ ...base, surface: 'registro', purpose: 'credito' }).success,
      false,
    );
  });
});
