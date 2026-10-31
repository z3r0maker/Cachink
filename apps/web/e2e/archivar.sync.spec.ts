import { expect, test } from './test';

import { asTenant } from './sync-phone';
import { mintTenant, signIn, submitSignIn, type Tenant } from './tenant';

/**
 * P-08's archive row on a throwaway tenant (never the seeded one): a wrong name
 * is refused, the right one archives, signs the owner out and unlinks the
 * phones, and the owner cannot sign back in to it.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;

test.beforeAll(async () => {
  // On the free plan: `ArchivarNegocioUseCase` refuses a business whose
  // subscription is still active (`SuscripcionActivaError`), and the factory's
  // default plan is a paid one.
  t = await mintTenant({ label: 'Fonda', plan: 'free' });
});

test('archiving takes the typed name, unlinks the phones and closes the door', async ({ page }) => {
  await signIn(page, t);
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await page.goto('/negocio');
  await page.getByRole('button', { name: 'Archivar negocio' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('archivar-confirmacion').fill('otro nombre');
  await dialog.getByRole('button', { name: 'Archivar' }).click();
  await expect(dialog.getByText(/Escribe el nombre del negocio/)).toBeVisible();

  await dialog.getByTestId('archivar-confirmacion').fill(t.nombre.toLowerCase());
  await dialog.getByRole('button', { name: 'Archivar' }).click();
  await page.waitForURL((u) => u.pathname.startsWith('/login'));

  const [row] = await asTenant(
    t.biz,
    (sql) => sql`
      SELECT (SELECT deleted_at IS NOT NULL FROM businesses WHERE id = ${t.biz}) AS archived,
             (SELECT count(*)::int FROM devices WHERE revoked_at IS NULL) AS live`,
  );
  expect(row).toEqual({ archived: true, live: 0 });

  // The door is pressed, not opened: the archived business answers with its own
  // page. By role, because Next's route announcer repeats the heading's text
  // and `getByText` then matches two elements.
  await submitSignIn(page, t);
  await expect(page.getByRole('heading', { name: 'Sube la cortina.' })).toBeVisible();
});
