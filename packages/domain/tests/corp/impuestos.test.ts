import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  ImpuestosInvalidosError,
  estimadosDeImpuestos,
  type Declaracion,
  type MesFiscal,
} from '../../src/corp/impuestos/index.js';

/**
 * E-13's estimates, hand-worked (board CD-09): ISR provisional of a RESICO
 * persona moral on the year's cash basis, IVA del mes with the earlier saldo
 * a favor credited, and the month's withholdings.
 */
const mes = (m: string, o: Partial<MesFiscal> = {}): MesFiscal => ({
  mes: m,
  ingresos: 0n,
  deducciones: 0n,
  ivaTrasladado: 0n,
  ivaAcreditable: 0n,
  retencionIsr: 0n,
  retencionIva: 0n,
  ...o,
});

const MESES: readonly MesFiscal[] = [
  mes('2026-08', { deducciones: 20_000_00n, ivaAcreditable: 1_500_00n }),
  mes('2026-09', {
    ingresos: 30_000_00n,
    deducciones: 25_000_00n,
    ivaTrasladado: 4_800_00n,
    ivaAcreditable: 2_000_00n,
    retencionIsr: 350_00n,
    retencionIva: 373_33n,
  }),
  mes('2026-10', {
    ingresos: 60_000_00n,
    deducciones: 20_000_00n,
    ivaTrasladado: 9_600_00n,
    ivaAcreditable: 3_200_00n,
  }),
  mes('2026-11', { ingresos: 10_000_00n, deducciones: 30_000_00n }),
];

const ninguna = new Map<string, Declaracion>();

describe('estimadosDeImpuestos', () => {
  it('pays no ISR while the year is at a loss, and IVA a favor carries to the next month', () => {
    const [ago, sep] = estimadosDeImpuestos(MESES, ninguna);
    assert.equal(ago?.isr.utilidad, -20_000_00n);
    assert.equal(ago?.isr.aPagar, 0n);
    assert.equal(ago?.iva.aPagar, 0n);
    assert.equal(ago?.iva.aFavor, 1_500_00n);
    assert.equal(sep?.iva.aFavorAnterior, 1_500_00n);
    assert.equal(sep?.iva.aPagar, 1_300_00n);
    assert.equal(sep?.retenciones.total, 723_33n);
    assert.equal(sep?.total, 2_023_33n);
  });

  it('taxes the year-to-date profit at 30 % and credits the earlier provisional payments', () => {
    const r = estimadosDeImpuestos(MESES, ninguna);
    const oct = r[2];
    assert.equal(oct?.isr.ingresosAnio, 90_000_00n);
    assert.equal(oct?.isr.deduccionesAnio, 65_000_00n);
    assert.equal(oct?.isr.causado, 7_500_00n);
    assert.equal(oct?.isr.pagosAnteriores, 0n);
    assert.equal(oct?.isr.aPagar, 7_500_00n);
    const nov = r[3];
    assert.equal(nov?.isr.causado, 1_500_00n);
    assert.equal(nov?.isr.pagosAnteriores, 7_500_00n);
    assert.equal(nov?.isr.aPagar, 0n);
  });

  it("credits the contador's declared ISR, not the estimate, once a month is declared", () => {
    const declarada = new Map<string, Declaracion>([
      [
        '2026-10',
        {
          periodo: '2026-10',
          isr: 7_000_00n,
          iva: 6_400_00n,
          retencionIsr: 0n,
          retencionIva: 0n,
          lineaImporte: null,
          lineaVigencia: null,
        },
      ],
    ]);
    const nov = estimadosDeImpuestos(MESES, declarada)[3];
    assert.equal(nov?.isr.pagosAnteriores, 7_000_00n);
  });

  it('starts the ISR over in January but keeps the IVA a favor', () => {
    const r = estimadosDeImpuestos(
      [
        mes('2026-12', { ingresos: 50_000_00n, ivaAcreditable: 900_00n }),
        mes('2027-01', { ingresos: 10_000_00n, ivaTrasladado: 400_00n }),
      ],
      ninguna,
    );
    assert.equal(r[1]?.isr.ingresosAnio, 10_000_00n);
    assert.equal(r[1]?.isr.pagosAnteriores, 0n);
    assert.equal(r[1]?.iva.aFavorAnterior, 900_00n);
    assert.equal(r[1]?.iva.aPagar, 0n);
    assert.equal(r[1]?.iva.aFavor, 500_00n);
  });

  it('returns nothing for no months', () => {
    assert.deepEqual(estimadosDeImpuestos([], ninguna), []);
  });

  it('refuses months that are not consecutive', () => {
    assert.throws(
      () => estimadosDeImpuestos([mes('2026-08'), mes('2026-10')], ninguna),
      ImpuestosInvalidosError,
    );
  });

  it('refuses a month that is not one', () => {
    assert.throws(() => estimadosDeImpuestos([mes('2026-13')], ninguna), ImpuestosInvalidosError);
  });

  it('refuses the same month twice', () => {
    assert.throws(
      () => estimadosDeImpuestos([mes('2026-08'), mes('2026-08')], ninguna),
      ImpuestosInvalidosError,
    );
  });

  it('nets a reversal: a month whose income went negative still adds up the year', () => {
    const r = estimadosDeImpuestos(
      [mes('2026-03', { ingresos: 10_000_00n }), mes('2026-04', { ingresos: -2_000_00n })],
      ninguna,
    );
    assert.equal(r[1]?.isr.ingresosAnio, 8_000_00n);
    assert.equal(r[1]?.isr.causado, 2_400_00n);
    assert.equal(r[1]?.isr.aPagar, 0n);
  });
});
