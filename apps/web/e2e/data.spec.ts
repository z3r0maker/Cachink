import { expect, test } from './test';

import { expectSeededData } from './expect-data';
import { ROUTES } from './routes';

/**
 * Every route renders real rows from Postgres.
 *
 * Kept apart from `a11y.spec.ts` so that "the data did not load" and "the
 * markup is inaccessible" are distinguishable at a glance in the report — they
 * have completely different causes and owners.
 */
for (const route of ROUTES) {
  test(`${route.path} renders seeded data`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expectSeededData(page, route);
  });
}
