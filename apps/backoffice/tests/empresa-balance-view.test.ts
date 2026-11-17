import assert from 'node:assert/strict';
import { balanceGeneral, cuentasDeSocios, type SumaDeCuenta } from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import {
  cuadreDe,
  filasSocios,
  movimientosDeCuenta,
} from '../src/server/empresa/balance-cuadre-view';
import { hrefBalance, ladosDe, parseVistaBalance } from '../src/server/empresa/balance-view';

/** Balance's view (E-12, board CD-08): the URL, the sheet's rows, the check and the partners. */
const suma = (cuenta: string, debe: bigint, haber: bigint, previo = false): SumaDeCuenta => ({
  cuenta,
  previo,
  debe,
  haber,
  entryId: `E-${cuenta}`,
});

const OCT = balanceGeneral([
  suma('bancos', 9_663_850n, 0n),
  suma('proveedores', 0n, 348_000n),
  suma('capital_social', 0n, 1_200_000n),
  suma('afac', 0n, 12_000_000n),
  suma('administracion', 3_884_150n, 0n),
]);
const SEP = balanceGeneral([
  suma('bancos', 1_200_000n, 0n),
  suma('capital_social', 0n, 1_200_000n),
]);
const v = parseVistaBalance({ mes: '2026-10' }, '2026-11-17');

describe('parseVistaBalance', () => {
  it("reads a past month to its last day, against the previous month's", () => {
    assert.equal(v.hasta, '2026-10-31');
    assert.equal(v.hastaAnterior, '2026-09-30');
    assert.equal(v.esMesActual, false);
  });

  it('reads this month to today, and never a month to come', () => {
    const hoy = parseVistaBalance({ mes: '2027-02' }, '2026-11-17');
    assert.equal(hoy.mes, '2026-11');
    assert.equal(hoy.hasta, '2026-11-17');
    assert.equal(hoy.esMesActual, true);
  });

  it('falls back to this month on a bad month, and drops an account it cannot open', () => {
    const bad = parseVistaBalance({ mes: '2026-13', abrir: 'ingresos' }, '2026-11-17');
    assert.equal(bad.mes, '2026-11');
    assert.equal(bad.abrir, null);
    assert.equal(
      parseVistaBalance({ mes: '2026-10', abrir: 'bancos' }, '2026-11-17').abrir,
      'bancos',
    );
  });

  it('links a month and an open account', () => {
    assert.equal(hrefBalance(v, { abrir: 'bancos' }), '/empresa/balance?mes=2026-10&abrir=bancos');
    assert.equal(hrefBalance(v), '/empresa/balance?mes=2026-10');
  });
});

describe('ladosDe', () => {
  const [izquierdo, derecho] = ladosDe(OCT, SEP, v);

  it('puts Activo on one side and Pasivo and Capital on the other', () => {
    assert.deepEqual(
      izquierdo?.map((g) => g.nombre),
      ['Activo'],
    );
    assert.deepEqual(
      derecho?.map((g) => g.nombre),
      ['Pasivo', 'Capital'],
    );
  });

  it('hides an asset or liability at zero in both months, never a capital line', () => {
    const activo = izquierdo?.[0]?.cuentas.map((c) => c.id);
    assert.deepEqual(activo, ['bancos']);
    const capital = derecho?.[1]?.cuentas.map((c) => c.id);
    assert.deepEqual(capital, ['capital_social', 'afac', 'resultados_acumulados', 'resultado']);
  });

  it("shows the year's loss in red, linked to the year's Resultados", () => {
    const r = derecho?.[1]?.cuentas.find((c) => c.id === 'resultado');
    assert.equal(r?.actual, '−$38,841.50');
    assert.equal(r?.negativo, true);
    assert.equal(r?.nota, 'Pérdida de 2026, del estado de resultados');
    assert.equal(r?.href, '/empresa/resultados?periodo=2026');
    assert.equal(derecho?.[1]?.total, '$93,158.50');
  });

  it('dates the IVA it owes to the 17th of the next month', () => {
    const iva = balanceGeneral([suma('bancos', 100n, 0n), suma('iva_trasladado', 0n, 100n)]);
    const nota = ladosDe(iva, SEP, v)[1]?.[0]?.cuentas.find((c) => c.id === 'iva_trasladado')?.nota;
    assert.equal(nota, 'IVA de lo cobrado: se paga al SAT el 17 nov');
  });
});

describe('cuadreDe', () => {
  it('says the sheet balances, with its three totals', () => {
    const c = cuadreDe(OCT, null);
    assert.equal(c.cuadra, true);
    assert.equal(c.titulo, '$96,638.50 = $3,480.00 + $93,158.50');
  });

  it('says by how much it is off, and which movement uses an unknown account', () => {
    const roto = balanceGeneral([
      ...[suma('bancos', 0n, 48_000n)],
      suma('caja_chica', 48_000n, 0n),
    ]);
    const c = cuadreDe(roto, { fecha: '2026-10-24', concepto: 'Caja chica', cuenta: 'caja_chica' });
    assert.equal(c.cuadra, false);
    assert.equal(c.titulo, 'No cuadra por $480.00');
    assert.match(c.texto, /El movimiento del 24 oct «Caja chica» usa la cuenta «caja_chica»/);
  });

  it('blames lines that do not add up when no account is unknown', () => {
    const c = cuadreDe(balanceGeneral([suma('bancos', 100n, 0n)]), null);
    assert.equal(c.cuadra, false);
    assert.match(c.texto, /no suman igual/);
  });
});

describe('filasSocios', () => {
  it("adds each partner's contributions and a total row", () => {
    const cuentas = cuentasDeSocios([
      {
        kind: 'aportacion_capital',
        lines: [{ cuenta: 'capital_social', debe: 0n, haber: 600_000n, socio: 1 }],
      },
      {
        kind: 'fondeo_mitades',
        lines: [{ cuenta: 'afac', debe: 0n, haber: 7_000_000n, socio: 1 }],
      },
      {
        kind: 'prestamo_socio',
        lines: [{ cuenta: 'prestamos_socios', debe: 0n, haber: 1_000_000n, socio: 1 }],
      },
      {
        kind: 'aportacion_capital',
        lines: [{ cuenta: 'capital_social', debe: 0n, haber: 600_000n, socio: 2 }],
      },
    ]);
    const filas = filasSocios(cuentas, { 1: 'Fundador 1', 2: 'Fundador 2' });
    assert.deepEqual(
      filas.map((f) => [f.nombre, f.capital, f.aportaciones, f.prestamo, f.total]),
      [
        ['Fundador 1', '$6,000.00', '$70,000.00', '$10,000.00', '$86,000.00'],
        ['Fundador 2', '$6,000.00', '$0.00', '$0.00', '$6,000.00'],
        ['Total', '$12,000.00', '$70,000.00', '$10,000.00', '$92,000.00'],
      ],
    );
  });
});

describe('movimientosDeCuenta', () => {
  it("signs each line on the account's own side", () => {
    const lineas = [
      { entryId: 'a', fecha: '2026-10-02', concepto: 'Cobro', debe: 100_00n, haber: 0n },
      { entryId: 'b', fecha: '2026-10-09', concepto: 'Vercel', debe: 0n, haber: 40_00n },
    ];
    assert.deepEqual(
      movimientosDeCuenta('bancos', lineas).map((m) => [m.fecha, m.monto]),
      [
        ['2 oct', '$100.00'],
        ['9 oct', '−$40.00'],
      ],
    );
    assert.equal(movimientosDeCuenta('proveedores', lineas)[0]?.monto, '−$100.00');
  });
});
