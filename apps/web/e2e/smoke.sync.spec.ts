import { expect, test, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';
import { API_PATHS, deviceHeaders, encodeJson } from '@xangarro/contracts';

import { asTenant } from './sync-phone';

/**
 * P-17's named smoke flow, end to end and through the UI wherever the owner
 * would touch it: free signup → wizard → create an operator → import three
 * products → issue a device code → activate a phone against `/activate` →
 * push one sale → see it in Movimientos. Every step on a tenant this run
 * created, so the seed stays untouched (the `sync` project: it writes rows).
 */
test.use({ storageState: { cookies: [], origins: [] } });
test.describe.configure({ mode: 'serial' });

const stamp = randomUUID().slice(0, 8);
const email = `humo-${stamp}@test.mx`;
const password = 'humo-2026';
const negocio = `Abarrotes Humo ${stamp}`;
const operador = `Chelo ${stamp}`;

const HEAD = [
  'sku',
  'nombre',
  'categoria',
  'unidad',
  'costo_unitario',
  'precio_venta',
  'seguir_stock',
  'umbral_stock_bajo',
  'icono',
];
const filas = [
  [`HUMO-${stamp}-1`, `Café ${stamp}`, 'Producto Terminado', 'pza', 10, 25, 'sí', 5, 'coffee'],
  [`HUMO-${stamp}-2`, `Pan ${stamp}`, 'Producto Terminado', 'pza', 5, 15, 'sí', 5, ''],
  [`HUMO-${stamp}-3`, `Masa ${stamp}`, 'Materia Prima', 'kg', 12, 18, 'no', 0, ''],
];

async function xlsx(data: unknown[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Productos');
  for (const r of data) sheet.addRow(r);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const next = (page: Page, label = 'Siguiente') =>
  page.getByRole('button', { name: label, exact: true }).click();

/** Answer the wizard minimally: a giro on step 1, defaults onward. */
async function wizardMinimo(page: Page): Promise<void> {
  await expect(page.getByText('Paso 1 de 8')).toBeVisible();
  await page.getByRole('radio', { name: /Servicios/ }).click();
  await next(page);
  for (let paso = 2; paso <= 7; paso += 1) await next(page);
  await next(page, 'Terminar');
}

/** The tenant this signup created, from the signed cookie the app set. */
async function bizDel(page: Page): Promise<string> {
  const biz = (await page.context().cookies()).find((c) => c.name === 'xg_business')?.value;
  expect(biz, 'signup set the business cookie').toBeDefined();
  return biz as string;
}

test('signup → wizard → operator → import → code → activate → push → Movimientos', async ({
  page,
  request,
}) => {
  // 1 · Signup and the wizard.
  await page.goto('/signup?plan=xangarrito');
  await page.getByTestId('signup-tu-nombre').fill('Humo');
  await page.getByTestId('signup-nombre').fill(negocio);
  await page.getByTestId('signup-email').fill(email);
  await page.getByTestId('signup-password').fill(password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await wizardMinimo(page);

  // Free plan: no checkout — the plan screen only confirms, then the checklist.
  const gratis = page.getByRole('button', { name: 'Seguir gratis' });
  if (await gratis.isVisible().catch(() => false)) await gratis.click();
  await page.getByRole('link', { name: 'Ir a mi portal' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Humo' })).toBeVisible();
  const biz = await bizDel(page);

  // 2 · An operator for the counter phone.
  await page.goto('/equipo');
  await page.getByRole('button', { name: 'Nuevo operador' }).click();
  await page.getByTestId('operador-nombre').fill(operador);
  await page.getByTestId('operador-pin').fill('1357');
  await page.getByTestId('operador-pin-confirmar').fill('1357');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('main').getByText(operador, { exact: true })).toBeVisible();

  // 3 · Three products, imported.
  await page.goto('/productos');
  await page.getByRole('button', { name: 'Importar desde Excel' }).click();
  await page.getByTestId('import-archivo').setInputFiles({
    name: 'productos.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: await xlsx([HEAD, ...filas]),
  });
  await page.getByRole('button', { name: 'Revisar archivo' }).click();
  await page.getByRole('button', { name: 'Importar 3 productos' }).click();
  await expect(page.getByTestId('import-listo')).toContainText('3 nuevos');
  await page.keyboard.press('Escape');

  // 4 · A device code, from the panel itself.
  await page.goto('/equipo?tab=dispositivos');
  await page.getByRole('button', { name: 'Generar código' }).click();
  const codigo = (await page.getByTestId('activation-code').getAttribute('aria-label'))?.replace(
    'Código ',
    '',
  );
  expect(codigo).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);

  // 5 · A phone redeems it against the real /activate.
  const r = await request.post(API_PATHS.activate, {
    headers: deviceHeaders(),
    data: {
      email,
      code: codigo,
      device: {
        name: `Teléfono ${stamp}`,
        platform: 'android',
        appVersion: '0.1.0',
        osVersion: '15',
      },
    },
  });
  expect(r.status(), await r.text()).toBe(200);
  const { deviceToken, deviceId } = await r.json();
  await expect(page.getByText(`Teléfono ${stamp}`)).toBeVisible();

  // 6 · The phone pushes one sale of an imported product.
  const [producto] = await asTenant(biz, async (sql) => {
    return sql<{ id: string }[]>`SELECT id FROM products WHERE sku = ${`HUMO-${stamp}-1`}`;
  });
  const idVenta = newUlid();
  const ahora = new Date().toISOString();
  const push = await request.post(API_PATHS.syncPush, {
    headers: deviceHeaders(deviceToken),
    data: encodeJson({
      deltas: [
        {
          table: 'sales',
          op: 'insert',
          row: {
            id: idVenta,
            fecha: ahora.slice(0, 10),
            hora: ahora.slice(11, 16),
            concepto: `Venta de humo ${idVenta.slice(-4)}`,
            categoria: 'Producto',
            monto: 2500n,
            metodo: 'Efectivo',
            clienteId: null,
            estadoPago: 'pagado',
            productoId: producto?.id,
            cantidad: 1,
            efectivoRecibidoCentavos: 3000n,
            cancelledByUserId: null,
            cancelMotivo: null,
            cancelledAt: null,
            cajaTurnoId: null,
            businessId: biz,
            deviceId,
            createdByUserId: null,
            createdAt: ahora,
            updatedAt: ahora,
            deletedAt: null,
          },
        },
      ],
    }),
  });
  expect(push.status(), await push.text()).toBe(200);

  // 7 · The owner sees it in Movimientos.
  await page.goto('/movimientos');
  await expect(page.locator('main').getByText(`Venta de humo ${idVenta.slice(-4)}`)).toBeVisible();
});
