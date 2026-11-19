import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, it } from 'vitest';

import { existsUnder, readTree } from '../src/cli/read-tree';

/** The CLI's disk half, against a throwaway tree. */
describe('readTree', () => {
  let root: string;
  const put = (rel: string, text = 'a: 1\n') => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'synth-tree-'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('reads config, personas at any depth, scenarios and matrices, sorted, with / paths', () => {
    put('config.yaml');
    put('personas/core/taquero.yaml');
    put('personas/pool/anti/restaurante.yml');
    put('scenarios/primera-venta.yaml');
    put('matrix/smoke.yaml');
    assert.deepEqual(
      readTree(root).map((f) => f.path),
      [
        'config.yaml',
        'matrix/smoke.yaml',
        'personas/core/taquero.yaml',
        'personas/pool/anti/restaurante.yml',
        'scenarios/primera-venta.yaml',
      ],
    );
  });

  it('skips the evidence folder, files that are not YAML, and folders it does not read', () => {
    put('config.yaml');
    put('personas/evidence/resenas.yaml');
    put('personas/core/notas.md', '# notas');
    put('reports/2026-11-19/findings.yaml');
    assert.deepEqual(
      readTree(root).map((f) => f.path),
      ['config.yaml'],
    );
  });

  it('treats a missing folder as empty, so the checker can say what is missing', () => {
    assert.deepEqual(readTree(root), []);
  });

  it('existsUnder answers for files only, relative to the root', () => {
    put('personas/evidence/resenas.md', 'L1');
    const exists = existsUnder(root);
    assert.equal(exists('personas/evidence/resenas.md'), true);
    assert.equal(exists('personas/evidence'), false, 'a folder is not evidence');
    assert.equal(exists('personas/evidence/otra.md'), false);
  });
});
