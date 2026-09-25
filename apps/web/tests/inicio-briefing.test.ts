import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  briefing,
  listaNombres,
  pendientes,
  type MesTotals,
} from '../src/app/(portal)/_inicio/briefing';
import type { ChecklistItem } from '../src/onboarding/checklist';

const mes = (ventas: bigint, gastos: bigint, n = 1): MesTotals => ({
  ventas,
  gastos,
  utilidad: ventas - gastos,
  ventasCount: n,
  gastosCount: n,
});

describe('Hoy · what Don Cuentas says', () => {
  it('names the loss and sends the owner to the statement', () => {
    const b = briefing(mes(883_500n, 1_573_000n));
    assert.match(b.line, /llevas \$8,835\.00 en ventas, pero los gastos ya van en \$15,730\.00/);
    assert.equal(b.cta.href, '/estados');
  });

  it('says what is left when the month is in the black', () => {
    assert.match(briefing(mes(500_000n, 200_000n)).line, /te quedan \$3,000\.00/);
  });

  it('waits for the first sale instead of reporting zeros', () => {
    const b = briefing(mes(0n, 0n, 0));
    assert.match(b.line, /todavía no llegan movimientos/);
    assert.equal(b.cta.href, '/como-empiezo');
  });
});

describe('Hoy · the pending list', () => {
  const item = (key: string, done: boolean): ChecklistItem =>
    ({
      key,
      group: 'opcional',
      title: `Paso ${key}`,
      hint: 'h',
      href: null,
      done,
    }) as ChecklistItem;

  it('orders stock, sync, review, then at most two open steps', () => {
    const list = pendientes({
      lowStock: [{ producto: 'Gringa' }],
      pendingRows: 2,
      revision: 3,
      checklist: [item('a', false), item('b', true), item('c', false), item('d', false)],
    });
    assert.deepEqual(
      list.map((p) => p.key),
      ['stock', 'sync', 'revision', 'a', 'c'],
    );
    assert.equal(list[0]?.title, '1 producto se está acabando');
    assert.equal(list[3]?.href, '/como-empiezo');
  });

  it('is empty when nothing is pending', () => {
    assert.deepEqual(pendientes({ lowStock: [], pendingRows: 0, revision: 0, checklist: [] }), []);
  });

  it('lists names the way people say them', () => {
    assert.equal(listaNombres(['A']), 'A');
    assert.equal(listaNombres(['A', 'B', 'C']), 'A, B y C');
    assert.equal(listaNombres(['A', 'B', 'C', 'D', 'E', 'F']), 'A, B, C, D y 2 más');
  });
});
