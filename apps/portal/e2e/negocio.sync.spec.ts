import { expect, test } from '@playwright/test';

import { activatePhone, asTenant, BIZ, pull, type Phone } from './sync-phone';

/**
 * P-08's acceptance for the fiscal data: the RFC check digit is enforced where
 * it is typed, a saved RFC reaches the phones on their next pull, and only the
 * owner can edit. In the `sync` project: it writes the shared business.
 */
test.describe.configure({ mode: 'serial' });

let phone: Phone;

test.beforeAll(async ({ request }) => {
  await asTenant(BIZ, (sql) => sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`);
  phone = await activatePhone(request, 'NGCAAAA2');
});

test('a mistyped RFC is refused, a valid one is saved and reaches the phone', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, phone, phone.cursor)).serverSeq;
  await page.goto('/negocio');
  await page.getByRole('button', { name: 'Editar datos fiscales' }).click();
  await page.getByTestId('fiscal-rfc').fill('xoji740919u47');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Revisa el RFC: no es válido.')).toBeVisible();

  await page.getByTestId('fiscal-rfc').fill('xoji740919u48');
  await page.getByTestId('fiscal-razon').fill('Pedro Pérez López');
  await page.getByTestId('fiscal-cp').fill('06600');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main').getByText('XOJI740919U48')).toBeVisible();

  const [biz] = (await pull(request, phone, cursor)).tables.businesses;
  expect(biz).toMatchObject({
    rfc: 'XOJI740919U48',
    razonSocial: 'Pedro Pérez López',
    codigoPostal: '06600',
    usoCfdi: 'G03',
  });
});

test('the contador (viewer) cannot edit the fiscal data', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByTestId('login-email').fill('contador@taqueria.mx');
  await page.getByTestId('login-password').fill('contador123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/negocio');
  await expect(page.locator('main').getByText('XOJI740919U48')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar datos fiscales' })).toHaveCount(0);
  await context.close();
});

test('the régimen is picked by SAT code and offers its suggested ISR rate', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, phone, phone.cursor)).serverSeq;
  await page.goto('/negocio');
  await page.getByRole('button', { name: 'Editar datos', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: /^612/ }).click();
  await expect(dialog.getByRole('switch', { name: 'Usar la tasa de ISR sugerida' })).toBeChecked();
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('main').getByText(/^612 · /)).toBeVisible();

  // Old phones keep reading the bucket; new ones read the code.
  const [biz] = (await pull(request, phone, cursor)).tables.businesses;
  expect(biz).toMatchObject({ regimenSat: '612', regimenFiscal: 'Otro' });
});

test.afterAll(async () => {
  // Other projects read the seeded RESICO row; put it back.
  await asTenant(
    BIZ,
    (sql) =>
      sql`UPDATE businesses SET regimen_sat = '626', regimen_fiscal = 'RESICO', isr_tasa = 125 WHERE id = ${BIZ}`,
  );
});
