import { expect, test } from '@playwright/test';

/**
 * N-23: the offline page. A production build registers the service worker
 * from the portal shell, so once it is active a navigation that cannot reach
 * the network is answered with the branded «Sin conexión» page instead of a
 * browser error — while `/operador`, which owns its own offline outbox
 * (ADR-071), is left to fail on its own and is never replaced.
 */
test('a failed navigation shows the branded offline page', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.goto('/gastos');
  await expect(page.getByRole('heading', { name: 'Sin conexión' })).toBeVisible();
  await expect(page.getByText('Tus ventas siguen guardándose en tus dispositivos.')).toBeVisible();

  await context.setOffline(false);
  await page.goto('/gastos');
  await expect(page.getByRole('heading', { name: 'Sin conexión' })).toHaveCount(0);
});

test('the operator register is never replaced by the offline page', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.goto('/operador').catch(() => undefined);
  await expect(page.getByRole('heading', { name: 'Sin conexión' })).toHaveCount(0);

  await context.setOffline(false);
});
