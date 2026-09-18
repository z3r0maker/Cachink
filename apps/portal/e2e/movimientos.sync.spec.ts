import { expect, test } from '@playwright/test';
import { newUlid } from '@xangarro/domain';

import { activatePhone, asTenant, BIZ, pull, push, TACO, type Phone } from './sync-phone';

/**
 * Inventory movements reach every phone (ADR-081): phones compute stock by
 * summing movements, so one recorded in the portal, or on another phone, has to
 * arrive on every phone or their stock disagrees.
 */
test.describe.configure({ mode: 'serial' });

let a: Phone;
let b: Phone;

test.beforeAll(async ({ request }) => {
  await asTenant(BIZ, (sql) => sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`);
  a = await activatePhone(request, 'MVAAAAA2');
  b = await activatePhone(request, 'MVBBBBB2');
});

const ids = (got: { tables: { inventory_movements: { id: string }[] } }) =>
  got.tables.inventory_movements.map((m) => m.id);

test('a new phone starts with every movement, so its stock matches from the first pull', async ({
  request,
}) => {
  const [row] = await asTenant(
    BIZ,
    (sql) => sql`SELECT count(*)::int AS n FROM inventory_movements WHERE deleted_at IS NULL`,
  );
  expect((await pull(request, a, 0)).tables.inventory_movements).toHaveLength(row?.n as number);
});

test('an entrada recorded in the portal reaches the phones, and books its purchase', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, b, b.cursor)).serverSeq;
  await page.goto('/productos');
  await page
    .locator('main')
    .locator('tr', { hasText: 'TAC-001' })
    .getByRole('button', { name: 'Movimiento' })
    .click();
  await page.getByTestId('movimiento-cantidad').fill('7');
  await page.getByTestId('movimiento-costo').fill('9.80');
  await page.getByRole('dialog').getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const got = await pull(request, b, cursor);
  const [m] = got.tables.inventory_movements;
  expect(m).toMatchObject({
    productoId: TACO,
    tipo: 'entrada',
    cantidad: 7,
    costoUnitCentavos: '980',
  });
  const [gasto] = await asTenant(
    BIZ,
    (sql) => sql`SELECT monto_centavos::text AS m FROM expenses
                 WHERE concepto = 'Compra inventario: Compra a proveedor' ORDER BY created_at DESC LIMIT 1`,
  );
  expect(gasto?.m).toBe('6860');
});

test('a movement pushed by one phone reaches the other', async ({ request }) => {
  const cursor = (await pull(request, b, b.cursor)).serverSeq;
  const row = {
    id: newUlid(),
    productoId: TACO,
    fecha: '2026-09-18',
    tipo: 'salida',
    cantidad: 2,
    costoUnitCentavos: '980',
    motivo: 'Merma / daño',
    nota: null,
    businessId: BIZ,
    deviceId: a.deviceId,
    createdByUserId: null,
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z',
    deletedAt: null,
  };
  const pushed = await (
    await push(request, a, [
      { table: 'inventory_movements', rowId: row.id, op: 'insert', clientSeq: 1, row },
    ])
  ).json();
  expect(pushed.accepted).toHaveLength(1);
  expect(ids(await pull(request, b, cursor))).toContain(row.id);
});

test('a product created in the portal reaches the phones, at zero stock', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, b, b.cursor)).serverSeq;
  const nombre = `Agua de jamaica ${Date.now()}`;
  await page.goto('/productos');
  await page.getByRole('button', { name: 'Nuevo producto' }).click();
  await page.getByTestId('nuevo-nombre').fill(nombre);
  await page.getByTestId('nuevo-costo').fill('6.10');
  await page.getByTestId('nuevo-precio').fill('20');
  await expect(page.getByTestId('nuevo-margen')).toContainText('Margen 69%');
  await page.getByRole('radio', { name: 'Verde' }).click();
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page.locator('main').getByText(nombre)).toBeVisible();

  const got = await pull(request, b, cursor);
  const [p] = got.tables.products;
  expect(p).toMatchObject({
    nombre,
    costoUnitCentavos: '610',
    precioVentaCentavos: '2000',
    colorFondo: 'green',
  });
  expect(
    got.tables.inventory_movements.filter((m: { productoId: string }) => m.productoId === p.id),
  ).toEqual([]);
});
