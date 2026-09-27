import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { CuentaCliente } from '../src/cobranza/cliente/types';
import { saludo } from '../src/inicio/copy';
import { INICIO_FIXTURE } from '../src/inicio/fixture';
import {
  alternar,
  MAX_TAREAS,
  porReponer,
  tareaStock,
  tareasParaHoy,
} from '../src/inicio/para-hoy';
import { momentoDe } from '../src/inicio/vivo';
import { montoCrudo } from '../src/gastos/derive';
import type { RecurrentePara } from '../src/lectura/turno-shapes';
import { vigentes } from '../src/comun/hoy-no';

const HOY = '2026-05-14';

const gasto = (id: string, concepto: string, vence: number): RecurrentePara => ({
  id,
  concepto,
  frecuencia: 'semanal',
  diaDelMes: null,
  proveedor: null,
  montoCentavos: '62000',
  vence,
});

/** An account as Fiado y abonos reads it; `atrasado` is its rule's verdict. */
const cuenta = (
  id: string,
  nombre: string,
  dia: string,
  monto: bigint,
  atrasado: boolean,
): CuentaCliente => ({
  id,
  nombre,
  iniciales: '',
  telefono: '',
  tint: '',
  desde: 'enero 2026',
  limite: 0n,
  plazo: '15 días',
  atrasado,
  ventas: [
    { folio: 'V-0001', concepto: 'Tacos', fecha: '2026-04-20T10:00', dia, monto, capturo: 'Ana' },
  ],
  abonos: [],
});

describe('«Para hoy»', () => {
  it('lists a product at or below its threshold, as Inventario does', () => {
    assert.equal(porReponer({ id: 'p', nombre: 'Agua', existencias: 3, umbral: 3 }), true);
    assert.equal(porReponer({ id: 'p', nombre: 'Agua', existencias: 4, umbral: 3 }), false);
    assert.deepEqual(
      tareaStock({ id: 'P1', nombre: 'Taco de tripa', existencias: -2, umbral: 15 }),
      {
        id: 'stock:P1',
        tipo: 'reponer',
        titulo: 'Reponer Taco de tripa',
        detalle: 'Quedan 0 · el umbral es 15',
        href: '/operador/inventario?reponer=P1',
      },
    );
  });

  it('takes the kinds in turns, each most urgent first', () => {
    const tareas = tareasParaHoy(
      [gasto('g1', 'Luz', 0), gasto('g2', 'Gas de la semana', -3)],
      [
        { id: 'a', nombre: 'Agua', existencias: 5, umbral: 10 },
        { id: 'b', nombre: 'Bolillo', existencias: 0, umbral: 10 },
        { id: 'c', nombre: 'Cebolla', existencias: 50, umbral: 10 },
      ],
      [
        cuenta('c1', 'Doña Mari', '20 abr', 30_000n, true),
        cuenta('c2', 'Taller de Chuy', '28 abr', 86_000n, true),
        // Within its plazo: «Al día», not listed.
        cuenta('c3', 'Don Beto', 'hoy', 5_000n, false),
      ],
    );
    assert.deepEqual(
      tareas.map((t) => t.id),
      ['g2', 'stock:b', 'fiado:c2', 'g1', 'stock:a', 'fiado:c1'],
    );
    assert.equal(tareas[0]?.titulo, 'Registrar gas de la semana');
    assert.equal(tareas[0]?.href, '/operador/gastos?recurrente=g2');
    assert.equal(tareas[2]?.titulo, 'Cobrar a Taller de Chuy');
    assert.equal(tareas[2]?.detalle, 'Debe $860.00 · la venta más antigua es del 28 abr');
    assert.equal(tareas[2]?.href, '/operador/cobranza/c2');
    assert.equal(MAX_TAREAS, 4);
  });

  it('is empty when nothing is due, low or overdue', () => {
    assert.deepEqual(
      tareasParaHoy([], [{ id: 'a', nombre: 'A', existencias: 9, umbral: 1 }], []),
      [],
    );
    assert.deepEqual(alternar([[1, 2, 3], [], [9]]), [1, 9, 2, 3]);
  });
});

describe('the greeting and the rest', () => {
  it('follows the local hour: días before 12, tardes until 18:59, noches from 19', () => {
    assert.equal(momentoDe(0), 'dia');
    assert.equal(momentoDe(11), 'dia');
    assert.equal(momentoDe(12), 'tarde');
    assert.equal(momentoDe(18), 'tarde');
    assert.equal(momentoDe(19), 'noche');
    assert.equal(momentoDe(23), 'noche');
    const d = { ...INICIO_FIXTURE, situacion: 'vendiendo' as const };
    assert.equal(saludo({ ...d, momento: 'dia' }), '¡Buenos días, Ana! La caja está lista.');
    assert.equal(saludo({ ...d, momento: 'noche' }), '¡Buenas noches, Ana! La caja está lista.');
    // The design's fixture keeps its wording.
    assert.equal(saludo(d), '¡Buenas tardes, Ana! La caja está lista.');
    assert.equal(saludo({ ...d, situacion: 'turno-cerrado' }), '¡Buen día, Ana!');
    assert.equal(
      saludo({ ...d, situacion: 'turno-cerrado', momento: 'noche' }),
      '¡Buenas noches, Ana!',
    );
  });

  it('«Hoy no» lasts today only, and the drawer fills the amount', () => {
    const raw = JSON.stringify({ fecha: HOY, ids: ['g1', 7, 'stock:b'] });
    assert.deepEqual(vigentes(raw, HOY), ['g1', 'stock:b']);
    assert.deepEqual(vigentes(raw, '2026-05-15'), []);
    assert.deepEqual(vigentes('{roto', HOY), []);
    assert.deepEqual(vigentes(null, HOY), []);
    assert.equal(montoCrudo(62_000n), '620.00');
    assert.equal(montoCrudo(1_505n), '15.05');
  });
});
