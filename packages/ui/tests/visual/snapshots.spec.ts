/**
 * Visual regression snapshots for `@cachink/ui` stories.
 *
 * Storybook exposes each story at `/iframe.html?id=<kebab-title>--<kebab-story>`.
 * Playwright navigates to each URL, waits for the story to mount, and diffs
 * the rendered page against the committed baseline in `__snapshots__/`.
 *
 * To update baselines after an intentional visual change:
 *   pnpm --filter @cachink/ui test:visual --update-snapshots
 */
import { test, expect } from '@playwright/test';

const stories = [
  'phase-0-hellobadge--default',
  'phase-0-hellobadge--custom-text',
  'phase-1a-primitives-btn--primary',
  'phase-1a-primitives-btn--all-variants',
  'phase-1a-primitives-btn--pressed',
  'phase-1a-primitives-btn--disabled',
  'phase-1a-primitives-input--text',
  'phase-1a-primitives-input--number',
  'phase-1a-primitives-input--date',
  'phase-1a-primitives-input--select',
  'phase-1a-primitives-input--with-label-and-note',
  'phase-1a-primitives-tag--soft',
  'phase-1a-primitives-tag--success',
  'phase-1a-primitives-tag--danger',
  'phase-1a-primitives-tag--info',
  'phase-1a-primitives-tag--all-variants',
  'phase-1a-primitives-modal--default',
  'phase-1a-primitives-modal--with-title',
  'phase-1a-primitives-modal--with-title-and-emoji',
  'phase-1a-primitives-modal--nueva-venta',
  'phase-1a-primitives-modal--without-header',
  'phase-1a-primitives-empty-state--ventas-vacio',
  'phase-1a-primitives-empty-state--egresos-vacio',
  'phase-1a-primitives-empty-state--inventario-vacio',
  'phase-1a-primitives-empty-state--sin-resultados',
  'phase-1a-primitives-empty-state--titulo-solo',
  'phase-1a-primitives-section-title--ventas-hoy',
  'phase-1a-primitives-section-title--actividad-reciente',
  'phase-1a-primitives-section-title--stock-bajo',
  'phase-1a-primitives-section-title--cuentas-por-cobrar',
  'phase-1a-primitives-section-title--productos',
  'phase-1a-primitives-card--white-default',
  'phase-1a-primitives-card--yellow-hero',
  'phase-1a-primitives-card--black-director',
  'phase-1a-primitives-card--tappable',
  'phase-1a-primitives-card--all-variants',
  'phase-1a-primitives-kpi--ventas-hoy',
  'phase-1a-primitives-kpi--utilidad-mes',
  'phase-1a-primitives-kpi--egresos-hoy',
  'phase-1a-primitives-kpi--stock-total',
  'phase-1a-primitives-kpi--all-tones',
  'phase-1a-primitives-gauge--margen-bruto',
  'phase-1a-primitives-gauge--liquidez',
  'phase-1a-primitives-gauge--rotacion-inventario',
  'phase-1a-primitives-gauge--alerta',
  'phase-1a-primitives-gauge--all-tones',
  'phase-1a-primitives-bottom-tab-bar--operativo',
  'phase-1a-primitives-bottom-tab-bar--director',
  'phase-1a-primitives-bottom-tab-bar--with-badges',
  'phase-1a-primitives-bottom-tab-bar--iconless-fallback',
  'phase-1a-primitives-bottom-tab-bar--mid-selection',
  'phase-1a-primitives-top-bar--default',
  'phase-1a-primitives-top-bar--with-subtitle',
  'phase-1a-primitives-top-bar--operativo-screen',
  'phase-1a-primitives-top-bar--director-home',
  'phase-1a-primitives-top-bar--back-button',
];

for (const id of stories) {
  test(`snapshot: ${id}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await page.waitForSelector('#storybook-root > *');
    await expect(page).toHaveScreenshot(`${id}.png`, { fullPage: true });
  });
}
