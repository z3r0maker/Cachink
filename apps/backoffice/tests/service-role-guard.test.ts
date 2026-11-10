import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, it } from 'vitest';

import { FORBIDDEN_NAME, scanRepo, scanText, scanTree } from '../scripts/service-role-guard';

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

  // Walks every file under apps/web — under turbo's parallel load that can
  // outlast vitest's 5s default (it timed out two gates in a row while the
  // finding was empty). The scan itself is unchanged.
  it('holds for the real apps/web today', { timeout: 60_000 }, () => {
    const portal = resolve(import.meta.dirname, '..', '..', 'web');
    assert.deepEqual(scanTree(portal), []);
  });

  // N-81: the `bug-report` edge function held the key under `supabase/`, a
  // tree the guard never looked at. Every root but the console's is guarded.
  it('guards every code root of the repository, not only the portal', () => {
    const repo = tree({
      [join('supabase', 'functions', 'x', 'index.ts')]: `Deno.env.get('${FORBIDDEN_NAME}')`,
      [join('packages', 'sync', 'src', 'a.ts')]: `// ${FORBIDDEN_NAME}`,
      [join('apps', 'mobile', 'eas.json')]: `{"${FORBIDDEN_NAME}": "x"}`,
      [join('.github', 'workflows', 'ci.yml')]: `env: ${FORBIDDEN_NAME}`,
      [join('scripts', 'release.sh')]: `echo $${FORBIDDEN_NAME}`,
    });
    assert.deepEqual(
      scanRepo(repo)
        .map((f) => f.file)
        .sort(),
      [
        join('.github', 'workflows', 'ci.yml'),
        join('apps', 'mobile', 'eas.json'),
        join('packages', 'sync', 'src', 'a.ts'),
        join('scripts', 'release.sh'),
        join('supabase', 'functions', 'x', 'index.ts'),
      ],
    );
  });

  it('leaves the console alone, where the key belongs, and the docs that say so', () => {
    const repo = tree({
      [join('apps', 'backoffice', 'src', 'server', 'admin.ts')]: FORBIDDEN_NAME,
      [join('docs', 'ops', 'provisioning.md')]: `never put ${FORBIDDEN_NAME} in the portal`,
      'ARCHITECTURE.md': FORBIDDEN_NAME,
    });
    assert.deepEqual(scanRepo(repo), []);
  });

  it('skips a guarded root that a checkout does not have, and native build output', () => {
    const repo = tree({
      [join('apps', 'mobile', 'ios', 'Pods', 'x.m')]: FORBIDDEN_NAME,
      [join('packages', 'ui', 'dist', 'a.js')]: FORBIDDEN_NAME,
    });
    assert.deepEqual(scanRepo(repo), []);
  });

  it('holds for the whole repository today', { timeout: 120_000 }, () => {
    const repo = resolve(import.meta.dirname, '..', '..', '..');
    assert.deepEqual(scanRepo(repo), []);
  });
});
