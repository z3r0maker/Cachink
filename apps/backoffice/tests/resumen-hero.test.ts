import assert from 'node:assert/strict';
import type { Autonomia, MovimientoCaja } from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import { autonomiaDeHoy, heroDe } from '../src/server/empresa/resumen-hero';

/** Resumen's hero (E-16, boards CD-12, CD-12b and CD-12c) in the boards' own figures. */
const base: Autonomia = {
  caja: 0n,
  mesesConDatos: 3,
  entra: 0n,
  sale: 0n,
  neto: 0n,
  autosuficiente: null,
  enDoceMeses: null,
  caidaMaximaBps: null,
  equilibrio: null,
  mesesDeCaja: null,
  mesesSinIngresos: null,
};

/** CD-12b: $4,180 in, $21,350 out, $112,640.50 in the bank. */
const FONDEO: Autonomia = {
  ...base,
  caja: 112_640_50n,
  entra: 4_180_00n,
  sale: 21_350_00n,
  neto: -17_170_00n,
  autosuficiente: false,
  equilibrio: 21_350_00n,
  mesesDeCaja: 6.5,
  mesesSinIngresos: 5.2,
};

/** CD-12: income covers the spending with room to spare. */
const SANA: Autonomia = {
  ...base,
  caja: 184_320_50n,
  entra: 38_400_00n,
  sale: 25_330_00n,
  neto: 13_070_00n,
  autosuficiente: true,
  enDoceMeses: 341_160_50n,
  caidaMaximaBps: 3403,
  equilibrio: 25_330_00n,
  mesesSinIngresos: 7.2,
};

const HOY = '2026-10-15';

describe('heroDe', () => {
  it('draws CD-12b when the partners still fund the operation', () => {
    const h = heroDe(FONDEO, HOY);
    if (h.estado !== 'fondeo') return assert.fail(`expected fondeo, got ${h.estado}`);
    assert.equal(h.titulo, 'La operación aún depende de los socios');
    assert.equal(h.insignia, 'Necesita fondeo');
    assert.match(h.explica, /Cada mes salen \$17,170 más de los que entran/);
    assert.deepEqual(
      h.tarjetas.map((t) => [t.etiqueta, t.valor]),
      [
        ['Si los ingresos se mantienen', '6.5 meses'],
        ['Para dejar de poner dinero', '$21,350 al mes'],
        ['Si los ingresos se detuvieran hoy', '5.2 meses'],
      ],
    );
    assert.match(h.tarjetas[0].nota, /hasta abril de 2027/);
    assert.match(h.tarjetas[1].nota, /5\.1 veces lo de hoy/);
    assert.match(h.tarjetas[2].nota, /hasta marzo de 2027/);
    assert.equal(h.tarjetas[2].aviso, true);
    assert.equal(
      h.pie,
      'Con caja de $112,640.50 y el promedio de los últimos 3 meses: entran $4,180 y salen $21,350 al mes, sin contar el dinero de los socios.',
    );
  });

  it('draws CD-12 when the operation sustains itself', () => {
    const h = heroDe(SANA, HOY);
    if (h.estado !== 'autosuficiente')
      return assert.fail(`expected autosuficiente, got ${h.estado}`);
    assert.equal(h.titulo, 'La operación se sostiene sola');
    assert.equal(h.insignia, 'Autosuficiente');
    assert.deepEqual(
      h.tarjetas.map((t) => t.valor),
      ['Sin límite', 'Hasta 34 %', '7.2 meses'],
    );
    assert.match(h.tarjetas[0].nota, /\$341,161 en octubre de 2027/);
    assert.match(h.tarjetas[1].nota, /Punto de equilibrio: \$25,330 al mes/);
  });

  it('says the cash is gone instead of counting negative months', () => {
    const h = heroDe({ ...FONDEO, caja: -500_00n, mesesDeCaja: 0, mesesSinIngresos: 0 }, HOY);
    if (h.estado === 'sinDatos') return assert.fail('expected the funding hero');
    assert.equal(h.tarjetas[0].valor, '0 meses');
    assert.match(h.tarjetas[0].nota, /ya no alcanza/);
  });

  it('names the averaged months when there are fewer than three', () => {
    const h = heroDe({ ...FONDEO, mesesConDatos: 1 }, HOY);
    if (h.estado === 'sinDatos') return assert.fail('expected the funding hero');
    assert.match(h.pie, /el promedio del último mes/);
  });

  it('says there is no income instead of dividing by zero', () => {
    const h = heroDe({ ...FONDEO, entra: 0n, neto: -21_350_00n }, HOY);
    if (h.estado === 'sinDatos') return assert.fail('expected the funding hero');
    assert.match(h.tarjetas[1].nota, /Hoy no entra nada/);
  });

  it('draws CD-12c without movements, and with partner money alone', () => {
    assert.equal(heroDe(base, HOY).estado, 'sinDatos');
    const soloSocios = { ...base, caja: 200_000_00n, autosuficiente: true, equilibrio: 0n };
    assert.equal(heroDe(soloSocios, HOY).estado, 'sinDatos');
  });
});

const mov = (fecha: string, pesos: number, socios = false): MovimientoCaja => ({
  fecha,
  importe: BigInt(pesos * 100),
  socios,
});

describe('autonomiaDeHoy', () => {
  it('averages the three whole months before today', () => {
    const a = autonomiaDeHoy(
      [
        mov('2026-06-01', 100_000, true),
        mov('2026-07-10', 3_000),
        mov('2026-08-10', 6_000),
        mov('2026-09-10', 9_000),
        mov('2026-10-02', 50_000),
      ],
      '2026-10-15',
    );
    assert.equal(a.mesesConDatos, 3);
    assert.equal(a.entra, 6_000_00n, 'October is still running and is left out');
    assert.equal(a.caja, 168_000_00n);
  });

  it('reads the running month when the company started in it', () => {
    const a = autonomiaDeHoy(
      [mov('2026-10-01', 50_000, true), mov('2026-10-05', -2_000)],
      '2026-10-15',
    );
    assert.equal(a.mesesConDatos, 1);
    assert.equal(a.sale, 2_000_00n);
  });

  it('has no data without movements', () => {
    assert.equal(autonomiaDeHoy([], '2026-10-15').mesesConDatos, 0);
  });
});
