import { expect, test } from './test';

import { renewalLink } from './renewal-notice';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * Cancel and renew under LFPC art. 76 Bis (ADR-132, SbPlan, SbCancelarEnlace).
 *
 * Each test reads a minted tenant's own subscription row, so what shows is
 * real data. The e2e server has no Stripe key, so the taps prove the failure
 * state: nothing changed, and the screen says so. The successful tap is the
 * unit suites' (`billing-cancel-*.test.ts`), over a Stripe fake.
 */
test.describe('Plan y pagos: cancel at period end', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let activa: Tenant;
  let cancelada: Tenant;

  test.beforeAll(async () => {
    activa = await mintTenant({ label: 'Renueva' });
    cancelada = await mintTenant({ label: 'Cancela', cancelando: true });
  });

  test('a renewing plan shows the next charge with IVA and the cancel row', async ({ page }) => {
    await signIn(page, activa);
    await page.goto('/suscripcion');
    const main = page.locator('main');
    await expect(main.getByTestId('suscripcion-estado')).toHaveText(
      /^Siguiente cobro: \d{1,2} de \w+ de \d{4} · \$230\.84 con IVA$/,
    );
    await expect(
      main.getByRole('heading', { name: '¿Quieres cancelar tu suscripción?' }),
    ).toBeVisible();
    await expect(main.getByText(/y ya no se te cobra\. Después pasas a Xangarrito/)).toBeVisible();
    await expect(main.getByRole('button', { name: 'Cambiar a Xangarrito' })).toHaveCount(0);
  });

  test('a cancel that cannot reach Stripe changes nothing and says so', async ({ page }) => {
    await signIn(page, activa);
    await page.goto('/suscripcion');
    const main = page.locator('main');
    await main.getByTestId('cancelar-suscripcion').click();
    await expect(
      main.getByText(/No pudimos cancelar tu suscripción y no se cambió nada/),
    ).toBeVisible();
    await expect(main.getByTestId('cancelar-suscripcion')).toHaveText('Intentar otra vez');
    await expect(main.getByTestId('suscripcion-estado')).toHaveText(/^Siguiente cobro: /);
  });

  test('a cancelled plan says when it ends and offers «Seguir con mi plan»', async ({ page }) => {
    await signIn(page, cancelada);
    await page.goto('/suscripcion');
    const main = page.locator('main');
    await expect(main.getByText('Se cancela', { exact: true })).toBeVisible();
    await expect(main.getByTestId('suscripcion-estado')).toHaveText(
      /^Termina el \d{1,2} de \w+ de \d{4}\. No se te cobrará más\.$/,
    );
    await expect(main.getByTestId('seguir-con-mi-plan')).toBeVisible();
    await expect(main.getByRole('button', { name: 'Administrar pago' })).toBeVisible();
    await expect(main.getByTestId('cancelar-suscripcion')).toHaveCount(0);
    await expect(main.getByTestId('entitlement-debug')).toContainText(
      'Tus cajas siguen con el plan Xangarro hasta el',
    );
  });
});

test.describe('the reminder email link', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let t: Tenant;
  let token: string;

  test.beforeAll(async () => {
    t = await mintTenant({ label: 'Enlace' });
    token = await renewalLink(t);
  });

  test('opening it shows what would change, with the total with IVA, and cancels nothing', async ({
    page,
  }) => {
    await page.goto(`/cancelar?t=${token}`);
    await expect(page.getByRole('heading', { name: 'Cancelar tu plan Xangarro' })).toBeVisible();
    const datos = page.getByTestId('cancelar-datos');
    await expect(datos).toContainText(/Tu plan sigue hasta\s*\d{1,2} de \w+ de \d{4}/);
    await expect(datos).toContainText('$230.84 con IVA');
    await expect(datos).toContainText('Xangarrito, gratis');
    await expect(page.getByRole('button', { name: 'Sí, cancelar mi suscripción' })).toBeEnabled();
    await expect(page.getByText(/MEXIA, S\.A\.S\., Paseo Lomas Altas 524/)).toBeVisible();
  });

  test('a tap that cannot reach Stripe changes nothing and says so', async ({ page }) => {
    await page.goto(`/cancelar?t=${token}`);
    await page.getByRole('button', { name: 'Sí, cancelar mi suscripción' }).click();
    await expect(
      page.getByText(/No pudimos cancelar tu suscripción y no se cambió nada/),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cancelar tu plan Xangarro' })).toBeVisible();
  });

  test('a link that is not ours says it no longer works and points to the account', async ({
    page,
  }) => {
    await page.goto(`/cancelar?t=${'x'.repeat(43)}`);
    await expect(page.getByRole('heading', { name: 'Este enlace ya no sirve' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar a mi cuenta' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
