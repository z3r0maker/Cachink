/**
 * LAN offline + replay (Slice 5 C22) — simulates a Wi-Fi drop, records
 * ventas locally, reconnects, and asserts the host sees every row
 * within 3 seconds of reconnect.
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const TABLET_URL =
  process.env.CACHINK_TABLET_A_URL ?? 'http://localhost:8081?deviceId=01HZ8XQN9GZJXV8AKQ5X0C7A01';
const DESKTOP_URL = process.env.CACHINK_DESKTOP_URL ?? 'http://localhost:1420';

test.describe('LAN sync — offline replay', () => {
  test('offline ventas replay to the host within 3 seconds of reconnect', async ({ browser }) => {
    const tablet = await browser.newContext();
    const host = await browser.newContext();
    const pageT = await tablet.newPage();
    const pageH = await host.newPage();

    await Promise.all([pageT.goto(TABLET_URL), pageH.goto(DESKTOP_URL)]);

    // Go offline on the tablet.
    await pageT.context().setOffline(true);

    await recordVenta(pageT, 100);
    await recordVenta(pageT, 200);

    // Host should not see these yet.
    await expect(pageH.getByTestId('hoy-kpi-strip')).not.toContainText('$ 300.00');

    // Reconnect.
    await pageT.context().setOffline(false);

    // After the WebSocket reconnect fires, the push queue drains.
    await expect(pageH.getByTestId('hoy-kpi-strip')).toContainText('$ 300.00', { timeout: 3000 });
  });
});

async function recordVenta(page: Page, pesos: number): Promise<void> {
  await page.getByTestId('tab-ventas').click();
  await page.getByTestId('ventas-new-cta').click();
  await page.getByTestId('nueva-venta-monto-input').fill(String(pesos));
  await page.getByTestId('nueva-venta-concepto-input').fill(`Offline ${pesos}`);
  await page.getByTestId('nueva-venta-submit').click();
}
