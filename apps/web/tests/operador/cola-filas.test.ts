import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { PendienteCrudo } from '@xangarro/caja/lectura';

import { ordenar, reintentosDe } from '../../src/operador/runtime/cola-filas';
import { contarCola } from '../../src/operador/shell/cola-flusher';

describe('la cola por enviar, en orden de envío', () => {
  it('groups a ticket with its lines and the ledger into one entry each, in push order', () => {
    const tickets = new Map([
      ['sales:S1', 'T1'],
      ['sales:S2', 'T1'],
    ]);
    const { orden, ids } = ordenar(
      [
        { tabla: 'caja_turnos', id: 'C1' },
        { tabla: 'sales', id: 'S1' },
        { tabla: 'inventory_movements', id: 'M1' },
        { tabla: 'tickets', id: 'T1' },
        { tabla: 'sales', id: 'S2' },
        { tabla: 'inventory_movements', id: 'M2' },
        { tabla: 'expenses', id: 'G1' },
      ],
      tickets,
    );
    assert.deepEqual(
      orden.map((e) => `${e.tabla}:${e.id}`),
      ['caja_turnos:C1', 'tickets:T1', 'inventory_movements:inventario', 'expenses:G1'],
    );
    assert.deepEqual(ids.get('inventory_movements'), ['M1', 'M2']);
    assert.deepEqual([...new Set(ids.get('tickets'))], ['T1']);
  });
});

const venta: PendienteCrudo = {
  tipo: 'venta',
  id: 'T1',
  en: '2026-05-14T20:52:00.000Z',
  folio: 412,
  hora: '14:52',
  metodo: 'Efectivo',
  lineas: [{ concepto: 'pastor', cantidad: 3 }],
  totalCentavos: '16000',
  cancelada: false,
};

describe('registros por enviar · one count for the pill, the list and the cierre (DB3-CAJA-02)', () => {
  it('marks a sale as retrying when any of its rows is, and counts it once', () => {
    const tickets = new Map([
      ['sales:S1', 'T1'],
      ['sales:S2', 'T2'],
    ]);
    const entradas = [
      { tabla: 'sales', id: 'S1', reintento: true },
      { tabla: 'tickets', id: 'T1', reintento: false },
      { tabla: 'tickets', id: 'T2' },
      { tabla: 'sales', id: 'S2' },
      { tabla: 'gastos', id: 'G1', reintento: true },
    ];
    assert.deepEqual([...reintentosDe(entradas, tickets)].sort(), ['gastos:G1', 'tickets:T1']);
    assert.equal(ordenar(entradas, tickets).orden.length, 3, 'two sales and a gasto');
  });

  it('counts every unsent record, and apart the ones already retrying', () => {
    const gasto: PendienteCrudo = {
      tipo: 'gasto',
      id: 'G1',
      en: venta.en,
      concepto: 'Gas',
      montoCentavos: '100',
      proveedor: null,
    };
    assert.deepEqual(contarCola([venta, { ...gasto, reintento: true }, { ...venta, id: 'T2' }]), {
      pendientes: 3,
      reintentando: 1,
    });
    assert.deepEqual(contarCola([]), { pendientes: 0, reintentando: 0 });
  });
});
