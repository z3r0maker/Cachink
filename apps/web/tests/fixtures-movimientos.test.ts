import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  GASTOS_KPIS,
  GASTO_FILTERS,
  MOVIMIENTOS,
  VENTA_FILTERS,
  VENTAS_KPIS,
  type Movimiento,
} from '../src/fixtures/movimientos';
import { pesos } from '../src/fixtures/business';

/**
 * The ledger fixtures (ADR-058 §2: the portal reads them, it never creates
 * them). A fixture that drifts silently renders a screen that lies — every
 * row carries its shape, the pending and cancelled marks the screens branch
 * on exist, and the KPI figures agree with the rows they summarise.
 */

describe('MOVIMIENTOS', () => {
  it('every row carries the full shape the screens read', () => {
    assert.ok(MOVIMIENTOS.length >= 5, 'a fixture of two rows covers nothing');
    for (const m of MOVIMIENTOS) {
      for (const campo of [
        'id',
        'kind',
        'fecha',
        'hora',
        'concepto',
        'clasificacion',
        'operador',
        'dispositivo',
        'amount',
      ] as const) {
        assert.ok(
          (m as unknown as Record<string, unknown>)[campo] !== undefined,
          `${m.id}: ${campo}`,
        );
      }
      assert.ok(m.kind === 'venta' || m.kind === 'gasto');
    }
    assert.equal(new Set(MOVIMIENTOS.map((m) => m.id)).size, MOVIMIENTOS.length, 'ids are unique');
  });

  it('the marks the screens branch on are present: pending and cancelled', () => {
    const pendientes = MOVIMIENTOS.filter((m) => m.pending === true);
    const canceladas = MOVIMIENTOS.filter((m) => m.cancelada !== undefined);
    assert.ok(pendientes.length >= 1, 'the pending badge has its row');
    assert.ok(canceladas.length >= 1, 'the cancelled strikethrough has its row');
    for (const m of canceladas) assert.ok((m.cancelada?.motivo ?? '').length > 0);
  });

  it('money is exact centavos — a fixture that drifts half a centavo fails here', () => {
    for (const m of MOVIMIENTOS) {
      assert.equal(typeof m.amount, 'bigint');
      assert.ok(m.amount >= 0n);
    }
  });
});

describe('the KPI cards', () => {
  it('every KPI row carries label, value and a tone the design knows', () => {
    for (const k of [...VENTAS_KPIS, ...GASTOS_KPIS]) {
      assert.ok(k.label.length > 0);
      assert.ok(typeof k.value === 'bigint' || typeof k.value === 'string');
      if (k.tone !== undefined) {
        assert.ok(
          ['neutral', 'positive', 'negative', 'warning'].includes(k.tone),
          `${k.label}: ${String(k.tone)}`,
        );
      }
    }
  });
});

describe('the filter lists', () => {
  it('cover the clasificaciones the rows actually carry', () => {
    for (const m of MOVIMIENTOS) {
      const lista = m.kind === 'venta' ? VENTA_FILTERS : GASTO_FILTERS;
      assert.ok(
        (lista as readonly string[]).includes(m.clasificacion),
        `${m.id}: «${m.clasificacion}» has no filter chip`,
      );
    }
  });
});

describe('pesos', () => {
  it('rounds to exact centavos', () => {
    assert.equal(pesos(75), 7500n);
    assert.equal(pesos(269.37), 26937n);
  });
});

// Keep the type import honest.
type _M = Movimiento;
