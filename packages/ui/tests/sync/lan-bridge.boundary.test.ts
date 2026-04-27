// @vitest-environment node
/**
 * Lint-style boundary test — asserts that nothing under `packages/ui/src/**`
 * contains a STATIC import of `@cachink/sync-lan`. Only the dynamic
 * `import('@cachink/sync-lan')` form is allowed so Local-standalone and
 * Cloud bundles never include the LAN sync code (CLAUDE.md §7 / ADR-029).
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

describe('UI layer — no static imports of @cachink/sync-lan', () => {
  it('passes for every file under packages/ui/src/**', async () => {
    const files: string[] = [];
    await walk(UI_SRC, files);
    const offenders: string[] = [];
    for (const file of files) {
      const src = await readFile(file, 'utf-8');
      for (const line of src.split('\n')) {
        if (line.trim().startsWith('//')) continue;
        if (/import\s*\(\s*['"]@cachink\/sync-lan/.test(line)) continue;
        if (/import\s+type\s/.test(line) && /@cachink\/sync-lan/.test(line)) continue;
        if (/from\s+['"]@cachink\/sync-lan/.test(line)) {
          offenders.push(`${file}:${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
