/**
 * Lighthouse over every indexable route of the built site (L-08). The URL
 * list comes from the route manifest, like the sitemap, so a new page is
 * audited the day it ships. SEO, accessibility and best practices are floors
 * that fail the run; performance only warns, because a shared CI runner's
 * timings are too noisy to gate on.
 *
 * Run after the build:  pnpm --filter @xangarro/landing lighthouse
 * Reports (HTML + JSON per page) land in .lighthouseci/reports/.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES } from '../src/routes.js';
import { indexable } from './crawler-files.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Minimum category scores (0–1). Raise them as the site improves; never lower one to pass. */
const FLOORS = {
  seo: 1,
  accessibility: 0.98,
  'best-practices': 1,
  performance: 0.9,
};

const config = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: indexable(ROUTES).map((r) => r.path),
      numberOfRuns: 1,
      // Ubuntu runners restrict the user namespaces Chrome's sandbox needs.
      settings: process.env.CI ? { chromeFlags: '--no-sandbox' } : {},
    },
    assert: {
      assertions: Object.fromEntries(
        Object.entries(FLOORS).map(([category, minScore]) => [
          `categories:${category}`,
          [category === 'performance' ? 'warn' : 'error', { minScore }],
        ]),
      ),
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci/reports' },
  },
};

const configPath = resolve(root, '.lighthouseci/lighthouserc.json');
mkdirSync(dirname(configPath), { recursive: true });
writeFileSync(configPath, JSON.stringify(config, null, 2));

const run = spawnSync('lhci', ['autorun', `--config=${configPath}`], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(run.status ?? 1);
