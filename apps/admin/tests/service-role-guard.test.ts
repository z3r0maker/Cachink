import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, it } from 'vitest';

import { FORBIDDEN_NAME, scanText, scanTree } from '../scripts/service-role-guard';

const dirs: string[] = [];

function tree(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), 'guard-'));
  dirs.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('service-role guard', () => {
  it('passes a tree that never names the key', () => {
    const root = tree({ 'src/db.ts': 'process.env.DATABASE_URL', '.env.example': 'SUPABASE_URL=' });
    assert.deepEqual(scanTree(root), []);
  });

  it('flags a reference in source, with its line', () => {
    const src = `const a = 1;\nconst k = process.env.${FORBIDDEN_NAME};\n`;
    assert.deepEqual(scanText('src/x.ts', src), [{ file: 'src/x.ts', line: 2 }]);
  });

  it('flags env files and comments too, not only code', () => {
    const root = tree({
      '.env.local': `${FORBIDDEN_NAME}=eyJ...`,
      'src/a.ts': `// never read ${FORBIDDEN_NAME} here`,
    });
    const files = scanTree(root).map((f) => f.file);
    assert.deepEqual([...files].sort(), ['.env.local', join('src', 'a.ts')].sort());
  });

  it('ignores node_modules and build output, which are not ours to fix', () => {
    const root = tree({
      [join('node_modules', 'pkg', 'index.js')]: FORBIDDEN_NAME,
      [join('.next', 'server', 'chunk.js')]: FORBIDDEN_NAME,
    });
    assert.deepEqual(scanTree(root), []);
  });

  it('holds for the real apps/portal today', () => {
    const portal = resolve(import.meta.dirname, '..', '..', 'portal');
    assert.deepEqual(scanTree(portal), []);
  });
});
