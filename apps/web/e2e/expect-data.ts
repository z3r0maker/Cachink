import { expect, type Page } from '@playwright/test';

import type { Route } from './routes';

/**
 * Asserts the route actually rendered seeded data.
 *
 * Deliberately a *positive* assertion on content, not "the error card is
 * absent". `ParaTi` (`src/app/(portal)/asesor/para-ti.tsx`) does
 * `const rows = insights ?? []` and never touches `ScreenBody`, so `/asesor`
 * with a dead database renders an empty-but-healthy-looking feed and no error
 * card at all — an absence check would pass there with zero database.
 *
 * Scoped to `<main>` because the shell hardcodes strings (the business name
 * among them) that would otherwise satisfy a sentinel on every route.
 */
export async function expectSeededData(page: Page, route: Route): Promise<void> {
  if (route.data.kind === 'fixture') return;

  const main = page.locator('main');
  await expect(
    main.getByText(route.data.sentinel).first(),
    `${route.path} did not render seeded data — is DATABASE_URL reaching the server?`,
  ).toBeVisible();

  // Belt and braces: one line, and it catches the case where a sentinel is
  // somehow present while the screen still reports failure.
  await expect(main.getByText('Algo salió mal')).toHaveCount(0);
}
