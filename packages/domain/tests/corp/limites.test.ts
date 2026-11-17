import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertTopes,
  medidorDe,
  proyeccionAlCierre,
  TopeInvalidoError,
} from '../../src/corp/limites/index.js';

/**
 * E-15, board CD-12d. October 2026: $7,350 of income so far, October's $3,900
 * repeated for the two months left → $15,150 at December. The SAS cap of
 * 2026 is $7,678,849.94 and RESICO persona moral's $35,000,000.
 */
const SAS_2026 = 767_884_994n;
const RESICO = 3_500_000_000n;

describe('proyeccionAlCierre', () => {
  it("adds last month's income once for every month after this one", () => {
    assert.equal(proyeccionAlCierre(735_000n, 390_000n, 10), 1_515_000n);
  });

  it('projects nothing more in December', () => {
    assert.equal(proyeccionAlCierre(735_000n, 390_000n, 12), 735_000n);
  });

  it('never projects a month of refunds as negative income', () => {
    assert.equal(proyeccionAlCierre(735_000n, -50_000n, 10), 735_000n);
  });

  it('refuses a month that is not one', () => {
    assert.throws(() => proyeccionAlCierre(0n, 0n, 13), TopeInvalidoError);
  });
});

describe('medidorDe', () => {
  it("measures board CD-12d's October, far under every line", () => {
    const sas = medidorDe(735_000n, 1_515_000n, SAS_2026);
    assert.equal(sas.avance, 957);
    assert.equal(sas.avanceProyectado, 1_972);
    assert.equal(sas.nivel, null);
    assert.equal(sas.loPasa, false);
  });

  it('lights 80 % at 80 %, and says the projection passes the cap', () => {
    const sas = medidorDe(614_308_000n, 790_000_000n, SAS_2026);
    assert.equal(sas.nivel, 80);
    assert.equal(sas.loPasa, true);
  });

  it('lights 60 and 95 at their own lines, and nothing at 59.9 %', () => {
    assert.equal(medidorDe(60n, 60n, 100n).nivel, 60);
    assert.equal(medidorDe(95n, 95n, 100n).nivel, 95);
    assert.equal(medidorDe(5_999n, 5_999n, 10_000n).nivel, null);
  });

  it('refuses a cap that is not positive', () => {
    assert.throws(() => medidorDe(1n, 1n, 0n), TopeInvalidoError);
  });

  it('measures a loss-making year as zero, not a negative share', () => {
    assert.equal(medidorDe(-100n, -100n, RESICO).avance, 0);
  });
});

describe('assertTopes', () => {
  it("takes a year's two caps", () => {
    assert.doesNotThrow(() => assertTopes({ anio: 2027, sas: SAS_2026, resico: RESICO }));
  });

  it('refuses a year outside 2000–2100', () => {
    assert.throws(
      () => assertTopes({ anio: 1999, sas: SAS_2026, resico: RESICO }),
      TopeInvalidoError,
    );
  });

  it('refuses a cap at zero or below', () => {
    assert.throws(() => assertTopes({ anio: 2027, sas: 0n, resico: RESICO }), TopeInvalidoError);
    assert.throws(() => assertTopes({ anio: 2027, sas: SAS_2026, resico: -1n }), TopeInvalidoError);
  });
});
