import { expect, test, type Page } from './test';

import { activatePhone, asTenant, BIZ, pull, type Phone } from './sync-phone';

/**
 * P-08's acceptance: each section edits in its own drawer (CfgNegocio), saved
 * as one change that reaches the phones on their next pull; the ways of
 * getting paid switch on /negocio/cobros and save at once; the RFC check digit is enforced where
 * it is typed; only the owner can edit. In the `sync` project: it writes the
 * shared business, and puts the seeded values back afterwards.
 */
test.describe.configure({ mode: 'serial' });

let phone: Phone;

test.beforeAll(async ({ request }) => {
  await asTenant(BIZ, (sql) => sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`);
  phone = await activatePhone(request, 'NGCAAAA2');
});

test.afterAll(async () => {
  // Other projects read the seeded row; put it back.
  await asTenant(
    BIZ,
    (sql) => sql`
      UPDATE businesses SET regimen_sat = '626', regimen_fiscal = 'RESICO', isr_tasa = 125,
        enabled_payment_methods = '["Efectivo","Transferencia","Tarjeta","QR/CoDi"]',
        atributos_producto = '[]'
      WHERE id = ${BIZ}`,
  );
});

/** Opens one section's drawer on Mi negocio · General. */
async function edit(page: Page, name: string | RegExp) {
  await page.goto('/negocio');
  await page.getByRole('button', { name }).click();
}

const FISCALES = /^(Completar|Editar) datos fiscales$/;
const GENERALES = 'Editar datos generales';

const save = (page: Page) => page.getByRole('button', { name: 'Guardar cambios' }).click();
const saved = (page: Page) =>
  expect(page.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);

test('a mistyped RFC is refused, a valid one is saved and reaches the phone', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, phone, phone.cursor)).serverSeq;
  await edit(page, FISCALES);
  await page.getByTestId('fiscal-rfc').fill('xoji740919u47');
  await save(page);
  await expect(page.getByText('Revisa el RFC: no es válido.')).toBeVisible();

  await page.getByTestId('fiscal-rfc').fill('xoji740919u48');
  await page.getByTestId('fiscal-razon').fill('Pedro Pérez López');
  await page.getByTestId('fiscal-cp').fill('06600');
  await save(page);
  await saved(page);
  await expect(page.locator('main').getByText('XOJI740919U48')).toBeVisible();

  const [biz] = (await pull(request, phone, cursor)).tables.businesses;
  expect(biz).toMatchObject({
    rfc: 'XOJI740919U48',
    razonSocial: 'Pedro Pérez López',
    codigoPostal: '06600',
    usoCfdi: 'G03',
  });
});

test('the contador (viewer) cannot edit the business', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill('contador@taqueria.mx');
  await page.getByTestId('login-password').fill('contador123');
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/negocio');
  await expect(page.locator('main').getByText('XOJI740919U48')).toBeVisible();
  await expect(page.getByRole('button', { name: GENERALES })).toHaveCount(0);
  await expect(page.getByRole('button', { name: FISCALES })).toHaveCount(0);
  await context.close();
});

test('the régimen is picked by SAT code and offers its suggested ISR rate', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, phone, phone.cursor)).serverSeq;
  await edit(page, GENERALES);
  await page.getByRole('radio', { name: /^612/ }).click();
  await expect(page.getByRole('switch', { name: 'Usar la tasa de ISR sugerida' })).toBeChecked();
  await save(page);
  await saved(page);
  await expect(page.locator('main').getByText(/^612 · /)).toBeVisible();

  // Old phones keep reading the bucket; new ones read the code.
  const [biz] = (await pull(request, phone, cursor)).tables.businesses;
  expect(biz).toMatchObject({ regimenSat: '612', regimenFiscal: 'Otro' });
});

test('a payment method saves as soon as it is switched, and reaches the phone', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, phone, phone.cursor)).serverSeq;
  await page.goto('/negocio/cobros');
  const tarjeta = page.getByRole('switch', { name: 'Aceptar tarjeta' });
  await tarjeta.click();
  await expect(tarjeta).toHaveAttribute('aria-checked', 'false');
  // The save is done when the switches take taps again.
  await expect(tarjeta).toBeEnabled();

  const [biz] = (await pull(request, phone, cursor)).tables.businesses;
  expect(biz).toMatchObject({
    // The seed still stores QR/CoDi; ADR-108 drops it on read, so a save writes it out.
    enabledPaymentMethods: '["Efectivo","Transferencia"]',
  });
});

test('product attributes save from their drawer, and reach the phone', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, phone, phone.cursor)).serverSeq;
  await edit(page, /^(Agregar|Editar) atributos$/);
  await page.getByRole('button', { name: 'Agregar atributo' }).click();
  await page.getByTestId('atributo-0-nombre').fill('Talla');
  await page.getByTestId('atributo-0-opciones').fill('Chica, Grande');
  await save(page);
  await saved(page);
  await expect(page.locator('main').getByText('Chica · Grande')).toBeVisible();

  const [biz] = (await pull(request, phone, cursor)).tables.businesses;
  expect(biz).toMatchObject({
    enabledPaymentMethods: '["Efectivo","Transferencia"]',
    atributosProducto: [
      { clave: 'talla', label: 'Talla', tipo: 'select', opciones: ['Chica', 'Grande'] },
    ],
  });
});

test('the last payment method cannot be turned off', async ({ page }) => {
  await page.goto('/negocio/cobros');
  // Tarjeta went off above, and the seed's QR/CoDi is dropped on read
  // (ADR-108): turning Efectivo off leaves Transferencia as the last one.
  const efectivo = page.getByRole('switch', { name: 'Aceptar efectivo' });
  await efectivo.click();
  await expect(efectivo).toHaveAttribute('aria-checked', 'false');
  const transferencia = page.getByRole('switch', { name: 'Aceptar transferencia' });
  await transferencia.click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Deja al menos una forma de cobro' }),
  ).toBeVisible();
  await expect(transferencia).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('switch', { name: /QR|CoDi/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Aceptar transferencia' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});
