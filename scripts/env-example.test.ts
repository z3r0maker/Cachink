/**
 * Every environment variable an app reads is in its `.env.example`, and
 * nothing in `.env.example` is dead (B-01). The examples are what the owner
 * copies into Vercel, so a key missing there is a production outage waiting
 * for the first request that needs it.
 *
 * Reads are found in each app's own `src/`, `scripts/` and `next.config.mjs`:
 * `process.env.X`, `process.env['X']`, `env.X`, `required('X')`,
 * `envValue(env, 'X')`. Workspace packages that read variables on an app's
 * behalf are listed in HELPERS by the function the app calls; their keys are
 * scanned from the helper's own file, so they cannot drift either — and a new
 * env-reading package file fails the last test until it is listed.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, it } from 'vitest';

const REPO = resolve(import.meta.dirname, '..');
const KEY = '([A-Z][A-Z0-9_]*)';
const PATTERNS = [
  new RegExp(`process\\.env\\.${KEY}`, 'g'),
  new RegExp(`process\\.env\\[['"]${KEY}['"]\\]`, 'g'),
  new RegExp(`\\benv\\.${KEY}`, 'g'),
  new RegExp(`\\brequired\\(\\s*['"]${KEY}['"]`, 'g'),
  new RegExp(`\\benvValue\\(\\s*\\w+\\s*,\\s*['"]${KEY}['"]`, 'g'),
];

/**
 * Set by the platform or the test harness, never by the operator.
 * `PORTAL_TODAY` pins the business clock for the E2E suite (server/clock.ts);
 * it must never be set in production, so it stays out of the example.
 */
const PLATFORM = new Set([
  'NODE_ENV',
  'NEXT_RUNTIME',
  'VERCEL_ENV',
  'NEXT_DIST_DIR',
  'CI',
  'PORT',
  'PORTAL_TODAY',
]);

/** Package functions that read the environment for the app that calls them. */
const HELPERS: Readonly<Record<string, string>> = {
  emailSenderFromEnv: 'packages/email/src/adapters/from-env.ts',
  readCfdiMode: 'packages/application/src/cfdi/cfdi-mode.ts',
  readFacturapiConfig: 'packages/application/src/cfdi/adapters/facturapi/facturapi-config.ts',
  readCfdiIssuerConfig: 'packages/application/src/cfdi/issuer-config.ts',
};
/** Package files that read the environment for no deployed app. */
const NOT_DEPLOYED = new Set(['packages/contracts/src/mock/cli.ts']);

function sources(dir: string): string[] {
  if (!existsSync(dir)) return [];
  if (statSync(dir).isFile()) return [dir];
  return readdirSync(dir)
    .flatMap((name) =>
      name === 'node_modules' || name.startsWith('.') ? [] : sources(join(dir, name)),
    )
    .filter((f) => /\.(ts|tsx|mjs|js)$/.test(f) && !/\.test\.tsx?$/.test(f));
}

function keysIn(text: string): Set<string> {
  const keys = new Set<string>();
  for (const pattern of PATTERNS) for (const m of text.matchAll(pattern)) if (m[1]) keys.add(m[1]);
  return keys;
}

function keysRead(app: string): Set<string> {
  const files = ['src', 'scripts', 'next.config.mjs'].flatMap((p) => sources(join(REPO, app, p)));
  const keys = new Set<string>();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const k of keysIn(text)) keys.add(k);
    for (const [fn, helper] of Object.entries(HELPERS)) {
      if (new RegExp(`\\b${fn}\\(`).test(text)) {
        for (const k of keysIn(readFileSync(join(REPO, helper), 'utf8'))) keys.add(k);
      }
    }
  }
  return new Set([...keys].filter((k) => !PLATFORM.has(k)));
}

function exampleEntries(app: string): Map<string, string> {
  const text = readFileSync(join(REPO, app, '.env.example'), 'utf8');
  const entries = new Map<string, string>();
  for (const m of text.matchAll(/^([A-Z][A-Z0-9_]*)=(.*)$/gm)) entries.set(m[1] ?? '', m[2] ?? '');
  return entries;
}

describe.each(['apps/portal', 'apps/admin'])('%s/.env.example', (app) => {
  it('lists every variable the app reads', () => {
    const listed = exampleEntries(app);
    const missing = [...keysRead(app)].filter((k) => !listed.has(k)).sort();
    assert.deepEqual(missing, [], `add to ${app}/.env.example`);
  });

  it('lists nothing the app does not read', () => {
    const read = keysRead(app);
    const stale = [...exampleEntries(app).keys()].filter((k) => !read.has(k)).sort();
    assert.deepEqual(stale, [], `remove from ${app}/.env.example, or the read was not detected`);
  });

  it('carries no values', () => {
    const filled = [...exampleEntries(app)].filter(([, v]) => v.trim() !== '').map(([k]) => k);
    assert.deepEqual(filled, []);
  });
});

/** `src/` of every workspace package the two apps depend on. */
function deployedPackageSources(): string[] {
  const dirs = new Set<string>();
  for (const app of ['apps/portal', 'apps/admin']) {
    const pkg = JSON.parse(readFileSync(join(REPO, app, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    for (const name of Object.keys(pkg.dependencies ?? {})) {
      if (name.startsWith('@xangarro/')) dirs.add(join(REPO, 'packages', name.slice(10), 'src'));
    }
  }
  return [...dirs].flatMap(sources);
}

describe('env-reading package code the apps ship', () => {
  it('is either a listed helper or not deployed', () => {
    const files = deployedPackageSources();
    const readers = files
      .filter((f) => keysIn(readFileSync(f, 'utf8')).size > 0)
      .map((f) => relative(REPO, f));
    const known = new Set([...Object.values(HELPERS), ...NOT_DEPLOYED]);
    assert.deepEqual(readers.filter((f) => !known.has(f)).sort(), []);
  });
});
