import { expect, test, type Page } from './test';
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

test('signup → wizard → operator → import → code → activate → push → Movimientos', async ({
  page,
  request,
}, testInfo) => {
  // The whole point is a brand-new owner: /signup bounces signed-in visitors
  // to the portal, so drop the sync project's owner cookie for this one.
  test.skip(testInfo.project.name !== 'sync', 'lives in the sync project');
  await page.context().clearCookies();
  // 1 · Signup and the wizard.
  await page.goto('/signup?plan=xangarrito');
  await page.getByTestId('signup-tu-nombre').fill('Humo');
  await page.getByTestId('signup-nombre').fill(negocio);
  await page.getByTestId('signup-email').fill(email);
  await page.getByTestId('signup-password').fill(password);
  // The express consent on the aviso simplificado is required (art. 16 II
  // LFPDPPP, `signup/consent.tsx`): without it the form refuses, and this flow
  // sat on /signup — which no run saw, because a failure in the viewport phase
  // had been skipping this project entirely.
  await page.getByTestId('signup-acepto').check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await wizardMinimo(page);

  // Free plan: no checkout — the plan screen only confirms, then the checklist.
  // Xangarrito's button reads «Empezar gratis»; the paid tiers' reads «Seguir
  // gratis». The plan screen renders after the wizard's last step, so a
  // one-shot isVisible() races it and loses; wait for either button to exist.
  const gratis = page.getByRole('button', { name: /^(Empezar|Seguir) gratis$/ });
  const hayPlan = await gratis
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (hayPlan) await gratis.click();
  await page.getByRole('link', { name: 'Ir a mi portal' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Humo' })).toBeVisible();

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
  const activated = await r.json();
  const { deviceToken, deviceId } = activated;
  // The panel predates the activation — reload to see the phone listed.
  await page.reload();
  await expect(page.getByText(`Teléfono ${stamp}`)).toBeVisible();

  // The session is server-resolved (xg_session only — no xg_business cookie
  // anymore), so the tenant this signup created is read from the activation's
  // own bootstrap.
  const biz = activated.bootstrap.tables.businesses[0]?.id as string;
  expect(biz).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);

  // 6 · The phone pushes one ticket with its sale line (ADR-073), of an
  // imported product.
  const [producto] = await asTenant(biz, async (sql) => {
    return sql<{ id: string }[]>`SELECT id FROM products WHERE sku = ${`HUMO-${stamp}-1`}`;
  });
  const idTicket = newUlid();
  const idVenta = newUlid();
  const ahora = new Date().toISOString();
  const audit = {
    businessId: biz,
    deviceId,
    createdByUserId: null,
    createdAt: ahora,
    updatedAt: ahora,
    deletedAt: null,
  };
  const push = await request.post(API_PATHS.syncPush, {
    headers: deviceHeaders(deviceToken),
    data: encodeJson({
      deltas: [
        {
          table: 'tickets',
          rowId: idTicket,
          op: 'insert',
          clientSeq: 1,
          row: {
            id: idTicket,
            folio: 1,
            fecha: '2026-05-10',
            hora: ahora.slice(11, 16),
            concepto: `Venta de humo ${idVenta.slice(-4)}`,
            metodo: 'Efectivo',
            clienteId: null,
            estadoPago: 'pagado',
            efectivoRecibidoCentavos: 3000n,
            cambioCentavos: 500n,
            cajaTurnoId: null,
            cancelMotivo: null,
            cancelledByUserId: null,
            cancelledAt: null,
            ...audit,
          },
        },
        {
          table: 'sales',
          rowId: idVenta,
          op: 'insert',
          clientSeq: 2,
          row: {
            id: idVenta,
            ticketId: idTicket,
            fecha: '2026-05-10',
            concepto: `Venta de humo ${idVenta.slice(-4)}`,
            categoria: 'Producto',
            monto: 2500n,
            productoId: producto?.id,
            cantidad: 1,
            ...audit,
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
