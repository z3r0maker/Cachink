import { expect, test } from '@playwright/test';

/**
 * P-23's visual-regression baselines (ADR-017's harness, on the in-app
 * inventory rather than Storybook — a documented deviation): every pinned
 * section of `/inventario` is held by a committed screenshot at
 * `maxDiffPixelRatio: 0.01`.
 *
 * Like `design:compare`, this is a **review, not a CI gate**: screenshots are
 * platform-rendered, so the suite runs locally (where the baselines were
 * generated) and skips under CI. Regenerate after a deliberate change with
 * `npx playwright test visual --project=desktop --update-snapshots`.
 */
const SECCIONES = [
  { nombre: 'Botones', slug: 'botones' },
  { nombre: 'Etiquetas y píldoras de estado', slug: 'tags' },
  { nombre: 'Tarjetas', slug: 'cards' },
  { nombre: 'Switch · OptionCards · UsageBar · Diálogos · Sellos · Avisos', slug: 'recientes' },
] as const;

test.skip(
  ({ project }) => process.env.CI !== undefined || project.name !== 'desktop',
  'visual baselines are a local, desktop review',
);

test.beforeEach(async ({ page }) => {
  await page.goto('/inventario');
});

for (const { nombre, slug } of SECCIONES) {
  test(`baseline: ${slug}`, async ({ page }) => {
    const card = page.locator('main').getByText(nombre, { exact: true }).locator('..');
    await expect(card).toBeVisible();
    await expect(card).toHaveScreenshot(`${slug}.png`, { maxDiffPixelRatio: 0.01 });
  });
}
