import assert from 'node:assert/strict';
import { beforeAll, beforeEach, describe, it, vi } from 'vitest';

import { loadExcelJs } from '../src/server/export/workbook';

/**
 * The per-screen exports (P-34). The E2E suite downloads one of them and
 * checks it is a workbook; what each dataset asks for, and how each column
 * turns a row into a cell — centavos into pesos, nulls into blanks — is here.
 */

const exportarVentas = vi.fn();
const exportarGastos = vi.fn();
const listProductos = vi.fn();
const exportarMovimientosInventario = vi.fn();
const listEmpleados = vi.fn();

/** A batched export, as the data-pg generators yield it: two batches. */
async function* lotes(rows: readonly unknown[]) {
  yield rows.slice(0, 1);
  yield rows.slice(1);
}

vi.mock('@xangarro/data-pg', () => ({
  exportarVentas,
  exportarGastos,
  listProductos,
  exportarMovimientosInventario,
  listEmpleados,
}));
const withExportTenant = vi.fn((_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true }));
vi.mock('../src/server/db', () => ({ withExportTenant }));

const { buildExport, isDataset, DATASETS } = await import('../src/server/export/datasets');

/** The streamed body, drained — what the browser saves. */
async function bytesOf(body: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
  const buf = Buffer.from(await new Response(body).arrayBuffer());
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

async function workbookOf(body: ReadableStream<Uint8Array>) {
  const ExcelJs = await loadExcelJs();
  const wb = new ExcelJs.Workbook();
  await wb.xlsx.load(await bytesOf(body));
  return wb;
}

async function rowsOf(body: ReadableStream<Uint8Array>, sheet = 0): Promise<unknown[][]> {
  const wb = await workbookOf(body);
  const out: unknown[][] = [];
  wb.worksheets[sheet]?.eachRow((row) => {
    out.push((row.values as unknown[]).slice(1));
  });
  return out;
}

// ExcelJS is imported lazily and is large; loading it once here keeps that
// cost out of the first test's 5-second budget on a busy machine. The hook's
// own budget is generous: on a machine at load 30 the cold import alone took 10s.
beforeAll(async () => {
  await loadExcelJs();
}, 30_000);

beforeEach(() => {
  vi.clearAllMocks();
  for (const m of [listProductos, listEmpleados]) m.mockResolvedValue([]);
  for (const m of [exportarVentas, exportarGastos, exportarMovimientosInventario]) {
    m.mockImplementation(() => lotes([]));
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
  it('ventas and gastos read their own kind of movimiento, every batch, as pesos', async () => {
    exportarVentas.mockImplementation(() =>
      lotes([
        {
          fecha: '2026-05-12',
          concepto: 'Venta mostrador',
          clasificacion: 'Efectivo',
          amount: 12_345n,
          cancelada: false,
        },
        { fecha: null, concepto: undefined, clasificacion: null, amount: null, cancelada: true },
      ]),
    );
    const built = await buildExport('ventas', 'biz-1');
    assert.match(built.filename, /^xangarro-ventas-\d{4}-\d{2}-\d{2}\.xlsx$/);
    assert.equal(exportarVentas.mock.calls.length, 1);
    const [head, first, second] = await rowsOf(built.body);
    assert.deepEqual(head, ['Fecha', 'Concepto', 'Clasificación', 'Monto', 'Cancelada']);
    assert.deepEqual(first, ['2026-05-12', 'Venta mostrador', 'Efectivo', 123.45, 'No']);
    assert.equal(second?.at(-1), 'Sí');

    await bytesOf((await buildExport('gastos', 'biz-1')).body);
    assert.equal(exportarGastos.mock.calls.length, 1);
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
    const [head, first, second] = await rowsOf((await buildExport('productos', 'biz-1')).body);
    assert.deepEqual(head, ['Producto', 'SKU', 'Categoría', 'Costo', 'Precio', 'Existencias']);
    assert.deepEqual(first, ['Taco de pastor', 'TAC-001', 'Tacos', 12.5, 25, 140]);
    assert.equal(second?.at(-1), 0);
  });

  it('movimientos are the inventory movements, every batch of them', async () => {
    exportarMovimientosInventario.mockImplementation(() =>
      lotes([
        {
          fecha: '2026-05-10',
          producto: 'Tortilla',
          tipo: 'entrada',
          cantidad: 40,
          motivo: 'Compra',
        },
        { fecha: '2026-05-11', producto: 'Tortilla', tipo: 'salida', cantidad: null, motivo: null },
      ]),
    );
    const [head, first, second] = await rowsOf((await buildExport('movimientos', 'biz-1')).body);
    assert.deepEqual(head, ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Motivo']);
    assert.deepEqual(first, ['2026-05-10', 'Tortilla', 'entrada', 40, 'Compra']);
    assert.equal(second?.[3], 0);
  });

  it('empleados: salary in pesos, and the sheet is named for the dataset', async () => {
    listEmpleados.mockResolvedValue([
      { nombre: 'Lupita', puesto: 'Cajera', salarioCentavos: 180_000n, periodo: 'semanal' },
    ]);
    const wb = await workbookOf((await buildExport('empleados', 'biz-1')).body);
    const rows: unknown[][] = [];
    wb.worksheets[0]?.eachRow((row) => rows.push((row.values as unknown[]).slice(1)));
    assert.deepEqual(rows[0], ['Nombre', 'Puesto', 'Salario', 'Periodo']);
    assert.deepEqual(rows[1], ['Lupita', 'Cajera', 1_800, 'semanal']);
    assert.equal(wb.worksheets[0]?.name, 'Empleados');
  });
});

describe('the streamed workbook (DB3-EXP-01)', () => {
  const fila = (i: number) => ({
    fecha: `2026-05-${String(1 + (i % 28)).padStart(2, '0')}`,
    concepto: `Venta ${i}`,
    clasificacion: 'Efectivo',
    amount: BigInt(100 * i),
    cancelada: false,
  });

  it('past the per-sheet limit, carries on in a new sheet with its own header', async () => {
    exportarVentas.mockImplementation(async function* () {
      yield [fila(1), fila(2), fila(3)];
      yield [fila(4), fila(5)];
    });
    const wb = await workbookOf((await buildExport('ventas', 'biz-1', { maxRows: 2 })).body);
    assert.deepEqual(
      wb.worksheets.map((w) => w.name),
      ['Ventas', 'Ventas (2)', 'Ventas (3)'],
    );
    assert.deepEqual(
      wb.worksheets.map((w) => w.rowCount - 1),
      [2, 2, 1],
      'every data row once',
    );
    for (const w of wb.worksheets) assert.equal(w.getRow(1).getCell(1).value, 'Fecha');
    assert.equal(wb.worksheets[2]?.getRow(2).getCell(2).value, 'Venta 5');
  });

  it('writes thousands of rows across many batches into one valid file', async () => {
    exportarVentas.mockImplementation(async function* () {
      for (let b = 0; b < 4; b += 1)
        yield Array.from({ length: 2_500 }, (_, i) => fila(b * 2_500 + i));
    });
    const wb = await workbookOf((await buildExport('ventas', 'biz-1')).body);
    assert.equal(wb.worksheets.length, 1);
    assert.equal(wb.worksheets[0]?.rowCount, 10_001);
  });

  it('an empty history is a header-only sheet, not an error', async () => {
    const rows = await rowsOf((await buildExport('gastos', 'biz-1')).body);
    assert.deepEqual(rows, [['Fecha', 'Concepto', 'Clasificación', 'Monto', 'Cancelada']]);
  });

  it('a failure on the first read fails the request, before any byte is sent', async () => {
    exportarVentas.mockImplementation(async function* () {
      yield* [];
      throw new Error('database down');
    });
    await assert.rejects(buildExport('ventas', 'biz-1'), /database down/);
  });

  it('a failure after the first batch aborts the download instead of saving half a file', async () => {
    exportarVentas.mockImplementation(async function* () {
      yield [fila(1)];
      throw new Error('connection lost');
    });
    const { body } = await buildExport('ventas', 'biz-1');
    await assert.rejects(bytesOf(body));
  });

  it('reads catalogues through the export pool', async () => {
    listProductos.mockResolvedValue([]);
    await bytesOf((await buildExport('productos', 'biz-9')).body);
    assert.equal(withExportTenant.mock.calls[0]?.[0], 'biz-9');
  });
});
