import { expect, test } from '@playwright/test';

import { ROUTES } from './routes';

/**
 * Fase 2 compuerta: "Navegar entre pantallas vacías conserva el estado activo
 * del menú y el cascarón no se mueve un píxel entre rutas."
 */
test('the shell does not move between routes', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('header');
  const first = await header.boundingBox();

  for (const route of ROUTES.slice(1, 5)) {
    await page.goto(route.path);
    const box = await header.boundingBox();
    expect(box?.x).toBe(first?.x);
    expect(box?.y).toBe(first?.y);
    expect(box?.height).toBe(first?.height);
  }
});

test('the active nav item follows the route', async ({ page }) => {
  await page.goto('/productos');
  await expect(page.getByRole('link', { name: 'Productos' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('link', { name: 'Negocio' })).not.toHaveAttribute(
    'aria-current',
    'page',
  );
});

/**
 * The sidebar's brand block and the header must be the same height so their
 * bottom borders form one continuous line (design handoff).
 */
test('the sidebar and header borders form one line', async ({ page }) => {
  await page.goto('/');
  const header = await page.locator('header').boundingBox();
  const brand = await page.locator('aside > div').first().boundingBox();
  expect(brand?.height).toBe(header?.height);
});

test('the sync pill tells the truth', async ({ page }) => {
  await page.goto('/');
  // The fixture queue holds 3 rows, so it must not claim to be synced.
  await expect(page.getByText('3 registros no enviados')).toBeVisible();
  await expect(page.getByText('Sincronizado', { exact: true })).toHaveCount(0);
});

test('every interactive control meets the 44 px touch target on tablet', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'tablet-only rule');
  await page.goto('/');
  const buttons = page.getByRole('button');
  const count = await buttons.count();
  for (let i = 0; i < count; i += 1) {
    const box = await buttons.nth(i).boundingBox();
    if (box === null) continue;
    expect(Math.max(box.height, box.width)).toBeGreaterThanOrEqual(44);
  }
});
