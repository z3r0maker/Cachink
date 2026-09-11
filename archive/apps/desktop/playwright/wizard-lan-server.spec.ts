/**
 * Desktop wizard — `lan-server` happy path (ADR-039 WUX-M4-T06).
 *
 * Verifies the four-screen wizard produces `mode = 'lan-server'` on
 * desktop when the user picks Step 1 → Multi → Step 2B → "Esta
 * computadora guarda los datos". The host card is enabled (no
 * disabled-note) on desktop, in contrast to the mobile flow.
 *
 * Prereqs (documented in apps/desktop/SETUP.md):
 *   - `pnpm --filter @cachink/desktop dev` running in another terminal,
 *     fresh state (no existing AppConfig.mode value).
 *   - The dev URL defaults to `http://localhost:1420`; override with
 *     `CACHINK_DESKTOP_URL` if your dev server is on a different port.
 */

import { expect, test } from '@playwright/test';

const DESKTOP_URL = process.env.CACHINK_DESKTOP_URL ?? 'http://localhost:1420';

test.describe('Wizard — lan-server happy path on desktop', () => {
  test('desktop user reaches the LanHostScreen via Step 1 → Multi → Server', async ({ page }) => {
    await page.goto(DESKTOP_URL);

    // Step 1 — welcome screen renders the new ADR-039 copy.
    await expect(page.getByText('¡Bienvenido a Cachink!')).toBeVisible();
    await expect(page.getByTestId('wizard-step1-solo')).toBeVisible();
    await expect(page.getByTestId('wizard-step1-multi')).toBeVisible();

    // Pick Multi → Step 2B mounts.
    await page.getByTestId('wizard-step1-multi-card').click();
    await expect(page.getByTestId('wizard-step2b-server')).toBeVisible();

    // The disabled-note is desktop-hidden — confirm by absence.
    await expect(page.getByTestId('wizard-step2b-server-note')).toHaveCount(0);

    // Tapping the server card writes mode='lan-server' and routes to
    // LanHostScreen (the gate's downstream UI for `mode === 'lan-server'`
    // pre-pair).
    await page.getByTestId('wizard-step2b-server-card').click();

    await expect(page.getByTestId('lan-host-screen')).toBeVisible();
  });
});
