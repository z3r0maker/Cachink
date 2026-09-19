/**
 * O-02 spike — SQLite-WASM persisted in OPFS running the real
 * `@xangarro/data` stack, in Chromium AND WebKit (ADR-071 §4). The entry
 * (migrations, a repository round-trip, the change-log trigger, OPFS
 * persistence) is bundled by `build.mjs` with the sql.js WASM inlined —
 * one self-contained file whose size is the measured bundle cost. WebKit
 * runs in a persistent context: headless WebKit's OPFS storage process
 * needs a real data directory, not an ephemeral profile. If the Drizzle
 * driver does not run on WASM, this fails and the track stops to ask the
 * owner before any fallback.
 */

import { expect, test, webkit, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildSpike } from './spikes/sqlite-wasm-opfs/build.mjs';

const HTML = `<!doctype html><meta charset="utf-8"><title>boot</title><script src="/spike.js"></script>`;
let bundlePath: string;

type SpikeResults = Record<string, { ok: boolean; detail?: string }>;

async function runSpike(page: Page, fresh: boolean): Promise<SpikeResults> {
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).pathname === '/spike.js') {
      void route.fulfill({
        contentType: 'application/javascript',
        body: readFileSync(bundlePath),
      });
      return;
    }
    void route.fulfill({ contentType: 'text/html', body: HTML });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(fresh ? 'http://localhost/spike.html?fresh=1' : 'http://localhost/spike.html');
  await expect
    .poll(async () => page.title(), { timeout: 30_000, message: errors.join(' | ') || 'boot' })
    .toBe('done');
  return page.evaluate(() => window.__spike!.results);
}

/** Every stage the spike proves, on one run. */
function expectAllGreen(results: SpikeResults, prefix = ''): void {
  for (const stage of ['migrations', 'roundtrip', 'changeLog', 'opfs'] as const) {
    const r = results[stage];
    expect(r?.ok, `${prefix}${stage}: ${r?.detail}`).toBe(true);
  }
}

/** One fresh-then-reload cycle, asserting every stage. */
async function assertCycle(page: Page): Promise<void> {
  expectAllGreen(await runSpike(page, true));
  expectAllGreen(await runSpike(page, false), 'after reload — ');
}

test.beforeAll(async () => {
  bundlePath = await buildSpike();
});

test('chromium: sqlite-wasm + OPFS + drizzle migrations + repository + change-log', async ({
  browser,
}) => {
  const context: BrowserContext = await browser.newContext();
  const page = await context.newPage();
  await assertCycle(page);
  await context.close();
});

test('webkit: sqlite-wasm + OPFS + drizzle migrations + repository + change-log', async () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'wk-opfs-'));
  const context = await webkit.launchPersistentContext(dataDir, {});
  const page = context.pages()[0] ?? (await context.newPage());
  await assertCycle(page);
  await context.close();
});

test('bundle cost is measured and recorded', () => {
  const bytes = statSync(bundlePath).size;
   
  console.log(`[O-02 spike] self-contained bundle: ${(bytes / 1024).toFixed(0)} KiB`);
  expect(bytes).toBeGreaterThan(0);
});
