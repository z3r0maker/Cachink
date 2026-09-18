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

/**
 * The pill and Sincronización read the same table, so they must agree.
 *
 * This replaces an assertion that the pill showed "3 registros no enviados" —
 * which was a literal in `layout.tsx`, so the test asserted that a constant
 * equalled itself, and would have kept passing however wrong the number was.
 * Re-anchoring it to the seed's count would only have moved the tautology.
 *
 * A cross-screen invariant cannot rot: it needs no hardcoded number, and it
 * fails if either surface drifts from the database or from the other.
 */
test('the sync pill agrees with Sincronización', async ({ page }) => {
  await page.goto('/sincronizacion');

  // The KPI card renders `<span>{label}</span><p>{value}</p>`, so the figure is
  // the first paragraph beside its own label — not "the first number on the
  // page", which would silently latch onto whichever card rendered first.
  const label = page.locator('main').getByText('Registros rechazados', { exact: true });
  const figure = await label.locator('..').locator('p').first().innerText();
  const pending = Number(figure);
  expect(Number.isInteger(pending), `expected a count, got "${figure}"`).toBe(true);

  const pill = page.locator('header');
  if (pending === 0) {
    await expect(pill.getByText('Sincronizado', { exact: true })).toBeVisible();
  } else {
    const noun = pending === 1 ? 'registro no enviado' : 'registros no enviados';
    await expect(pill.getByText(`${pending} ${noun}`)).toBeVisible();
  }
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
