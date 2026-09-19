import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  calcularInsights,
  filtrarPorCadencia,
  mesAnterior,
  type EntradaInsight,
  type InsightRows,
} from '../../src/asesor/index.js';
import type { GastoInsight, VentaInsight } from '../../src/asesor/index.js';

const venta = (fecha: string, monto: bigint): VentaInsight => ({ fecha, monto });
const gasto = (
  fecha: string,
  concepto: string,
  monto: bigint,
  categoria = 'Servicios',
): GastoInsight => ({ id: `${concepto}-${fecha}`, fecha, concepto, monto, categoria });
const entrada = (productoId: string, fecha: string, costo: bigint): EntradaInsight => ({
  productoId,
  fecha,
  costoUnitCentavos: costo,
});

const base: InsightRows = {
  hoy: '2026-05-12',
  ventas: [],
  egresos: [],
  entradas: [],
  productos: [{ id: 'queso', nombre: 'Queso Oaxaca' }],
  stock: [],
  ultimoMovimiento: [],
};

describe('calcularInsights', () => {
  it('flags a cost rise of 10% or more, with the rise in the urgencia', () => {
    const rows: InsightRows = {
      ...base,
      entradas: [entrada('queso', '2026-03-01', 2000n), entrada('queso', '2026-05-01', 2500n)],
    };
    const [insight] = calcularInsights(rows);
    assert.equal(insight?.kind, 'costo-subio');
    assert.match(insight?.title ?? '', /25%/);
    assert.equal(insight?.clave, 'costo-subio:queso:2026-05');
  });

  it('a cost rise below the threshold says nothing', () => {
    const rows: InsightRows = {
      ...base,
      entradas: [entrada('queso', '2026-03-01', 2000n), entrada('queso', '2026-05-01', 2100n)],
    };
    assert.deepEqual(calcularInsights(rows), []);
  });

  it('flags a month concentrated in one quincena, on the last complete month only', () => {
    const rows: InsightRows = {
      ...base,
      ventas: [venta('2026-04-02', 90_000n), venta('2026-04-28', 10_000n)],
    };
    const [insight] = calcularInsights(rows);
    assert.equal(insight?.kind, 'quincena');
    assert.equal(insight?.clave, 'quincena:2026-04');
    assert.match(insight?.body ?? '', /90%/);
  });

  it('flags a category 30% above its three-month average', () => {
    const rows: InsightRows = {
      ...base,
      egresos: [
        gasto('2026-02-01', 'Luz', 10_000n),
        gasto('2026-03-01', 'Luz', 10_000n),
        gasto('2026-04-01', 'Luz', 10_000n),
        gasto('2026-05-02', 'Luz', 20_000n),
      ],
    };
    const [insight] = calcularInsights(rows);
    assert.equal(insight?.kind, 'gasto-fuera');
    assert.equal(insight?.severity, 'warning');
  });

  it('needs three baseline months before saying anything about gastos', () => {
    const rows: InsightRows = {
      ...base,
      egresos: [gasto('2026-04-01', 'Luz', 10_000n), gasto('2026-05-02', 'Luz', 20_000n)],
    };
    assert.deepEqual(calcularInsights(rows), []);
  });

  it('flags stock still on the shelf after 45 days without movement', () => {
    const rows: InsightRows = {
      ...base,
      stock: [{ productoId: 'queso', cantidad: 4 }],
      ultimoMovimiento: [{ productoId: 'queso', fecha: '2026-03-20' }],
    };
    const [insight] = calcularInsights(rows);
    assert.equal(insight?.kind, 'inventario-quieto');
    assert.match(insight?.title ?? '', /Queso Oaxaca/);
  });

  it('flags the same concepto and monto twice within 72 hours', () => {
    const rows: InsightRows = {
      ...base,
      egresos: [gasto('2026-05-10', 'Gas', 5000n), gasto('2026-05-11', 'Gas', 5000n)],
    };
    const [insight] = calcularInsights(rows);
    assert.equal(insight?.kind, 'gasto-duplicado');
    assert.equal(insight?.severity, 'critical');
  });

  it('the same monto days apart is not a duplicate', () => {
    const rows: InsightRows = {
      ...base,
      egresos: [gasto('2026-05-01', 'Gas', 5000n), gasto('2026-05-10', 'Gas', 5000n)],
    };
    assert.deepEqual(calcularInsights(rows), []);
  });
});

describe('filtrarPorCadencia', () => {
  const rows: InsightRows = {
    ...base,
    egresos: [gasto('2026-05-10', 'Gas', 5000n), gasto('2026-05-11', 'Gas', 5000n)],
    entradas: [entrada('queso', '2026-03-01', 2000n), entrada('queso', '2026-05-01', 2500n)],
    ventas: [venta('2026-04-02', 90_000n)],
  };
  const insights = calcularInsights(rows);

  it('semanal keeps the two most urgent, ranked by urgencia', () => {
    const semanal = filtrarPorCadencia(insights, 'semanal');
    assert.equal(semanal.length, 2);
    assert.ok(semanal[0]!.urgencia >= semanal[1]!.urgencia);
    // A 25% cost rise (30 + 25) outranks a $50 duplicate (50): the ranking
    // weighs money at stake, not the kind label alone.
    assert.equal(semanal[0]!.kind, 'costo-subio');
    assert.equal(semanal[1]!.kind, 'gasto-duplicado');
  });

  it('diario and completo keep everything', () => {
    assert.equal(filtrarPorCadencia(insights, 'diario').length, insights.length);
    assert.equal(filtrarPorCadencia(insights, 'completo').length, insights.length);
  });
});

describe('mesAnterior', () => {
  it('crosses the year boundary', () => {
    assert.equal(mesAnterior('2026-01-15', 1), '2025-12');
    assert.equal(mesAnterior('2026-05-12', 3), '2026-02');
  });
});
