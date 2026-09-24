import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  SolicitudArcoSchema,
  diasDeDescanso,
  esDiaHabil,
  finDelDiaCdmx,
  plazosArco,
  sumarDiasHabiles,
  type IsoDate,
} from '../../src/index.js';

const d = (s: string) => s as IsoDate;

describe('días hábiles (LFT art. 74)', () => {
  it('lists the rest days of 2026, Mondays moved', () => {
    assert.deepEqual(diasDeDescanso(2026), [
      '2026-01-01',
      '2026-02-02',
      '2026-03-16',
      '2026-05-01',
      '2026-09-16',
      '2026-11-16',
      '2026-12-25',
    ]);
  });

  it('adds 1 October only in a transition year', () => {
    assert.ok(diasDeDescanso(2030).includes(d('2030-10-01')));
    assert.ok(!diasDeDescanso(2026).includes(d('2026-10-01')));
  });

  it('weekends and rest days are not hábiles', () => {
    assert.equal(esDiaHabil(d('2026-09-26')), false); // Saturday
    assert.equal(esDiaHabil(d('2026-09-16')), false); // Independencia, a Wednesday
    assert.equal(esDiaHabil(d('2026-09-17')), true);
  });

  it('counts from the day after, skipping weekends and rest days', () => {
    // Fri 11 Sep 2026 + 5: Mon 14, Tue 15, (Wed 16 off), Thu 17, Fri 18, Mon 21.
    assert.equal(sumarDiasHabiles(d('2026-09-11'), 5), '2026-09-21');
  });

  it('refuses a count that is not a positive integer', () => {
    for (const n of [0, -1, 1.5]) assert.throws(() => sumarDiasHabiles(d('2026-09-11'), n));
  });
});

describe('plazosArco', () => {
  it('answers in 20 días hábiles and executes in 15 more, in Mexico City time', () => {
    // 23:30 on Wed 23 Sep in CDMX is already the 24th in UTC; it counts as the 23rd.
    const p = plazosArco(new Date('2026-09-24T05:30:00Z'));
    assert.equal(p.recibida, '2026-09-23');
    assert.equal(p.responderA, '2026-10-21');
    assert.equal(p.ejecutarA, '2026-11-11');
  });

  it('a request over the November long weekend skips the rest day', () => {
    const p = plazosArco(new Date('2026-11-13T18:00:00Z'));
    assert.equal(p.responderA, '2026-12-14');
  });

  it('the deadline instant is the end of the day in CDMX', () => {
    assert.equal(finDelDiaCdmx(d('2026-10-21')), '2026-10-21T23:59:59-06:00');
  });
});

describe('SolicitudArcoSchema', () => {
  const ok = {
    nombre: 'Ana López',
    correo: 'ana@example.mx',
    derecho: 'acceso',
    descripcion: 'Quiero saber qué datos míos tienen.',
  };

  it('accepts a complete request', () => {
    assert.ok(SolicitudArcoSchema.safeParse(ok).success);
  });

  it('refuses a bad email, an unknown right and an empty description', () => {
    assert.equal(SolicitudArcoSchema.safeParse({ ...ok, correo: 'ana' }).success, false);
    assert.equal(SolicitudArcoSchema.safeParse({ ...ok, derecho: 'borrar' }).success, false);
    assert.equal(SolicitudArcoSchema.safeParse({ ...ok, descripcion: ' ' }).success, false);
  });
});
