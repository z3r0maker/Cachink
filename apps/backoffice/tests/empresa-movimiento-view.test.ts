import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { Movimiento } from '@xangarro/data-corp';
import { postMovement } from '@xangarro/domain/corp';

import { filaDe, mesesVecinos, parseFiltro, parseMes } from '../src/server/empresa/movimiento-view';

/** E-02's table: an entry in the board's words. */
const base: Movimiento = {
  id: 'e1',
  fecha: '2026-09-28',
  projectId: 'xangarro',
  kind: 'gasto',
  concepto: 'Vercel',
  contraparte: 'Vercel Inc.',
  moneda: 'USD',
  montoOriginal: 20_00n,
  tipoCambio: '18.42',
  deducible: true,
  source: 'manual',
  sourceRef: null,
  reversesEntryId: null,
  payload: { kind: 'comision_bancaria', monto: 0n },
  createdBy: 'f1',
  createdAt: '2026-09-28T10:00:00Z',
  reversedBy: null,
  lines: postMovement({
    kind: 'gasto',
    categoria: 'costo_servicio',
    subtotal: 368_40n,
    iva: 0n,
    tratamientoIva: 'exento',
    retencionIsr: 0n,
    retencionIva: 0n,
    pagado: true,
  }),
};

describe('filaDe', () => {
  it('shows a USD expense as a bank outflow with its original charge', () => {
    const f = filaDe(base);
    assert.equal(f.tipo, 'Gasto');
    assert.equal(f.categoria, 'Costo del servicio');
    assert.equal(f.monto, '−$368.40');
    assert.equal(f.entra, false);
    assert.equal(f.detalle, 'USD 20.00 · TC 18.42 · Vercel Inc.');
    assert.equal(f.estado, 'Registrado');
    assert.equal(f.filtro, 'gastos');
  });

  it('marks a reversed entry and its reversal', () => {
    assert.equal(filaDe({ ...base, reversedBy: 'e2' }).estado, 'Revertido');
    const reversa = filaDe({ ...base, id: 'e2', reversesEntryId: 'e1' });
    assert.equal(reversa.estado, 'Reversa');
    assert.equal(reversa.tipo, 'Reversa');
    assert.equal(reversa.filtro, null);
  });

  it('shows a partner contribution as money in, under its account', () => {
    const f = filaDe({
      ...base,
      kind: 'aportacion_capital',
      moneda: 'MXN',
      montoOriginal: null,
      lines: postMovement({ kind: 'aportacion_capital', socio: 1, monto: 10_000_00n }),
    });
    assert.equal(f.monto, '+$10,000.00');
    assert.equal(f.categoria, 'Capital social');
    assert.equal(f.filtro, 'socios');
  });
});

describe('the month and filter params', () => {
  it('falls back to the current month and to «Todos»', () => {
    assert.equal(parseMes(undefined, '2026-10-08'), '2026-10');
    assert.equal(parseMes('2026-13', '2026-10-08'), '2026-10');
    assert.equal(parseMes('2026-09', '2026-10-08'), '2026-09');
    assert.equal(parseFiltro('nada'), 'todos');
    assert.equal(parseFiltro('socios'), 'socios');
  });

  it('crosses the year at both ends', () => {
    assert.deepEqual(mesesVecinos('2026-01'), { anterior: '2025-12', siguiente: '2026-02' });
    assert.deepEqual(mesesVecinos('2026-12'), { anterior: '2026-11', siguiente: '2027-01' });
  });
});
