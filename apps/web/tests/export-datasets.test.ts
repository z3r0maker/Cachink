import assert from 'node:assert/strict';
import { beforeAll, beforeEach, describe, it, vi } from 'vitest';

import { loadExcelJs } from '../src/server/export/workbook';

/**
 * The per-screen exports (P-34). The E2E suite downloads one of them and
 * checks it is a workbook; what each dataset asks for, and how each column
 * turns a row into a cell — centavos into pesos, nulls into blanks — is here.
 */

const listMovimientos = vi.fn();
const listProductos = vi.fn();
const listMovimientosInventario = vi.fn();
const listEmpleados = vi.fn();

vi.mock('@xangarro/data-pg', () => ({
  listMovimientos,
  listProductos,
  listMovimientosInventario,
  listEmpleados,
}));
vi.mock('../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true }),
}));

const { buildExport, isDataset, DATASETS } = await import('../src/server/export/datasets');

async function rowsOf(bytes: ArrayBuffer): Promise<unknown[][]> {
  const ExcelJs = await loadExcelJs();
  const wb = new ExcelJs.Workbook();
  await wb.xlsx.load(bytes);
  const out: unknown[][] = [];
  wb.worksheets[0]?.eachRow((row) => {
    out.push((row.values as unknown[]).slice(1));
  });
  return out;
}

// ExcelJS is imported lazily and is large; loading it once here keeps that
// cost out of the first test's 5-second budget on a busy machine.
beforeAll(async () => {
  await loadExcelJs();
});

beforeEach(() => {
  vi.clearAllMocks();
  for (const m of [listMovimientos, listProductos, listMovimientosInventario, listEmpleados]) {
    m.mockResolvedValue([]);
  }
});

describe('isDataset — the name arrives in a URL', () => {
  it('accepts exactly the five datasets and nothing else', () => {
    assert.deepEqual(DATASETS.filter(isDataset), [...DATASETS]);
    for (const bad of ['', 'Ventas', 'usuarios', 'ventas;drop', '__proto__']) {
      assert.equal(isDataset(bad), false, bad);
    }
  });
});

describe('buildExport', () => {
  it('ventas and gastos read their own kind of movimiento, as pesos', async () => {
    listMovimientos.mockResolvedValue([
      {
        fecha: '2026-05-12',
        concepto: 'Venta mostrador',
        clasificacion: 'Efectivo',
        amount: 12_345n,
        cancelada: false,
      },
      { fecha: null, concepto: undefined, clasificacion: null, amount: null, cancelada: true },
    ]);
    const built = await buildExport('ventas', 'biz-1');
    assert.match(built.filename, /^xangarro-ventas-\d{4}-\d{2}-\d{2}\.xlsx$/);
    assert.deepEqual(listMovimientos.mock.calls[0]?.slice(1), ['venta']);
    const [head, first, second] = await rowsOf(built.bytes);
    assert.deepEqual(head, ['Fecha', 'Concepto', 'Clasificación', 'Monto', 'Cancelada']);
    assert.deepEqual(first, ['2026-05-12', 'Venta mostrador', 'Efectivo', 123.45, 'No']);
    assert.equal(second?.at(-1), 'Sí');

    await buildExport('gastos', 'biz-1');
    assert.deepEqual(listMovimientos.mock.calls[1]?.slice(1), ['gasto']);
  });

  it('productos: cost and price in pesos, stock as a number', async () => {
    listProductos.mockResolvedValue([
      {
        nombre: 'Taco de pastor',
        sku: 'TAC-001',
        categoria: 'Tacos',
        costo: 1_250n,
        precio: 2_500n,
        stock: 140,
      },
      { nombre: 'Sin datos', sku: null, categoria: null, costo: null, precio: null, stock: null },
    ]);
    const [head, first, second] = await rowsOf((await buildExport('productos', 'biz-1')).bytes);
    assert.deepEqual(head, ['Producto', 'SKU', 'Categoría', 'Costo', 'Precio', 'Existencias']);
    assert.deepEqual(first, ['Taco de pastor', 'TAC-001', 'Tacos', 12.5, 25, 140]);
    assert.equal(second?.at(-1), 0);
  });

  it('movimientos are the inventory movements', async () => {
    listMovimientosInventario.mockResolvedValue([
      {
        fecha: '2026-05-10',
        producto: 'Tortilla',
        tipo: 'entrada',
        cantidad: 40,
        motivo: 'Compra',
      },
      { fecha: '2026-05-11', producto: 'Tortilla', tipo: 'salida', cantidad: null, motivo: null },
    ]);
    const [head, first, second] = await rowsOf((await buildExport('movimientos', 'biz-1')).bytes);
    assert.deepEqual(head, ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Motivo']);
    assert.deepEqual(first, ['2026-05-10', 'Tortilla', 'entrada', 40, 'Compra']);
    assert.equal(second?.[3], 0);
  });

  it('empleados: salary in pesos, and the sheet is named for the dataset', async () => {
    listEmpleados.mockResolvedValue([
      { nombre: 'Lupita', puesto: 'Cajera', salarioCentavos: 180_000n, periodo: 'semanal' },
    ]);
    const built = await buildExport('empleados', 'biz-1');
    const [head, first] = await rowsOf(built.bytes);
    assert.deepEqual(head, ['Nombre', 'Puesto', 'Salario', 'Periodo']);
    assert.deepEqual(first, ['Lupita', 'Cajera', 1_800, 'semanal']);
    const ExcelJs = await loadExcelJs();
    const wb = new ExcelJs.Workbook();
    await wb.xlsx.load(built.bytes);
    assert.equal(wb.worksheets[0]?.name, 'Empleados');
  });
});
