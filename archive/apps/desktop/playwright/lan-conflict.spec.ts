/**
 * LAN conflict-determinism E2E (Slice 5 C22) — same product stock
 * edited on two tablets while one is offline; on reconnect the
 * lex-smaller `device_id` wins per ADR-029.
 */

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const TABLET_A_URL =
  process.env.CACHINK_TABLET_A_URL ?? 'http://localhost:8081?deviceId=01HZ8XQN9GZJXV8AKQ5X0C7A01';
const TABLET_B_URL =
  process.env.CACHINK_TABLET_B_URL ?? 'http://localhost:8082?deviceId=01HZ8XQN9GZJXV8AKQ5X0C7A02';

test.describe('LAN sync — deterministic conflict resolution', () => {
  test('lex-smaller device_id wins on identical updated_at', async ({ browser }) => {
    const a = await browser.newContext();
    const b = await browser.newContext();
    const pageA = await a.newPage();
    const pageB = await b.newPage();

    await Promise.all([pageA.goto(TABLET_A_URL), pageB.goto(TABLET_B_URL)]);

    // Both tablets open the same producto stock form and type different
    // umbrales within the same real-time second. LAN sync needs to
    // converge on the one written by DEV_A (lex-smaller).
    await Promise.all([setStockUmbral(pageA, 5), setStockUmbral(pageB, 9)]);

    // Let the WS fan-out + pull apply.
    await pageA.waitForTimeout(2000);

    // Both devices should now show umbral = 5 (DEV_A = ...A01; DEV_B = ...A02).
    await expect(pageA.getByTestId('product-row-umbral')).toContainText('5', { timeout: 2000 });
    await expect(pageB.getByTestId('product-row-umbral')).toContainText('5', { timeout: 2000 });
  });
});

async function setStockUmbral(page: Page, n: number): Promise<void> {
  await page.getByTestId('tab-inventario').click();
  await page.getByTestId('product-row-edit').first().click();
  await page.getByTestId('editar-producto-umbral').fill(String(n));
  await page.getByTestId('editar-producto-submit').click();
}
