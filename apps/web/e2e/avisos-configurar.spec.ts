import { expect, test } from './test';

import { clickUntil } from './interact';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * P-32's acceptance on a member of its own (the contador role — the matrix is
 * personal, so even Solo lectura sets theirs): toggling a channel persists
 * across a reload, critical rows show a lock («Siempre») instead of a switch,
 * and WhatsApp, not delivered yet, has no column.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Avisos', role: 'viewer' });
});

test('a channel switch persists; critical avisos cannot be switched off', async ({ page }) => {
  await signIn(page, t);

  const correo = page.getByRole('switch', { name: 'Stock bajo por correo' });
  const open = async () => {
    await page.goto('/avisos');
    await clickUntil(
      page.getByRole('group', { name: 'Avisos' }).getByRole('button', { name: /Configurar/ }),
      correo,
    );
  };
  await open();
  await expect(correo).not.toBeChecked();
  await correo.click();
  await expect(correo).toBeChecked();

  await open();
  await expect(page.getByRole('switch', { name: 'Stock bajo por correo' })).toBeChecked();
  await expect(page.getByRole('switch', { name: /Discrepancia en caja/ })).toHaveCount(0);
  await expect(page.getByText('Siempre', { exact: true })).toHaveCount(4);
  await expect(page.getByText('Próximamente')).toHaveCount(0);
  await expect(page.getByRole('switch', { name: /por WhatsApp/ })).toHaveCount(0);
});
