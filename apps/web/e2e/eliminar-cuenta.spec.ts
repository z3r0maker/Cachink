import { expect, test } from './test';

import { pedirEliminacion } from './eliminacion';
import { asTenant } from './sync-phone';
import { mintTenant, signIn, submitSignIn, type Tenant } from './tenant';

/**
 * «Eliminar mi cuenta» (ADR-136; ElNegocio, ElEliminar, ElProgramada) on
 * minted tenants, never the seeded one. A free tenant deletes without Stripe;
 * a paid one cannot reach Stripe here, so its tap proves the failure state.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('deleting the account', () => {
  let gratis: Tenant;
  let paga: Tenant;

  test.beforeAll(async () => {
    gratis = await mintTenant({ label: 'Borra', plan: 'free' });
    paga = await mintTenant({ label: 'Paga' });
  });

  test('Mi negocio leads to the page, which shows the real business and what is erased', async ({
    page,
  }) => {
    await signIn(page, gratis);
    await page.goto('/negocio');
    await expect(page.getByRole('button', { name: 'Archivar negocio' })).toHaveCount(0);
    await page.getByTestId('eliminar-cuenta').click();
    await expect(page.getByRole('heading', { name: 'Eliminar tu cuenta' })).toBeVisible();
    await expect(page.getByTestId('eliminar-negocio')).toHaveCount(1);
    await expect(page.getByTestId('eliminar-negocio')).toContainText(gratis.nombre);
    await expect(page.getByText(/^Se borra el \d{1,2} de \w+ de \d{4}$/)).toBeVisible();
    await expect(page.getByText('Se guarda 10 años, bloqueado')).toBeVisible();
    await expect(page.getByTestId('eliminar-plan')).toHaveCount(0);
  });

  test('a wrong password is refused at the field; the right one closes everything', async ({
    page,
  }) => {
    await signIn(page, gratis);
    await page.goto('/negocio/eliminar');
    await page.getByTestId('eliminar-password').fill('no-es-la-mia');
    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
    await expect(
      page.getByText('Esa contraseña no es correcta. Escríbela otra vez.'),
    ).toBeVisible();

    await page.getByTestId('eliminar-password').fill(gratis.password);
    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
    await page.waitForURL('**/eliminacion/programada');
    await expect(page.getByTestId('eliminacion-folio')).toHaveText(/^EL-[0-9A-F]{6}$/);
    await expect(page.getByTestId('eliminacion-programada')).toContainText(gratis.nombre);

    const [row] = await asTenant(
      gratis.biz,
      (sql) => sql<{ closed: boolean; live: number }[]>`
        SELECT (SELECT deleted_at IS NOT NULL FROM businesses WHERE id = ${gratis.biz}) AS closed,
               (SELECT count(*)::int FROM devices WHERE revoked_at IS NULL) AS live`,
    );
    expect({ ...row }).toEqual({ closed: true, live: 0 });
    await submitSignIn(page, gratis);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('a paid plan that cannot reach Stripe changes nothing and says so', async ({ page }) => {
    await signIn(page, paga);
    await page.goto('/negocio/eliminar');
    await expect(page.getByTestId('eliminar-plan')).toContainText(
      'Tu plan Xangarro ya no se renueva',
    );
    await page.getByTestId('eliminar-password').fill(paga.password);
    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
    await expect(page.getByText(/No pudimos eliminar tu cuenta y no se cambió nada/)).toBeVisible();
    await page.goto('/negocio');
    await expect(page.getByTestId('eliminar-cuenta')).toBeVisible();
  });
});

test.describe('the undo link', () => {
  let t: Tenant;
  let token: string;

  test.beforeAll(async () => {
    t = await mintTenant({ label: 'Vuelve', plan: 'free' });
    ({ token } = await pedirEliminacion(t));
  });

  test('opening it shows the request; the tap reopens the account, once', async ({ page }) => {
    await page.goto(`/eliminacion?t=${token}`);
    await expect(page.getByRole('heading', { name: '¿Conservar tu cuenta?' })).toBeVisible();
    await expect(page.getByTestId('eliminacion-datos')).toContainText(t.nombre);
    await expect(page.getByText(t.email)).toBeVisible();
    await page.getByRole('button', { name: 'Sí, conservar mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: 'Listo, tu cuenta sigue aquí' })).toBeVisible();

    await signIn(page, t);
    await page.goto(`/eliminacion?t=${token}`);
    await expect(page.getByRole('heading', { name: 'Este enlace ya no sirve' })).toBeVisible();
  });

  test('a link that is not ours says it no longer works', async ({ page }) => {
    await page.goto(`/eliminacion?t=${'x'.repeat(43)}`);
    await expect(page.getByRole('heading', { name: 'Este enlace ya no sirve' })).toBeVisible();
  });

  test('the scheduled page without its cookie sends to the login', async ({ page }) => {
    await page.goto('/eliminacion/programada');
    await expect(page).toHaveURL(/\/login/);
  });
});
