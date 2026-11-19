import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type {
  ImporteResultados,
  PlantillaRecurrente,
  RecurrenteDelMes,
} from '../../src/corp/index.js';
import {
  gastadoPorCategoria,
  ingresoPromedio,
  promedioNoRecurrente,
  proyeccionPorCategoria,
  recurrentesPendientes,
  type Montos,
} from '../../src/corp/presupuesto/index.js';

const linea = (
  cuenta: ImporteResultados['cuenta'],
  importe: bigint,
  fecha: string,
  entryId = `e-${fecha}-${cuenta}`,
): ImporteResultados => ({ entryId, concepto: 'x', cuenta, importe, fecha, fechaFlujo: fecha });

const cero: Montos = {
  costo_servicio: 0n,
  ventas_marketing: 0n,
  desarrollo: 0n,
  administracion: 0n,
};

const plantilla = (over: Partial<PlantillaRecurrente> = {}): PlantillaRecurrente => ({
  id: 't1',
  nombre: 'Hosting',
  contraparte: null,
  rfc: null,
  categoria: 'costo_servicio',
  moneda: 'MXN',
  montoEstimado: 1_234_50n,
  diaCargo: 22,
  projectId: null,
  deducible: true,
  activo: true,
  desde: '2026-01',
  ...over,
});

const cargo = (
  estado: RecurrenteDelMes['estado'],
  over: Partial<PlantillaRecurrente> = {},
): RecurrenteDelMes => ({
  plantilla: plantilla(over),
  fecha: '2026-11-22',
  estado,
  entryId: estado === 'registrado' ? 'e-rec' : null,
  facturaDel: null,
});

describe('E-22 · lo gastado por categoría', () => {
  const importes = [
    linea('costo_servicio', 6_010_00n, '2026-11-03'),
    linea('ventas_marketing', 9_600_00n, '2026-11-10'),
    linea('ventas_marketing', -600_00n, '2026-11-12'),
    linea('financiero', 120_00n, '2026-11-05'),
    linea('ingresos', 20_000_00n, '2026-11-05'),
    linea('desarrollo', 1_870_00n, '2026-10-31'),
  ];

  it('sums each category in the range, reversals netted, bank fees and income left out', () => {
    assert.deepEqual(gastadoPorCategoria(importes, '2026-11-01', '2026-11-19'), {
      ...cero,
      costo_servicio: 6_010_00n,
      ventas_marketing: 9_000_00n,
    });
  });

  it('is zero with nothing captured', () => {
    assert.deepEqual(gastadoPorCategoria([], '2026-11-01', '2026-11-30'), cero);
  });
});

describe('E-22 · el ingreso promedio sin IVA', () => {
  it('averages the income of the months, dividing by all of them', () => {
    const importes = [
      linea('ingresos', 30_000_00n, '2026-08-10'),
      linea('ingresos', 16_800_00n, '2026-10-10'),
      linea('ingresos', 99_000_00n, '2026-11-10'),
      linea('costo_servicio', 5_000_00n, '2026-09-10'),
    ];
    assert.equal(ingresoPromedio(importes, ['2026-08', '2026-09', '2026-10']), 15_600_00n);
  });

  it('is zero with no months or no income', () => {
    assert.equal(ingresoPromedio([], ['2026-08']), 0n);
    assert.equal(ingresoPromedio([linea('ingresos', 1n, '2026-08-01')], []), 0n);
  });
});

describe('E-22 · la proyección', () => {
  it('adds the recurring peso charges still to come, by category', () => {
    const delMes = [
      cargo('proximo'),
      cargo('sugerido', { id: 't2', categoria: 'ventas_marketing', montoEstimado: 450_00n }),
      cargo('registrado', { id: 't3' }),
      cargo('proximo', { id: 't4', moneda: 'USD', montoEstimado: 20_00n }),
      cargo('proximo', { id: 't5', montoEstimado: 0n }),
    ];
    assert.deepEqual(recurrentesPendientes(delMes), {
      ...cero,
      costo_servicio: 1_234_50n,
      ventas_marketing: 450_00n,
    });
  });

  it('averages what was not a recurring charge over the months', () => {
    const importes = [
      linea('ventas_marketing', 3_000_00n, '2026-08-10'),
      linea('ventas_marketing', 1_234_50n, '2026-09-22', 'e-rec'),
      linea('ventas_marketing', 3_000_00n, '2026-10-10'),
      linea('ventas_marketing', 9_000_00n, '2026-11-10'),
    ];
    const promedio = promedioNoRecurrente(
      importes,
      ['2026-08', '2026-09', '2026-10'],
      new Set(['e-rec']),
    );
    assert.deepEqual(promedio, { ...cero, ventas_marketing: 2_000_00n });
  });

  it('sums spent, still to come, and each month ahead with its average', () => {
    const p = proyeccionPorCategoria({
      gastado: { ...cero, desarrollo: 1_000_00n },
      pendientes: { ...cero, desarrollo: 500_00n },
      futuros: [
        { ...cero, desarrollo: 200_00n },
        { ...cero, desarrollo: 200_00n },
      ],
      noRecurrente: { ...cero, desarrollo: 50_00n },
    });
    assert.deepEqual(p, { ...cero, desarrollo: 2_000_00n });
  });

  it('is what was spent when nothing is left of the period', () => {
    const gastado = { ...cero, administracion: 760_00n };
    assert.deepEqual(
      proyeccionPorCategoria({ gastado, pendientes: cero, futuros: [], noRecurrente: gastado }),
      gastado,
    );
  });
});
