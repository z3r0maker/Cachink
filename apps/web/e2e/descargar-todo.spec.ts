import ExcelJS from 'exceljs';
import { strFromU8, unzipSync } from 'fflate';

import { expect, test } from './test';
import { addMember, mintTenant, signIn, type Tenant } from './tenant';
import { addProduct, addSale } from './tenant-rows';

/**
 * «Descargar todo» (`GET /api/export/todo`) on a tenant of its own: the file
 * is unzipped and read, so what is asserted is that this business's rows —
 * its id, a sale it made, the sale's centavos as an exact string — reached the
 * file, not that a response came back. And the whole business is the owner's
 * alone: a viewer of the same business is refused.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;
let lectura: Pick<Tenant, 'email' | 'password'>;
let venta: string;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Todo' });
  lectura = await addMember(t, { role: 'viewer' });
  const producto = await addProduct(t, { nombre: 'Torta de pierna', precio: 12_345 });
  venta = await addSale(t, {
    fecha: '2026-05-12',
    monto: 12_345,
    concepto: 'Torta de pierna',
    productoId: producto,
  });
});

interface Datos {
  readonly exportado: string;
  readonly negocio: { readonly id: string; readonly nombre: string };
  readonly tablas: Record<string, readonly Record<string, unknown>[]>;
}

/** Every cell value of the first sheet's data rows, flattened. */
async function celdas(bytes: Uint8Array): Promise<unknown[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
  const out: unknown[] = [];
  wb.worksheets[0]?.eachRow((row, n) => {
    if (n > 1) out.push(...(row.values as unknown[]));
  });
  return out;
}

test('the owner downloads the whole business: five workbooks and datos.json with its rows', async ({
  page,
}) => {
  await signIn(page, t);
  const res = await page.request.get('/api/export/todo');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('application/zip');
  expect(res.headers()['content-disposition']).toMatch(
    /^attachment; filename="xangarro-todo-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.zip"$/,
  );

  const zip = unzipSync(new Uint8Array(await res.body()));
  expect(Object.keys(zip).sort()).toEqual(
    [
      'datos.json',
      'empleados.xlsx',
      'gastos.xlsx',
      'movimientos.xlsx',
      'productos.xlsx',
      'ventas.xlsx',
    ].sort(),
  );

  const datos = JSON.parse(strFromU8(zip['datos.json'] as Uint8Array)) as Datos;
  expect(datos.negocio.id).toBe(t.biz);
  expect(datos.negocio.nombre).toBe(t.nombre);
  const sale = datos.tablas.sales?.find((r) => r.id === venta);
  expect(sale, 'the sale this tenant made is in the file').toBeDefined();
  expect(sale?.monto_centavos).toBe('12345');
  expect(sale?.business_id).toBe(t.biz);
  // Nobody else's rows: RLS scoped every table to this business.
  for (const filas of Object.values(datos.tablas)) {
    for (const fila of filas) expect(fila.business_id).toBe(t.biz);
  }

  // The workbook is the screens' own export, with the same sale in pesos.
  const ventas = await celdas(zip['ventas.xlsx'] as Uint8Array);
  expect(ventas).toContain('Torta de pierna');
  expect(ventas).toContain(123.45);
});

test('a viewer of the same business is refused the whole of it', async ({ page }) => {
  await signIn(page, lectura);
  const res = await page.request.get('/api/export/todo');
  expect(res.status()).toBe(403);
  expect(((await res.json()) as { error: string }).error).toMatch(/dueño/);
});
