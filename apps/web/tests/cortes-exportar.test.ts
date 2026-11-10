// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * «Exportar mes» (Cortes): the month's turnos as a CSV in pesos, assembled on
 * this device. What needs pinning is the assembly — the header, the quoting of
 * a name that carries Excel's own separators, the minus only a shortfall earns,
 * and the empty cell for a motivo nobody wrote — not the arithmetic, which is
 * the domain's and recomputed here for the same corte.
 */

const { exportarCortes } = await import('../src/app/(portal)/cortes/exportar');
const { contado, diferencia, esperado } = await import('../src/app/(portal)/cortes/derive');
const { toPesosString } = await import('@xangarro/domain');

const creados: Blob[] = [];
const revocadas: string[] = [];
const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');

beforeEach(() => {
  creados.length = 0;
  revocadas.length = 0;
  click.mockClear();
  URL.createObjectURL = (b: Blob): string => {
    creados.push(b);
    return 'blob:cortes';
  };
  URL.revokeObjectURL = (u: string) => revocadas.push(u);
});

afterEach(() => {
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

/** A quote-aware split: a quoted cell may carry the comma that separates the rest. */
function celdas(fila: string): string[] {
  const out: string[] = [];
  let cur = '';
  let enComillas = false;
  for (const ch of fila) {
    if (ch === '"') {
      enComillas = !enComillas;
      cur += ch;
    } else if (ch === ',' && !enComillas) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

import type { Corte } from '../src/app/(portal)/cortes/types';

function corte(over: Partial<Corte> = {}): Corte {
  return {
    id: 't-1',
    operador: 'Ana Robledo',
    iniciales: 'AR',
    tint: '#f5c518',
    caja: 'Caja 1',
    dia: '12 may',
    horario: '14:00 a 20:30',
    fondo: 100_00n,
    ventasEfectivo: 100_00n,
    abonosEfectivo: 0n,
    gastosCaja: 0n,
    conteo: { 'billete-100': 2 },
    estado: 'Cuadró',
    turno: {
      ventas: 3,
      canceladas: { n: 0, monto: 0n },
      fiado: 0n,
      inventario: '0 entradas · 0 mermas',
      creados: 0,
    },
    ...over,
  } as Corte;
}

describe('exportarCortes', () => {
  it('builds the month’s CSV: header, pesos, and the minus only a shortfall earns', async () => {
    const justa = corte(); // contado 200_00 = esperado 200_00
    const faltante = corte({
      // counted 100_00 against the same esperado: a falta, with motivo y nota
      operador: 'López "El Chief", Ana',
      conteo: { 'billete-100': 1 },
      motivo: 'Faltó cambio',
      nota: 'Revisar entrega',
      estado: 'Por aclarar',
    });
    const estado = (c: Corte) => c.estado;
    exportarCortes([justa, faltante], estado);

    assert.equal(click.mock.calls.length, 1);
    const [blob] = creados;
    assert.equal(blob?.type, 'text/csv;charset=utf-8');
    const csv = await (blob as Blob).text();
    const lineas = csv.split('\n');
    assert.equal(
      lineas[0],
      'Operador,Caja,Día,Horario,Esperado,Contado,Diferencia,Estado,Motivo,Nota',
    );
    const justaCeldas = celdas(lineas[1] ?? '');
    const faltanteCeldas = celdas(lineas[2] ?? '');
    // A name carrying a comma and quotes is quoted, doubled inside.
    assert.equal(faltanteCeldas[0], '"López ""El Chief"", Ana"');
    assert.equal(justaCeldas[4], toPesosString(esperado(justa)));
    assert.equal(justaCeldas[5], toPesosString(contado(justa)));
    assert.equal(justaCeldas[6], toPesosString(diferencia(justa).monto));
    // The shortfall alone carries the minus; a corte that cuadra does not.
    assert.equal(faltanteCeldas[6], `-${toPesosString(diferencia(faltante).monto)}`);
    // A motivo nobody wrote is an empty cell, not «undefined».
    assert.equal(justaCeldas[8], '');
    assert.equal(faltanteCeldas[8], 'Faltó cambio');
    assert.equal(faltanteCeldas[9], 'Revisar entrega');
    assert.deepEqual(revocadas, ['blob:cortes']);
  });

  it('writes what an operator typed as text, never as a formula (audit F-15a)', async () => {
    const hostil = corte({
      operador: '=HYPERLINK("http://evil.example","Ana")',
      caja: '+52 55 0000',
      conteo: { 'billete-100': 1 },
      motivo: '-2+3',
      nota: '@SUM(E2:E9)',
      estado: 'Por aclarar',
    });
    exportarCortes([hostil], (c) => c.estado);
    const csv = await (creados[0] as Blob).text();
    const celdasHostil = celdas(csv.split('\n')[1] ?? '');

    // Each free-text cell opens on a quote mark, which a spreadsheet reads as «text follows».
    assert.equal(celdasHostil[0], `"'=HYPERLINK(""http://evil.example"",""Ana"")"`);
    assert.equal(celdasHostil[1], `'+52 55 0000`);
    assert.equal(celdasHostil[8], `'-2+3`);
    assert.equal(celdasHostil[9], `'@SUM(E2:E9)`);
    // The amounts are the app's own and stay numbers, the shortfall's minus included.
    assert.equal(celdasHostil[4], toPesosString(esperado(hostil)));
    assert.equal(celdasHostil[5], toPesosString(contado(hostil)));
    assert.equal(celdasHostil[6], `-${toPesosString(diferencia(hostil).monto)}`);
    assert.match(celdasHostil[6] ?? '', /^-\d+\.\d{2}$/);
  });
});
