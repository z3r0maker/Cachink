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

test('an expandable line lists what it is made of, largest first', async ({ page }) => {
  await page.goto('/estados');
  const toggle = main(page).getByRole('button', { name: 'Ver el detalle de Gastos operativos' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(
    main(page).getByRole('button', { name: 'Ocultar el detalle de Gastos operativos' }),
  ).toHaveAttribute('aria-expanded', 'true');
  // May's seeded gastos operativos: Nómina 8,150 · Renta 6,000 · Servicios 340.
  await expect(main(page).getByText('($8,150.00)')).toBeVisible();
  await expect(main(page).getByText('($6,000.00)')).toBeVisible();
  await expect(main(page).getByText('($340.00)')).toBeVisible();
});

/** P-14's charts (provisional until the design mirror, O-23): the waterfall walks the B-3 identities and the donuts state their totals in text. */
test('the Resultados waterfall and donuts render from the same numbers', async ({ page }) => {
  await page.goto('/estados');
  const main = (p: Page) => p.locator('main');
  await expect(
    main(page).getByRole('img', { name: /Cascada del Estado de Resultados/ }),
  ).toBeVisible();
  // May's seed draws at least the three anchored levels (ingresos, bruta, neta);
  // an exact count would be brittle to the rows other specs legitimately add.
  const bars = await page.locator('.recharts-bar-rectangle').count();
  expect(bars).toBeGreaterThanOrEqual(6);
  await expect(main(page).getByRole('img', { name: /Ingresos por método/ })).toBeVisible();
  await expect(main(page).getByRole('img', { name: /Egresos por categoría/ })).toBeVisible();
  await expect(main(page).getByText('Total: $645.00.')).toBeVisible();
});
