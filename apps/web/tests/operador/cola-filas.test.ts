import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { ordenar } from '../../src/operador/runtime/cola-filas';

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
