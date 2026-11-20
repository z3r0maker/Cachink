import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  balanzaCsv,
  balanzaDelMes,
  listaDeCuentasCsv,
  type SumaDelTramo,
} from '../../src/corp/contador/index.js';
import { MontoInvalidoError } from '../../src/corp/ledger/index.js';

const s = (
  cuenta: string,
  tramo: SumaDelTramo['tramo'],
  debe: bigint,
  haber: bigint,
): SumaDelTramo => ({ cuenta, tramo, debe, haber });

/** Last year a sale of $1,000 (result) and this year one of $500 before the month, one of $200 in it. */
const sumas: SumaDelTramo[] = [
  s('bancos', 'anterior', 1_000_00n, 0n),
  s('ingresos', 'anterior', 0n, 1_000_00n),
  s('bancos', 'ejercicio', 500_00n, 0n),
  s('ingresos', 'ejercicio', 0n, 500_00n),
  s('bancos', 'mes', 200_00n, 30_00n),
  s('ingresos', 'mes', 0n, 200_00n),
  s('administracion', 'mes', 30_00n, 0n),
];

const fila = (b: ReturnType<typeof balanzaDelMes>, cuenta: string) => {
  const f = b.filas.find((x) => x.cuenta === cuenta);
  assert.ok(f, cuenta);
  return f;
};

describe('balanza del mes (E-43)', () => {
  it('lists the 22 accounts, moved or not, each on its own side', () => {
    const b = balanzaDelMes(sumas, new Map());
    assert.equal(b.filas.length, 22);
    assert.deepEqual(
      { ...fila(b, 'bancos') },
      {
        cuenta: 'bancos',
        nombre: 'Bancos',
        naturaleza: 'deudora',
        codigo: null,
        inicial: 1_500_00n,
        debe: 200_00n,
        haber: 30_00n,
        final: 1_670_00n,
      },
    );
    assert.equal(fila(b, 'afac').final, 0n);
  });

  it('a result account starts the year at zero; earlier years are in Resultados acumulados', () => {
    const b = balanzaDelMes(sumas, new Map());
    assert.equal(fila(b, 'ingresos').inicial, 500_00n);
    assert.equal(fila(b, 'ingresos').final, 700_00n);
    assert.equal(fila(b, 'resultados_acumulados').inicial, 1_000_00n);
    assert.equal(fila(b, 'administracion').final, 30_00n);
  });

  it('balances: the month debits equal its credits, and the debit balances the credit ones', () => {
    const b = balanzaDelMes(sumas, new Map());
    assert.equal(b.debe, 230_00n);
    assert.equal(b.haber, 230_00n);
    assert.equal(b.cuadra, true);
  });

  it('names the accounts with no code, and writes the code where there is one', () => {
    const b = balanzaDelMes(sumas, new Map([['bancos', '102.01']]));
    assert.equal(fila(b, 'bancos').codigo, '102.01');
    assert.equal(b.sinCodigo.length, 21);
    assert.equal(b.sinCodigo.includes('bancos'), false);
  });

  it('keeps a line in an account the chart does not know, apart, so nothing goes missing', () => {
    const b = balanzaDelMes([...sumas, s('caja_chica', 'mes', 5_00n, 0n)], new Map());
    assert.equal(b.filas.length, 23);
    assert.equal(fila(b, 'caja_chica').nombre, 'caja_chica');
    assert.deepEqual(b.sinClasificar, ['caja_chica']);
    assert.equal(b.cuadra, false);
  });

  it('refuses a negative sum', () => {
    assert.throws(
      () => balanzaDelMes([s('bancos', 'mes', -1n, 0n)], new Map()),
      MontoInvalidoError,
    );
  });

  it('an empty ledger is 22 rows at zero, and balances', () => {
    const b = balanzaDelMes([], new Map());
    assert.equal(
      b.filas.every((f) => f.final === 0n),
      true,
    );
    assert.equal(b.cuadra, true);
  });

  it('writes the CSV with a BOM, plain pesos, an empty code cell and a total', () => {
    const csv = balanzaCsv(balanzaDelMes(sumas, new Map([['bancos', '102.01']])));
    const lineas = csv.split('\r\n');
    assert.equal(
      lineas[0],
      '﻿Código agrupador,Cuenta,Naturaleza,Saldo inicial,Debe,Haber,Saldo final',
    );
    assert.equal(lineas[1], '102.01,Bancos,Deudora,1500.00,200.00,30.00,1670.00');
    assert.equal(lineas[2], ',Stripe por depositar,Deudora,0.00,0.00,0.00,0.00');
    assert.equal(lineas.at(-2), ',Total,,,230.00,230.00,');
    assert.equal(lineas.at(-1), '');
    assert.equal(lineas.length, 25);
  });

  it('writes the list for the contador: account, group, side and the code so far', () => {
    const csv = listaDeCuentasCsv(new Map([['ingresos', '401.01']]));
    const lineas = csv.split('\r\n');
    assert.equal(lineas[0], '﻿Cuenta,Grupo,Naturaleza,Código agrupador');
    assert.equal(lineas[1], 'Bancos,Activo,Deudora,');
    assert.ok(lineas.includes('Ingresos,Ingresos,Acreedora,401.01'));
    assert.ok(lineas.includes('Costo del servicio,Costos y gastos,Deudora,'));
    assert.equal(lineas.length, 24);
  });
});
