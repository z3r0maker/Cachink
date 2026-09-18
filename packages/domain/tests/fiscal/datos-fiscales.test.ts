import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { validateDatosFiscales } from '../../src/index.js';

describe('validateDatosFiscales', () => {
  it('normalises and accepts complete, valid data', () => {
    const r = validateDatosFiscales({
      rfc: ' xoji-740919 u48 ',
      razonSocial: '  Pedro Pérez  ',
      codigoPostal: '06600',
      usoCfdi: 'g03',
    });
    assert.deepEqual(r, {
      ok: true,
      value: {
        rfc: 'XOJI740919U48',
        razonSocial: 'Pedro Pérez',
        codigoPostal: '06600',
        usoCfdi: 'G03',
      },
      warnings: [],
    });
  });

  it('allows leaving everything blank — stored as null, filled in later', () => {
    const r = validateDatosFiscales({ rfc: '', razonSocial: ' ', codigoPostal: '', usoCfdi: '' });
    assert.deepEqual(r, {
      ok: true,
      value: { rfc: null, razonSocial: null, codigoPostal: null, usoCfdi: null },
      warnings: [],
    });
  });

  it('names each bad field: RFC with a wrong check digit, a four-digit CP, an unknown uso', () => {
    const r = validateDatosFiscales({
      rfc: 'EKU9003173CZ',
      razonSocial: '',
      codigoPostal: '6600',
      usoCfdi: 'Z99',
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ['codigoPostal', 'rfc', 'usoCfdi']);
  });

  it('refuses a generic RFC as the business’s own', () => {
    const r = validateDatosFiscales({
      rfc: 'XAXX010101000',
      razonSocial: '',
      codigoPostal: '',
      usoCfdi: '',
    });
    assert.equal(r.ok, false);
  });

  it('warns — does not block — a personal-deduction uso on a persona moral', () => {
    const r = validateDatosFiscales({
      rfc: 'EKU9003173C9',
      razonSocial: 'ESCUELA',
      codigoPostal: '',
      usoCfdi: 'D01',
    });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.warnings.length, 1);
  });
});
