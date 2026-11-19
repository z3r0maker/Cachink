import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { ImporteResultados } from '../../src/corp/resultados/index.js';
import {
  ImpuestosInvalidosError,
  mesesFiscales,
  type LineaFiscal,
} from '../../src/corp/impuestos/index.js';

/** E-13: the ledger's lines summed into each month's cash-basis tax figures. */
const importe = (
  cuenta: ImporteResultados['cuenta'],
  monto: bigint,
  fechaFlujo: string | null,
  deducible: boolean | null = true,
): ImporteResultados => ({
  entryId: 'e',
  concepto: 'x',
  cuenta,
  importe: monto,
  fecha: fechaFlujo ?? '2026-09-01',
  fechaFlujo,
  deducible,
});

const linea = (fecha: string, cuenta: LineaFiscal['cuenta'], debe: bigint, haber: bigint) => ({
  fecha,
  cuenta,
  debe,
  haber,
});

describe('mesesFiscales', () => {
  const meses = mesesFiscales({
    desde: '2026-09',
    hasta: '2026-10',
    importes: [
      importe('ingresos', 10_000_00n, '2026-09-05'),
      importe('administracion', 3_500_00n, '2026-10-12'),
      importe('ventas_marketing', 900_00n, '2026-10-20', false),
      importe('desarrollo', 2_000_00n, null),
      importe('ingresos', 5_000_00n, '2026-11-01'),
    ],
    lineas: [
      linea('2026-09-05', 'iva_trasladado', 0n, 1_600_00n),
      linea('2026-10-12', 'iva_acreditable', 560_00n, 0n),
      linea('2026-10-12', 'retenciones_por_pagar', 0n, 723_33n),
      linea('2026-10-30', 'iva_trasladado', 160_00n, 0n),
    ],
    retencionesIsr: [{ fecha: '2026-10-12', monto: 350_00n }],
  });

  it('gives one month per month of the range, empty ones included', () => {
    assert.deepEqual(
      meses.map((m) => m.mes),
      ['2026-09', '2026-10'],
    );
  });

  it('counts income and deductions on the day their money moved, the deductible ones only', () => {
    assert.equal(meses[0]?.ingresos, 10_000_00n);
    assert.equal(meses[1]?.deducciones, 3_500_00n);
    assert.equal(meses[1]?.ingresos, 0n);
  });

  it('nets the IVA lines, a reversal included, and splits the withholdings', () => {
    assert.equal(meses[0]?.ivaTrasladado, 1_600_00n);
    assert.equal(meses[1]?.ivaTrasladado, -160_00n);
    assert.equal(meses[1]?.ivaAcreditable, 560_00n);
    assert.equal(meses[1]?.retencionIsr, 350_00n);
    assert.equal(meses[1]?.retencionIva, 373_33n);
  });

  it('refuses a range that ends before it starts', () => {
    assert.throws(
      () =>
        mesesFiscales({
          desde: '2026-10',
          hasta: '2026-09',
          importes: [],
          lineas: [],
          retencionesIsr: [],
        }),
      ImpuestosInvalidosError,
    );
  });

  it('refuses a range that is not months', () => {
    assert.throws(
      () =>
        mesesFiscales({
          desde: '2026-9',
          hasta: '2026-10',
          importes: [],
          lineas: [],
          retencionesIsr: [],
        }),
      ImpuestosInvalidosError,
    );
  });
});
