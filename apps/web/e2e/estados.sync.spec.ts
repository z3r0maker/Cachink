import { expect, test, type Page } from '@playwright/test';

import { asTenant, BIZ } from './sync-phone';

/**
 * P-14's period switcher and ISR, against the seed with the business's today
 * pinned to 2026-05-12. In the `sync` project because one test changes the
 * seeded tenant's ISR rate — and puts it back.
 */
test.afterAll(async () => {
  await asTenant(BIZ, (sql) => sql`UPDATE businesses SET isr_tasa = 125 WHERE id = ${BIZ}`);
});

const main = (page: Page) => page.locator('main');

test('each period recomputes the statements from its own rows', async ({ page }) => {
  await page.goto('/estados');
  await expect(main(page).getByRole('status')).toHaveText('01/MAY/2026 – 31/MAY/2026');
  await expect(main(page).getByText(/^Vendiste \$645\.00,/)).toBeVisible();

  await page.getByRole('button', { name: 'Trimestral', exact: true }).click();
  await expect(main(page).getByRole('status')).toHaveText('01/ABR/2026 – 30/JUN/2026');

  await page.getByRole('button', { name: 'Personalizado', exact: true }).click();
  await page.getByTestId('periodo-desde').fill('2026-05-11');
  await page.getByTestId('periodo-hasta').fill('2026-05-11');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL(/desde=2026-05-11&hasta=2026-05-11/);
  await expect(main(page).getByText(/^Vendiste \$330\.00,/)).toBeVisible();
});

test("the ISR notice uses the owner's rate, and says when there is no utilidad", async ({
  page,
}) => {
  await asTenant(BIZ, (sql) => sql`UPDATE businesses SET isr_tasa = 3000 WHERE id = ${BIZ}`);
  await page.goto('/estados');
  await expect(main(page).getByText('ISR referencial (30%)')).toBeVisible();
  // May's gastos exceed its ventas in the seed: no utilidad, no estimate.
  await expect(main(page).getByText(/no hubo utilidad, así que no hay ISR estimado/)).toBeVisible();
});
