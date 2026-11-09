import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  ConsentGrantSchema,
  consentimientoDeNovedades,
  estadoDePrivacidad,
  reconsentimiento,
  type ConsentimientoGuardado,
} from '../../src/index.js';

const aviso = (version: string) => ({ version, sha256: 'a'.repeat(64) });
const fila = (o: Partial<ConsentimientoGuardado>): ConsentimientoGuardado => ({
  purpose: 'necesarias',
  granted: true,
  avisoVersion: '0.2-borrador',
  createdAt: '2026-09-12T16:14:00.000Z',
  ...o,
});

describe('estadoDePrivacidad (ADR-137)', () => {
  it('reads the accepted version, when, and the latest novedades choice', () => {
    const e = estadoDePrivacidad(
      [
        fila({}),
        fila({ purpose: 'novedades', granted: true }),
        fila({ purpose: 'novedades', granted: false, createdAt: '2026-10-01T00:00:00.000Z' }),
      ],
      '0.2-borrador',
    );
    assert.deepEqual(e, {
      aceptado: { version: '0.2-borrador', at: '2026-09-12T16:14:00.000Z' },
      novedades: false,
      avisoNuevo: false,
    });
  });

  it('a newer aviso than the one accepted is an aviso nuevo', () => {
    assert.equal(estadoDePrivacidad([fila({})], '0.3-borrador').avisoNuevo, true);
  });

  it('the latest necesarias row wins, whatever order the rows arrive in', () => {
    const e = estadoDePrivacidad(
      [fila({ avisoVersion: '0.3-borrador', createdAt: '2026-11-06T00:00:00.000Z' }), fila({})],
      '0.3-borrador',
    );
    assert.equal(e.aceptado?.version, '0.3-borrador');
    assert.equal(e.avisoNuevo, false);
  });

  it('an account with no rows has accepted nothing yet and gets no novedades', () => {
    assert.deepEqual(estadoDePrivacidad([], '0.3-borrador'), {
      aceptado: null,
      novedades: false,
      avisoNuevo: true,
    });
  });

  it('a refused necesarias row is not an acceptance', () => {
    assert.equal(estadoDePrivacidad([fila({ granted: false })], '0.2-borrador').aceptado, null);
  });
});

describe('the grants of the privacy page', () => {
  it('the novedades switch is one explicit row on the configuración surface', () => {
    const g = consentimientoDeNovedades(aviso('0.2-borrador'), false);
    assert.deepEqual(g, {
      avisoVersion: '0.2-borrador',
      avisoSha256: 'a'.repeat(64),
      surface: 'configuracion',
      purpose: 'novedades',
      granted: false,
      method: 'boton',
    });
    assert.ok(ConsentGrantSchema.safeParse(g).success);
  });

  it('accepting a new aviso is express for necesarias and carries novedades over', () => {
    const [nec, nov] = reconsentimiento(aviso('0.3-borrador'), true);
    assert.equal(nec?.surface, 'reconsentimiento');
    assert.equal(nec?.method, 'boton');
    assert.equal(nec?.granted, true);
    assert.equal(nov?.purpose, 'novedades');
    assert.equal(nov?.granted, true);
    for (const g of [nec, nov]) assert.ok(ConsentGrantSchema.safeParse(g).success);
  });

  it('carrying a refusal over keeps it a refusal', () => {
    const [, nov] = reconsentimiento(aviso('0.3-borrador'), false);
    assert.equal(nov?.granted, false);
  });

  it('every grant validates; a tacit necesarias would not', () => {
    const bad = {
      ...consentimientoDeNovedades(aviso('x'), true),
      purpose: 'necesarias',
      method: 'tacito',
    };
    assert.equal(ConsentGrantSchema.safeParse(bad).success, false);
  });
});
