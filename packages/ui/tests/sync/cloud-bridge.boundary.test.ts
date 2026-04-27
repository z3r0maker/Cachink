// @vitest-environment node
/**
 * Lint-style boundary test — asserts that nothing under `packages/ui/src/**`
 * contains a STATIC import of `@cachink/sync-cloud`. Only the dynamic
 * `import('@cachink/sync-cloud')` form is allowed so Local-standalone
 * and LAN bundles never include the Cloud sync code (CLAUDE.md §7 /
 * ADR-035 / Round 3 F3).
 *
 * Mirrors `lan-bridge.boundary.test.ts`. The LAN package already had a
 * boundary spec; Round 3 added this one because a future mistake (e.g.
 * someone adding `import { something } from '@cachink/sync-cloud'` to a
 * UI file) would silently bloat the bundle for every Local /
 * tablet-only / LAN user.
 *
 * Runs in the node env (not jsdom) because it walks the filesystem via
 * `fs/promises` — jsdom externalises node:* modules.
 */

import { describe, expect, it } from 'vitest';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const UI_SRC = resolve(here, '../../src');

async function walk(dir: string, out: string[]): Promise<void> {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) {
      await walk(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
}

describe('UI layer — no static imports of @cachink/sync-cloud', () => {
  it('passes for every file under packages/ui/src/**', async () => {
    const files: string[] = [];
    await walk(UI_SRC, files);
    const offenders: string[] = [];
    for (const file of files) {
      const src = await readFile(file, 'utf-8');
      for (const line of src.split('\n')) {
        if (line.trim().startsWith('//')) continue;
        if (/import\s*\(\s*['"]@cachink\/sync-cloud/.test(line)) continue;
        if (/import\s+type\s/.test(line) && /@cachink\/sync-cloud/.test(line)) continue;
        if (/from\s+['"]@cachink\/sync-cloud/.test(line)) {
          offenders.push(`${file}:${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
