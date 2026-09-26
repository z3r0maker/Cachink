import { expect, test, type Page } from './test';

import { asTenant, BIZ } from './sync-phone';

/**
 * P-14's period switcher and ISR, against the seed with the business's today
 * pinned to 2026-05-12. In the `sync` project because one test changes the
 * seeded tenant's ISR rate — and puts it back.
 */
test.afterAll(async () => {
  await asTenant(
    BIZ,
    (sql) => sql`UPDATE businesses SET isr_tasa = 125, regimen_sat = '626' WHERE id = ${BIZ}`,
  );
});

const main = (page: Page) => page.locator('main');

test('each period recomputes the statements from its own rows', async ({ page }) => {
  await page.goto('/estados');
  await expect(main(page).getByRole('status')).toHaveText('01/MAY/2026 – 31/MAY/2026');
  await expect(main(page).getByText(/^Vendiste \$885\.00,/)).toBeVisible();

  await page.getByRole('button', { name: 'Trimestral', exact: true }).click();
  await expect(main(page).getByRole('status')).toHaveText('01/ABR/2026 – 30/JUN/2026');

  await page.getByRole('button', { name: 'Personalizado', exact: true }).click();
  await page.getByTestId('periodo-desde').fill('2026-05-11');
  await page.getByTestId('periodo-hasta').fill('2026-05-11');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page).toHaveURL(/desde=2026-05-11&hasta=2026-05-11/);
  await expect(main(page).getByText(/^Vendiste \$330\.00,/)).toBeVisible();
});

test("the ISR notice follows the régime, and the owner's rate only for the rest", async ({
  page,
}) => {
  await asTenant(
    BIZ,
    (sql) => sql`UPDATE businesses SET isr_tasa = 3000, regimen_sat = '616' WHERE id = ${BIZ}`,
  );
  await page.goto('/estados');
  await expect(main(page).getByText('ISR referencial (30%)')).toBeVisible();
  // May's gastos exceed its ventas in the seed: no utilidad, no estimate.
  await expect(main(page).getByText(/no hubo utilidad, así que no hay ISR estimado/)).toBeVisible();
  await expect(main(page).getByText(/consulta a tu contador/)).toBeVisible();
});

test('the seeded RESICO estimates on gross income — even in a loss month', async ({ page }) => {
  await page.goto('/estados');
  await expect(main(page).getByText('ISR referencial (RESICO, sobre tus ingresos)')).toBeVisible();
  await expect(main(page).getByText(/tablas publicadas del SAT/)).toBeVisible();
  // May's $885.00 of ventas at 1.00%: the ISR line itself.
  await expect(main(page).getByText('$8.85')).toBeVisible();
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
  // ADR-107 laid the cascade on its side as a table: one row per step, in the
  // owner's words, and the table's name speaks the whole walk.
  const cascada = main(page).getByRole('table', { name: /Cascada del Estado de Resultados/ });
  await expect(cascada).toBeVisible();
  await expect(cascada).toHaveAttribute('aria-label', /Lo que vendiste .*Te quedó/);
  // May's seed draws at least the three anchored levels and the drops between
  // them; an exact count would be brittle to the rows other specs add.
  await expect.poll(() => cascada.getByRole('row').count()).toBeGreaterThanOrEqual(6);
  await expect(cascada.getByRole('row').first()).toContainText('la base: 100%');
  // Beside it, the month's break-even (ADR-107).
  await expect(main(page).getByTestId('para-no-perder')).toContainText('Necesitas vender unos');
  // The donuts were drawn to the design in the same change, and with them went
  // the names this asserted («Ingresos por método») and the «Total: $885.00.»
  // line — the total now lives inside the ring. Each donut speaks its own
  // slices, so that is what is read here: May's ventas by método, of which the
  // seed's largest is $555 in efectivo and its smallest $60 — and they sum to
  // the $885.00 the statement above states.
  const ingresos = main(page).getByRole('img', { name: /¿De dónde vienen tus ingresos\?/ });
  await expect(ingresos).toBeVisible();
  await expect(ingresos).toHaveAttribute('aria-label', /Efectivo \$555/);
  await expect(ingresos).toHaveAttribute('aria-label', /Crédito \$90/);
  await expect(main(page).getByRole('img', { name: /¿En qué se gasta\?/ })).toBeVisible();
});
