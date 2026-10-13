import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertReembolsoCabe,
  cuentasDeSocios,
  MontoInvalidoError,
  mitad,
  nombreTrimestre,
  postMovement,
  rangoDelTrimestre,
  ReembolsoExcedeSaldoError,
  repartoDelDinero,
  reverseLines,
  trimestreAnterior,
  trimestreDe,
  ultimoDiaDelTrimestre,
  TrimestreInvalidoError,
  type Movement,
} from '../../src/corp/index.js';

/** E-03: the agreement's money rules (Quinta) and the partner accounts. */
describe('repartoDelDinero (the 1:1 cap)', () => {
  it('counts additional money for the pool up to the deliverables, the rest is a loan', () => {
    assert.deepEqual(repartoDelDinero(30_000_00n, 20_000_00n), {
      bolsa: 20_000_00n,
      prestamo: 10_000_00n,
    });
  });

  it('counts all of it when it fits under the cap', () => {
    assert.deepEqual(repartoDelDinero(30_000_00n, 50_000_00n), {
      bolsa: 30_000_00n,
      prestamo: 0n,
    });
  });

  it('counts nothing without finished deliverables: money cannot buy shares', () => {
    assert.deepEqual(repartoDelDinero(70_000_00n, 0n), { bolsa: 0n, prestamo: 70_000_00n });
  });

  it('refuses negative amounts', () => {
    assert.throws(() => repartoDelDinero(-1n, 0n), MontoInvalidoError);
    assert.throws(() => repartoDelDinero(0n, -1n), MontoInvalidoError);
  });
});

describe('mitad (the equal funding call)', () => {
  it('asks each partner for half', () => {
    assert.equal(mitad(20_000_00n), 10_000_00n);
  });

  it('rounds an odd centavo up, so the call is always covered', () => {
    assert.equal(mitad(1_001n), 501n);
  });

  it('refuses an empty call', () => {
    assert.throws(() => mitad(0n), MontoInvalidoError);
  });
});

describe('quarters', () => {
  it('names the quarter of a date and its range', () => {
    assert.equal(trimestreDe('2026-10-08'), '2026-T4');
    assert.deepEqual(rangoDelTrimestre('2026-T4'), ['2026-10-01', '2027-01-01']);
    assert.deepEqual(rangoDelTrimestre('2026-T1'), ['2026-01-01', '2026-04-01']);
  });

  it('names a quarter the way the boards do', () => {
    assert.equal(nombreTrimestre('2026-T4'), '4T 2026');
  });

  it('dates a quarter close on its last day', () => {
    assert.equal(ultimoDiaDelTrimestre('2026-T1'), '2026-03-31');
    assert.equal(ultimoDiaDelTrimestre('2026-T4'), '2026-12-31');
  });

  it('steps back across the year', () => {
    assert.equal(trimestreAnterior('2026-T1'), '2025-T4');
    assert.equal(trimestreAnterior('2026-T3'), '2026-T2');
  });

  it('refuses what is not a quarter', () => {
    assert.throws(() => rangoDelTrimestre('2026-T5'), TrimestreInvalidoError);
    assert.throws(() => trimestreDe('ayer'), TrimestreInvalidoError);
  });
});

const entry = (id: string, movement: Movement, reversesEntryId: string | null = null) => ({
  id,
  kind: movement.kind,
  reversesEntryId,
  lines: postMovement(movement),
});

describe('cuentasDeSocios', () => {
  const entries = [
    entry('c1', { kind: 'aportacion_capital', socio: 1, monto: 5_000_00n }),
    entry('c2', { kind: 'aportacion_capital', socio: 2, monto: 5_000_00n }),
    entry('f1', { kind: 'fondeo_mitades', socio: 1, monto: 10_000_00n }),
    entry('a2', { kind: 'aportacion_adicional', socio: 2, monto: 30_000_00n }),
    entry('x2', { kind: 'excedente_a_prestamo', socio: 2, monto: 10_000_00n }),
    entry('p1', { kind: 'prestamo_socio', socio: 1, monto: 8_000_00n }),
    entry('r1', { kind: 'reembolso_socio', socio: 1, monto: 3_000_00n }),
  ];

  it('keeps each partner apart, by account and by kind', () => {
    const c = cuentasDeSocios(entries);
    assert.deepEqual(c[1], {
      capital: 5_000_00n,
      fondeo: 10_000_00n,
      adicional: 0n,
      prestamo: 5_000_00n,
      reembolsado: 3_000_00n,
    });
    assert.deepEqual(c[2], {
      capital: 5_000_00n,
      fondeo: 0n,
      adicional: 20_000_00n,
      prestamo: 10_000_00n,
      reembolsado: 0n,
    });
  });

  it('nets a reversed movement out', () => {
    const p = entry('p', { kind: 'prestamo_socio', socio: 1, monto: 8_000_00n });
    const rev = { ...p, id: 'rp', reversesEntryId: 'p', lines: reverseLines(p.lines) };
    assert.equal(cuentasDeSocios([p, rev])[1].prestamo, 0n);
  });

  it('starts both partners at zero', () => {
    assert.equal(cuentasDeSocios([])[2].capital, 0n);
  });

  it('accrues no interest: a loan is what was lent minus what was repaid', () => {
    const p = entry('p', { kind: 'prestamo_socio', socio: 2, monto: 1_000_00n });
    assert.equal(
      cuentasDeSocios([p, p, p].map((e, i) => ({ ...e, id: `${i}` })))[2].prestamo,
      3_000_00n,
    );
  });
});

describe('assertReembolsoCabe', () => {
  it('lets a repayment up to the balance through', () => {
    assert.doesNotThrow(() => assertReembolsoCabe(5_000_00n, 5_000_00n));
  });

  it('refuses a repayment over the balance', () => {
    assert.throws(() => assertReembolsoCabe(5_000_00n, 5_000_01n), ReembolsoExcedeSaldoError);
  });

  it('refuses a repayment with no loan at all', () => {
    assert.throws(() => assertReembolsoCabe(0n, 1n), ReembolsoExcedeSaldoError);
  });
});
