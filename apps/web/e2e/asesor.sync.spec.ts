import { expect, test } from '@playwright/test';

import { asTenant } from './sync-phone';

/**
 * P-26 on the seeded tenant: the deterministic layer materialises on read
 * (ADR-088), so visiting /asesor writes insights derived from May's rows —
 * this spec is in the `sync` project because it mutates the seeded tenant's
 * `notices` (upserts only; the rows it asserts are computed from seed data).
 *
 * The seed has one entrada per product and no baseline months, so the honest
 * feed carries few insights; the capacidades panel is where the seeded young
 * business shows real progress.
 */
test('visiting Para ti materialises insights and real capacidades', async ({ page }) => {
  await page.goto('/asesor');
  const main = page.locator('main');

  // The seeded asesor notice (nt-4) is part of the feed.
  await expect(main.getByText('El queso te cuesta 18% más que en junio')).toBeVisible();

  // Capacidades read the seed's real counts (capped at each objective).
  await expect(main.getByText('Lo que tu Asesor ya puede ver')).toBeVisible();
  await expect(main.getByText(/de 60 días · \d+ de 2 compras/)).toBeVisible();

  // The provenance line never claims AI authorship for computed output.
  await expect(main.getByText('Calculado a partir de tus registros.')).toBeVisible();
});

test('a member can dismiss an Asesor insight, and it stays dismissed', async ({ page }) => {
  await page.goto('/asesor');
  const row = page.getByTestId('asesor-feed-row').first();
  const texto = (await row.textContent()) ?? '';
  await row.getByRole('button', { name: 'Descartar' }).click();
  const fuera = page.getByTestId('asesor-feed-row').filter({ hasText: texto.slice(0, 20) });
  await expect(fuera).toHaveCount(0);
  await page.reload();
  await expect(fuera).toHaveCount(0);
  // And it appears under Anteriores as dismissed.
  await expect(page.locator('main').getByText('Anteriores')).toBeVisible();
});

test.afterAll(async () => {
  // Leave the seeded tenant's feed as the seed had it (nt-4 open, no computed rows).
  await asTenant(
    '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
    (sql) => sql`
    DELETE FROM notices WHERE source = 'asesor' AND id LIKE '01HZ8XQN9GZJXV8AKQ5X0C7BJZ:%'`,
  );
});
