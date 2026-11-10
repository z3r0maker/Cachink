import { expect, test, type Page } from './test';

import { expectSeededData } from './expect-data';
import { ROUTES } from './routes';

/**
 * J1-21 — the portal on a phone (the `phone` project, 390 × 844): every route
 * still renders its seeded data, nothing pushes the page sideways, no control
 * is cut off, and the menu reaches every section.
 *
 * «Cut off» is measured, not eyeballed: a control whose box leaves the
 * viewport, or leaves an ancestor that hides its overflow, cannot be tapped
 * whole. A control inside a container that scrolls sideways (a wide table) is
 * reachable by that scroll and is not counted.
 */

/** A control a person taps or types into. */
const CONTROLS =
  'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=radio], [role=checkbox], [role=switch], [role=link]';

/** Every visible control that is not wholly reachable, described for the failure message. */
async function controlesCortados(page: Page): Promise<string[]> {
  return page.evaluate((selector) => {
    const fuera = (r: DOMRect, left: number, right: number): boolean =>
      r.left < left - 1 || r.right > right + 1;
    const scrollsX = (el: Element): boolean => {
      const { overflowX } = getComputedStyle(el);
      return (overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth;
    };
    const recorta = (el: Element): boolean => {
      const { overflowX } = getComputedStyle(el);
      return overflowX === 'hidden' || overflowX === 'clip';
    };
    /** Cut by the viewport or a clipping ancestor, and no sideways scroll on the way to reach it. */
    const cortado = (el: Element, r: DOMRect): boolean => {
      let cut = fuera(r, 0, window.innerWidth);
      for (let a = el.parentElement; a !== null && a !== document.body; a = a.parentElement) {
        if (scrollsX(a)) return false;
        const ar = a.getBoundingClientRect();
        if (recorta(a) && fuera(r, ar.left, ar.right)) cut = true;
      }
      return cut;
    };
    // Invisible, or the 1 px visually-hidden pattern: nothing to tap.
    const visible = (el: Element, r: DOMRect): boolean =>
      r.width > 1 && r.height > 1 && getComputedStyle(el).visibility !== 'hidden';
    const describe = (el: Element, r: DOMRect): string => {
      const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 40);
      return `${el.tagName.toLowerCase()} «${label}» at ${Math.round(r.left)}–${Math.round(r.right)}`;
    };
    return Array.from(document.querySelectorAll(selector))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ el, r }) => visible(el, r) && cortado(el, r))
      .map(({ el, r }) => describe(el, r));
  }, CONTROLS);
}

for (const route of ROUTES) {
  test(`${route.path} fits a phone: its data, no sideways scroll, nothing cut off`, async ({
    page,
  }) => {
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expectSeededData(page, route);

    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(desborde, 'the page scrolls sideways').toBeLessThanOrEqual(0);
    expect(await controlesCortados(page)).toEqual([]);
  });
}

test('the menu reaches every section from a phone', async ({ page }) => {
  await page.goto('/');
  const menu = page.getByRole('navigation', { name: 'Navegación principal' });
  const enlaces = menu.getByRole('link');
  const total = await enlaces.count();
  expect(total, 'the menu has its sections').toBeGreaterThan(3);
  for (let i = 0; i < total; i += 1) {
    const enlace = enlaces.nth(i);
    const href = (await enlace.getAttribute('href')) ?? '';
    await enlace.scrollIntoViewIfNeeded();
    await expect(enlace).toBeInViewport();
    await enlace.click();
    await expect(page).toHaveURL((u) => u.pathname === href);
    await expect(page.locator('main')).toBeVisible();
  }
});
