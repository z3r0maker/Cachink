/**
 * LAN sync — 3-device simultaneous-venta consistency (Slice 5 C21).
 *
 * Orchestrates one "host" (desktop Tauri app under test) and two Expo
 * web clients against loopback. Each client uses a distinct `deviceId`
 * via the `CACHINK_DEVICE_ID` env override so LWW tiebreaks are
 * deterministic.
 *
 * Prereqs (documented in docs/launch-checklist.md):
 *   - `pnpm --filter @cachink/desktop tauri dev` running in another
 *     terminal; LAN server started from the wizard (`lan_server_start`
 *     Tauri command) with its pairing token exposed via env.
 *   - `pnpm --filter @cachink/mobile web` serving two browser tabs
 *     pointed at `http://localhost:8081?deviceId=<ulid>`.
 *
 * The spec is deliberately light on fixtures — full end-to-end
 * validation happens on real devices during P1D-M5 manual QA.
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const TABLET_A_URL =
  process.env.CACHINK_TABLET_A_URL ?? 'http://localhost:8081?deviceId=01HZ8XQN9GZJXV8AKQ5X0C7A01';
const TABLET_B_URL =
  process.env.CACHINK_TABLET_B_URL ?? 'http://localhost:8082?deviceId=01HZ8XQN9GZJXV8AKQ5X0C7A02';
const DESKTOP_URL = process.env.CACHINK_DESKTOP_URL ?? 'http://localhost:1420';

test.describe('LAN sync — 3-device ventas convergence', () => {
  test('all three devices see the same total within 2 seconds', async ({ browser }) => {
    const host = await browser.newContext();
    const a = await browser.newContext();
    const b = await browser.newContext();
    const pageHost = await host.newPage();
    const pageA = await a.newPage();
    const pageB = await b.newPage();

    await Promise.all([
      pageHost.goto(DESKTOP_URL),
      pageA.goto(TABLET_A_URL),
      pageB.goto(TABLET_B_URL),
    ]);

    // Each device records a venta for $450 almost simultaneously.
    await Promise.all([
      registrarVenta(pageHost, 45000),
      registrarVenta(pageA, 45000),
      registrarVenta(pageB, 45000),
    ]);

    // Totals should converge to $1,350 on every device within 2 seconds.
    const expected = '$ 1,350.00';
    await expect(pageHost.getByTestId('hoy-kpi-strip')).toContainText(expected, { timeout: 2000 });
    await expect(pageA.getByTestId('hoy-kpi-strip')).toContainText(expected, { timeout: 2000 });
    await expect(pageB.getByTestId('hoy-kpi-strip')).toContainText(expected, { timeout: 2000 });
  });
});

async function registrarVenta(page: Page, centavos: number): Promise<void> {
  await page.getByTestId('tab-ventas').click();
  await page.getByTestId('ventas-new-cta').click();
  await page.getByTestId('nueva-venta-monto-input').fill(String(centavos / 100));
  await page.getByTestId('nueva-venta-concepto-input').fill('E2E venta');
  await page.getByTestId('nueva-venta-submit').click();
}
