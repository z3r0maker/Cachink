import { expect, test } from '@playwright/test';

/**
 * P-34's print stylesheet: a statement prints as the document — the sidebar,
 * the header and every button drop out, the figures stay.
 */
test('printing Estados leaves the statement and drops the app chrome', async ({ page }) => {
  await page.goto('/estados');
  await expect(page.getByRole('button', { name: 'Imprimir' })).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('aside').first()).toBeHidden();
  await expect(page.locator('header').first()).toBeHidden();
  await expect(page.getByRole('button', { name: 'Imprimir' })).toBeHidden();
  await expect(page.locator('main').getByText('Estado de Resultados (NIF B-3)')).toBeVisible();
});
