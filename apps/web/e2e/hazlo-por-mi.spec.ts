import { expect, test, type Page } from './test';

/**
 * «Hazlo por mí» (N-18's tenant side): the paid business submits the request
 * with a file and sees the waiting state; an empty sistema is refused; a
 * viewer sees the card but never the form. The approval decision path is
 * covered by the data-pg integration suite (staff must send a mapped file
 * first — the claim refuses everything else, which is the acceptance).
 */
test.describe.configure({ mode: 'serial' });

/** Cancel any request a previous run/test left in flight, until the form is back. */
async function limpiaSolicitud(page: Page): Promise<void> {
  await page.goto('/importar');
  await expect(page.getByTestId('hazlo-por-mi')).toBeVisible();
  for (
    let i = 0;
    i < 3 &&
    !(await page
      .getByLabel('Sistema actual')
      .isVisible()
      .catch(() => false));
    i++
  ) {
    const cancelar = page.getByRole('button', { name: 'Cancelar solicitud' });
    if (!(await cancelar.isVisible().catch(() => false))) break;
    await cancelar.click();
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.getByTestId('hazlo-por-mi')).toBeVisible();
  }
  await expect(page.getByLabel('Sistema actual')).toBeVisible();
}

test('a paid business sends a request and lands in revision', async ({ page }) => {
  await limpiaSolicitud(page);

  await page.getByLabel('Sistema actual').fill('Excel de la tiendita');
  await page.getByLabel('Qué datos migrar').fill('Productos y clientes');
  await page.getByTestId('hazlo-por-mi-archivo').setInputFiles({
    name: 'respaldo.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('nombre,telefono\nDoña Mary,5512345678\n'),
  });
  await expect(
    page.getByText('Solicitud enviada. Te avisamos por correo.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('hazlo-por-mi-estado')).toContainText('En revisión');
  await expect(page.getByTestId('hazlo-por-mi')).toContainText('1 archivo');
});

test('an empty sistema is refused with the reason', async ({ page }) => {
  await limpiaSolicitud(page);
  await page.getByLabel('Qué datos migrar').fill('Lo que sea');
  // The submit button stays disabled without a sistema (client guard), but
  // choosing a file auto-submits — that path reaches the server validation.
  await page.getByTestId('hazlo-por-mi-archivo').setInputFiles({
    name: 'respaldo.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('nombre,telefono\nDoña Mary,5512345678\n'),
  });
  await expect(page.locator('[role=alert]', { hasText: /sistema actual/i })).toBeVisible();
});

test('a viewer sees the card but not the form or decision buttons', async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill('contador@taqueria.mx');
  await page.getByTestId('login-password').fill('contador123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/importar');
  await expect(page.getByTestId('hazlo-por-mi')).toBeVisible();
  await expect(page.getByLabel('Sistema actual')).toHaveCount(0);
  await context.close();
});
