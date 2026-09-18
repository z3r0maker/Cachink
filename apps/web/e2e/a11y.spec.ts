import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { expectSeededData } from './expect-data';
import { ROUTES } from './routes';

/**
 * P-16 acceptance: axe reports zero serious or critical findings on every
 * route, and no route scrolls horizontally at 768 px.
 */
for (const route of ROUTES) {
  test(`${route.path} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    // Without this the scan can run over an error card — three elements, no
    // tables, no charts — and report zero violations for a screen it never saw.
    await expectSeededData(page, route);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(
      blocking,
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join('\n'),
    ).toEqual([]);
  });

  test(`${route.path} does not scroll horizontally`, async ({ page }) => {
    await page.goto(route.path);
    // Tables scroll inside their card; the page itself never does.
    await expectSeededData(page, route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
