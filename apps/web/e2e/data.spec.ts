import { expect, test } from './test';

import { expectSeededData } from './expect-data';
import { ROUTES } from './routes';

/**
 * Every route renders real rows from Postgres, and its scripts ran.
 *
 * Kept apart from `a11y.spec.ts` so that "the data did not load" and "the
 * markup is inaccessible" are distinguishable at a glance in the report — they
 * have completely different causes and owners.
 *
 * The hydration check is what makes this a browser sweep and not an HTML one:
 * with the CSP's upgrade-insecure-requests enforced, WebKit fetched every
 * script from an https the suite does not serve, and the server-rendered rows
 * still passed here on every route but the one that redirects.
 */
for (const route of ROUTES) {
  test(`${route.path} renders seeded data`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expectSeededData(page, route);
    await expect
      .poll(() => page.evaluate(() => Object.keys(document.querySelector('main') ?? {})), {
        message: 'React hydrated <main>: the page scripts loaded and ran',
      })
      .toContainEqual(expect.stringMatching(/^__reactFiber\$/));
  });
}
