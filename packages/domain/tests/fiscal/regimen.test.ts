import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  datosFiscalesCompletos,
  ISR_DEFAULTS_SEED,
  REGIMEN_FISCAL,
  REGIMEN_NOMBRE,
  regimenBucket,
  regimenFromLegacy,
  regimenPatch,
} from '../../src/index.js';

describe('régimen: SAT code is the truth, the bucket is derived', () => {
  it('names every code in the SAT catalog', () => {
    for (const code of Object.keys(REGIMEN_FISCAL)) assert.ok(REGIMEN_NOMBRE[code], code);
  });

  it('derives the ISR bucket from the code — the only direction that is total', () => {
    assert.equal(regimenBucket('626'), 'RESICO');
    assert.equal(regimenBucket('621'), 'RIF');
    assert.equal(regimenBucket('605'), 'Asalariados');
    assert.equal(regimenBucket('612'), 'Otro');
    assert.equal(regimenBucket(null), 'Otro');
  });

  it('migrates the three unambiguous legacy names, and refuses to guess «Otro»', () => {
    assert.equal(regimenFromLegacy('RESICO'), '626');
    assert.equal(regimenFromLegacy('RIF'), '621');
    assert.equal(regimenFromLegacy('Asalariados'), '605');
    assert.equal(regimenFromLegacy('Otro'), null);
    assert.equal(regimenFromLegacy('612'), '612', 'a code stays a code');
    assert.equal(regimenFromLegacy('régimen inventado'), null);
  });

  it('a change writes the code and its derived bucket together, with the suggested ISR', () => {
    assert.deepEqual(regimenPatch('626'), {
      regimenSat: '626',
      regimenFiscal: 'RESICO',
      isrSugerido: ISR_DEFAULTS_SEED.RESICO,
    });
  });

  it('refuses a code that is not in the SAT catalog', () => {
    assert.throws(
      () => regimenPatch('999'),
      (e: unknown) => (e as { code?: string }).code === 'REGIMEN_INVALID',
    );
  });
});

describe('datosFiscalesCompletos', () => {
  const full = {
    rfc: 'XOJI740919U48',
    razonSocial: 'Pedro',
    codigoPostal: '06600',
    regimenSat: '626',
  };

  it('needs RFC, razón social, CP and régimen', () => {
    assert.equal(datosFiscalesCompletos(full), true);
  });

  it('any missing or blank one makes it incomplete', () => {
    assert.equal(datosFiscalesCompletos({ ...full, rfc: null }), false);
    assert.equal(datosFiscalesCompletos({ ...full, razonSocial: '  ' }), false);
    assert.equal(datosFiscalesCompletos({ ...full, regimenSat: null }), false);
  });
});
