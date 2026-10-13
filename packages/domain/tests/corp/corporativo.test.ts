import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  AccionesInsuficientesError,
  alertasDeCertificados,
  assertCertificado,
  assertEventoAcciones,
  CertificadoInvalidoError,
  certificadosVigentes,
  EventoAccionesInvalidoError,
  tenencias,
  type Certificado,
  type EventoAcciones,
} from '../../src/corp/index.js';

/** E-06: the share register and the certificates' expiries. */
const constitucion: EventoAcciones[] = [
  { fecha: '2026-09-02', tipo: 'suscripcion', de: null, a: 1, acciones: 6_000 },
  { fecha: '2026-09-02', tipo: 'suscripcion', de: null, a: 2, acciones: 6_000 },
];

describe('tenencias', () => {
  it('adds subscriptions and moves transfers between partners', () => {
    const t = tenencias([
      ...constitucion,
      { fecha: '2027-03-01', tipo: 'transmision', de: 2, a: 1, acciones: 600 },
    ]);
    assert.deepEqual(t, { 1: 6_600, 2: 5_400, total: 12_000 });
  });

  it('starts empty', () => {
    assert.deepEqual(tenencias([]), { 1: 0, 2: 0, total: 0 });
  });
});

describe('assertEventoAcciones', () => {
  it('lets a partner transfer what they hold', () => {
    assert.doesNotThrow(() =>
      assertEventoAcciones(constitucion, {
        fecha: '2027-03-01',
        tipo: 'transmision',
        de: 1,
        a: 2,
        acciones: 6_000,
      }),
    );
  });

  it('refuses a transfer larger than the holding', () => {
    assert.throws(
      () =>
        assertEventoAcciones(constitucion, {
          fecha: '2027-03-01',
          tipo: 'transmision',
          de: 1,
          a: 2,
          acciones: 6_001,
        }),
      AccionesInsuficientesError,
    );
  });

  it('refuses a transfer to oneself, or without its origin', () => {
    const base = { fecha: '2027-03-01', tipo: 'transmision' as const, acciones: 1 };
    assert.throws(
      () => assertEventoAcciones(constitucion, { ...base, de: 1, a: 1 }),
      EventoAccionesInvalidoError,
    );
    assert.throws(
      () => assertEventoAcciones(constitucion, { ...base, de: null, a: 1 }),
      EventoAccionesInvalidoError,
    );
  });

  it('refuses a fraction or zero of a share, and a subscription with an origin', () => {
    const base = { fecha: '2027-03-01', tipo: 'suscripcion' as const, de: null, a: 1 as const };
    assert.throws(
      () => assertEventoAcciones([], { ...base, acciones: 0 }),
      EventoAccionesInvalidoError,
    );
    assert.throws(
      () => assertEventoAcciones([], { ...base, acciones: 1.5 }),
      EventoAccionesInvalidoError,
    );
    assert.throws(
      () => assertEventoAcciones([], { ...base, de: 2, acciones: 10 }),
      EventoAccionesInvalidoError,
    );
  });
});

describe('certificates', () => {
  const csd = (vence: string, id = 'c'): Certificado => ({
    id,
    tipo: 'csd',
    titular: 'mexia',
    serie: '00001000000512345678',
    vence,
  });

  it('keeps the newest certificate of each kind and holder', () => {
    const vigentes = certificadosVigentes([csd('2026-11-18', 'old'), csd('2030-11-18', 'new')]);
    assert.deepEqual(
      vigentes.map((c) => c.id),
      ['new'],
    );
  });

  it('raises a signal for what expires within 60 days, and for what already expired', () => {
    const a = alertasDeCertificados([csd('2026-11-18')], '2026-10-08');
    assert.deepEqual(a, [{ certificado: csd('2026-11-18'), dias: 41 }]);
    assert.equal(alertasDeCertificados([csd('2026-12-31')], '2026-10-08').length, 0);
    assert.equal(alertasDeCertificados([csd('2026-10-01')], '2026-10-08')[0]?.dias, -7);
  });

  it('keeps only a serial number and a date: never anything that looks like a key', () => {
    assert.doesNotThrow(() => assertCertificado(csd('2030-01-01')));
    assert.throws(
      () => assertCertificado({ ...csd('2030-01-01'), serie: '-----BEGIN PRIVATE KEY-----' }),
      CertificadoInvalidoError,
    );
    assert.throws(() => assertCertificado({ ...csd('2030-02-30') }), CertificadoInvalidoError);
  });
});
