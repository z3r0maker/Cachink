/**
 * storybook-smoke — assert that the built stories actually render.
 *
 * `build-storybook` exits 0 whether the stories work or not. It compiles the
 * preview; it never mounts a story. In September 2026 that gap hid a total
 * failure: 46 story families, a green build, and every single story throwing
 * React error #130 at runtime. Nothing in CI could have noticed.
 *
 * This walks the built `index.json`, mounts one story per component family in
 * headless Chromium, and fails on the first that renders Storybook's error
 * display or logs a page error. One family per component keeps it to a few
 * seconds while still covering every module graph in the package.
 *
 * Usage:
 *   pnpm --filter @cachink/ui build-storybook
 *   pnpm storybook:smoke [storybook-static-dir]
 */

import { readFileSync, existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join, extname } from 'node:path';
import { chromium, type Browser } from 'playwright';

const PORT = 6019;
const MIME: Readonly<Record<string, string>> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

interface StoryEntry {
  readonly id: string;
  readonly type?: string;
  readonly title?: string;
}

/** One representative story per component family. */
function pickFamilies(root: string): readonly string[] {
  const index = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8')) as {
    entries: Record<string, StoryEntry>;
  };
  const seen = new Set<string>();
  const picked: string[] = [];
  for (const [id, entry] of Object.entries(index.entries)) {
    if ((entry.type ?? 'story') !== 'story') continue;
    const family = id.split('--')[0] ?? id;
    if (seen.has(family)) continue;
    seen.add(family);
    picked.push(id);
  }
  return picked;
}

function serve(root: string): Server {
  return createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/';
    const file = join(root, path === '/' ? 'index.html' : path);
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  }).listen(PORT);
}

async function checkStory(browser: Browser, id: string): Promise<string | null> {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(`http://localhost:${PORT}/iframe.html?id=${id}`, {
      waitUntil: 'networkidle',
      timeout: 20_000,
    });
    const broken = await page.evaluate(() =>
      document.body.classList.contains('sb-show-errordisplay'),
    );
    if (broken) return errors[0] ?? 'Storybook rendered its error display';
    const empty = await page.evaluate(
      () => (document.querySelector('#storybook-root')?.innerHTML ?? '').trim() === '',
    );
    if (empty) return 'story mounted nothing';
    return errors.length > 0 ? (errors[0] ?? null) : null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const root = process.argv[2] ?? 'packages/ui/storybook-static';
  if (!existsSync(join(root, 'index.json'))) {
    console.error(`storybook-smoke: no build at ${root}. Run build-storybook first.`);
    process.exitCode = 1;
    return;
  }

  const families = pickFamilies(root);
  const server = serve(root);
  const browser = await chromium.launch();
  const failures: Array<{ id: string; reason: string }> = [];

  try {
    for (const id of families) {
      const reason = await checkStory(browser, id);
      if (reason !== null) failures.push({ id, reason });
    }
  } finally {
    await browser.close();
    server.close();
  }

  const passed = families.length - failures.length;
  console.log(`storybook-smoke: ${passed}/${families.length} component families rendered.`);
  if (failures.length > 0) {
    console.error('\nFAILED:');
    for (const f of failures) console.error(`  ${f.id}\n    ${f.reason.slice(0, 200)}`);
    process.exitCode = 1;
  }
}

await main();
