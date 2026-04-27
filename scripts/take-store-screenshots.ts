/**
 * Store screenshot pipeline (P1F-M1 C2 / ADR-036).
 *
 * Drives Playwright against the locally-running Tauri + Expo dev servers
 * and produces six flow screenshots across four device sizes.
 * Committed artefacts land under `docs/store/screenshots/`.
 *
 * Runs as `pnpm store:screenshots` — see `docs/store/screenshots/README.md`.
 */

import { chromium, devices, type Browser, type BrowserContextOptions, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'docs/store/screenshots');
const DESKTOP_URL = process.env.CACHINK_DESKTOP_URL ?? 'http://localhost:1420';
const MOBILE_WEB_URL = process.env.CACHINK_MOBILE_WEB_URL ?? 'http://localhost:8081';

type Size = { name: string; options: BrowserContextOptions };

const DEVICE_SIZES: readonly Size[] = [
  { name: 'iphone-67', options: { viewport: { width: 1290, height: 2796 }, deviceScaleFactor: 3 } },
  { name: 'iphone-55', options: { viewport: { width: 1242, height: 2208 }, deviceScaleFactor: 3 } },
  {
    name: 'ipad-pro-129',
    options: { viewport: { width: 2048, height: 2732 }, deviceScaleFactor: 2 },
  },
  {
    name: 'android-tablet',
    options: { ...devices['Pixel 5'], viewport: { width: 1600, height: 2560 } },
  },
];

interface Flow {
  id: string;
  target: 'desktop' | 'mobile';
  role: 'operativo' | 'director';
  run: (page: Page) => Promise<void>;
}

const FLOWS: readonly Flow[] = [
  {
    id: 'operativo-nueva-venta',
    target: 'mobile',
    role: 'operativo',
    run: async (page) => {
      await page.getByTestId('tab-ventas').click();
      await page.getByTestId('ventas-new-cta').click();
      await page.waitForSelector('[data-testid="nueva-venta-modal"]');
    },
  },
  {
    id: 'operativo-ventas-list',
    target: 'mobile',
    role: 'operativo',
    run: async (page) => {
      await page.getByTestId('tab-ventas').click();
    },
  },
  {
    id: 'operativo-corte',
    target: 'mobile',
    role: 'operativo',
    run: async (page) => {
      await page.getByTestId('corte-de-dia-card').click();
      await page.waitForSelector('[data-testid="corte-de-dia-modal"]');
    },
  },
  {
    id: 'director-home',
    target: 'desktop',
    role: 'director',
    run: async (page) => {
      await page.getByTestId('role-director-select').click();
      await page.waitForSelector('[data-testid="director-home"]');
    },
  },
  {
    id: 'director-estado-resultados',
    target: 'desktop',
    role: 'director',
    run: async (page) => {
      await page.getByTestId('role-director-select').click();
      await page.getByTestId('tab-estados').click();
      await page.getByTestId('estados-tab-resultados').click();
    },
  },
  {
    id: 'director-indicadores',
    target: 'desktop',
    role: 'director',
    run: async (page) => {
      await page.getByTestId('role-director-select').click();
      await page.getByTestId('tab-estados').click();
      await page.getByTestId('estados-tab-indicadores').click();
    },
  },
];

async function shoot(browser: Browser, flow: Flow, size: Size): Promise<void> {
  const ctx = await browser.newContext(size.options);
  const page = await ctx.newPage();
  await page.goto(flow.target === 'desktop' ? DESKTOP_URL : MOBILE_WEB_URL);
  await flow.run(page);
  const out = resolve(OUT, `${flow.id}-${size.name}.png`);
  await page.screenshot({ path: out, fullPage: false });
  await ctx.close();
}

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const flow of FLOWS) {
      for (const size of DEVICE_SIZES) {
        await shoot(browser, flow, size);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`Wrote ${FLOWS.length * DEVICE_SIZES.length} screenshots to ${OUT}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
