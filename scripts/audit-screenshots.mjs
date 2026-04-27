/**
 * Audit screenshots — captures the running desktop dev server (Vite at
 * http://localhost:1420) at three viewport sizes used in the M-1 audit:
 *   - iPhone 15 Pro portrait      (393 × 852)
 *   - iPad mini portrait          (744 × 1133)
 *   - iPad Pro 11" landscape      (1194 × 834)
 *
 * Output: ./audit-screenshots/<viewport>-<route>.png
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve('audit-screenshots');
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'iphone-15-pro', width: 393, height: 852 },
  { name: 'ipad-mini-portrait', width: 744, height: 1133 },
  { name: 'ipad-pro-landscape', width: 1194, height: 834 },
];

const URL = 'http://localhost:1420/';

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => console.error(`[${vp.name}] pageerror:`, err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error(`[${vp.name}] console.error:`, msg.text());
  });
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500); // settle for fonts + Tamagui mount
    await page.screenshot({
      path: `${OUT}/${vp.name}-wizard.png`,
      fullPage: false,
    });
    console.log(`✓ ${vp.name}-wizard.png`);
  } catch (err) {
    console.error(`✗ ${vp.name}: ${err.message}`);
  } finally {
    await ctx.close();
  }
}

await browser.close();
console.log(`\nScreenshots written to: ${OUT}`);
