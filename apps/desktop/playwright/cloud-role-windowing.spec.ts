/**
 * Role-based Sync Stream windowing (P1E-M4 C17). An Operativo account
 * sees the 90-day window on transactional tables; a Director sees
 * everything. Seeded data must include ventas older than 90 days
 * (e.g. via `supabase db seed`).
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const DESKTOP_URL = process.env.CACHINK_DESKTOP_URL ?? 'http://localhost:1420';
const OPERATIVO_EMAIL = process.env.CACHINK_OPERATIVO_EMAIL ?? 'op@cachink.mx';
const DIRECTOR_EMAIL = process.env.CACHINK_DIRECTOR_EMAIL ?? 'dir@cachink.mx';
const PASSWORD = process.env.CACHINK_CLOUD_PASSWORD ?? 'changeme';

test.describe('Cloud — role-aware Sync Streams', () => {
  test('Operativo sees only the last 90 days of ventas', async ({ page }) => {
    await page.goto(DESKTOP_URL);
    await signIn(page, OPERATIVO_EMAIL, PASSWORD);
    await page.getByTestId('tab-ventas').click();
    await expect(page.getByTestId('ventas-list')).not.toContainText('2026-01-01');
  });

  test('Director sees ventas older than 90 days', async ({ page }) => {
    await page.goto(DESKTOP_URL);
    await signIn(page, DIRECTOR_EMAIL, PASSWORD);
    await page.getByTestId('tab-ventas').click();
    await expect(page.getByTestId('ventas-list')).toContainText('2026-01-01');
  });
});

async function signIn(page: Page, email: string, pw: string): Promise<void> {
  await page.getByTestId('cloud-email-input').fill(email);
  await page.getByTestId('cloud-password-input').fill(pw);
  await page.getByTestId('cloud-submit').click();
  await page.waitForSelector('[data-testid="role-picker"]');
}
