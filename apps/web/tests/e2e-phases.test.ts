import assert from 'node:assert/strict';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, it } from 'vitest';

import { e2ePhase, projectsForPhase } from '../e2e/phases';
import { rawDirs } from '../scripts/coverage-gate/options';

/**
 * ADR-144: CI runs the portal suite as two phases on separate runners and
 * merges their coverage. A project that lands in neither phase would stop
 * running without a red test anywhere, and a shard's coverage the merge does
 * not find would read as a lower number — these hold both.
 */

const ALL = [
  { name: 'setup' },
  { name: 'desktop' },
  { name: 'dia-bisiesto' },
  { name: 'unlock' },
  { name: 'serial' },
  { name: 'sync' },
  { name: 'nuevo-sin-fase' },
];
const PARALLEL = new Set(['desktop', 'dia-bisiesto']);
const names = (ps: readonly { name: string }[]) => ps.map((p) => p.name);

describe('projectsForPhase', () => {
  it('keeps the whole suite when no phase is asked for', () => {
    assert.deepEqual(names(projectsForPhase(ALL, PARALLEL, undefined)), names(ALL));
  });

  it('gives the parallel phase its own projects and the setup they depend on', () => {
    assert.deepEqual(names(projectsForPhase(ALL, PARALLEL, 'parallel')), [
      'setup',
      'desktop',
      'dia-bisiesto',
    ]);
  });

  it('puts every other project in the serial phase, one added later included', () => {
    assert.deepEqual(names(projectsForPhase(ALL, PARALLEL, 'serial')), [
      'setup',
      'unlock',
      'serial',
      'sync',
      'nuevo-sin-fase',
    ]);
  });

  it('runs every project in exactly one phase, bar the shared setup', () => {
    const both = [
      ...projectsForPhase(ALL, PARALLEL, 'parallel'),
      ...projectsForPhase(ALL, PARALLEL, 'serial'),
    ].filter((p) => p.name !== 'setup');
    assert.deepEqual(names(both).sort(), names(ALL.filter((p) => p.name !== 'setup')).sort());
  });
});

describe('e2ePhase', () => {
  const before = process.env.XG_E2E_PHASE;
  afterEach(() => {
    if (before === undefined) delete process.env.XG_E2E_PHASE;
    else process.env.XG_E2E_PHASE = before;
  });

  it('reads either phase', () => {
    process.env.XG_E2E_PHASE = 'serial';
    assert.equal(e2ePhase(), 'serial');
    process.env.XG_E2E_PHASE = 'parallel';
    assert.equal(e2ePhase(), 'parallel');
  });

  it('is the whole suite when unset or empty', () => {
    delete process.env.XG_E2E_PHASE;
    assert.equal(e2ePhase(), undefined);
    process.env.XG_E2E_PHASE = '';
    assert.equal(e2ePhase(), undefined);
  });

  it('refuses a phase it does not know, rather than running nothing', () => {
    process.env.XG_E2E_PHASE = 'viewports';
    assert.throws(() => e2ePhase(), /must be "parallel" or "serial"/);
  });
});

describe('rawDirs', () => {
  async function coverageDir(dirs: readonly string[]): Promise<string> {
    const root = await mkdtemp(path.join(tmpdir(), 'xg-coverage-'));
    for (const dir of dirs) await mkdir(path.join(root, dir), { recursive: true });
    return root;
  }

  it('finds a local run’s own raw data', async () => {
    const root = await coverageDir(['unit/raw', 'e2e/raw']);
    assert.deepEqual(rawDirs('e2e', root), [path.join(root, 'e2e/raw')]);
  });

  it('finds every shard’s raw data, in a stable order', async () => {
    const root = await coverageDir([
      'shards/portal-coverage-raw-serial/e2e/raw',
      'shards/portal-coverage-raw-parallel-1of2/e2e/raw',
      'shards/portal-coverage-raw-parallel-1of2/unit/raw',
    ]);
    assert.deepEqual(rawDirs('e2e', root), [
      path.join(root, 'shards/portal-coverage-raw-parallel-1of2/e2e/raw'),
      path.join(root, 'shards/portal-coverage-raw-serial/e2e/raw'),
    ]);
    assert.deepEqual(rawDirs('unit', root), [
      path.join(root, 'shards/portal-coverage-raw-parallel-1of2/unit/raw'),
    ]);
  });

  it('skips a shard that has no data for the stage', async () => {
    const root = await coverageDir(['shards/portal-coverage-raw-serial/e2e/raw']);
    assert.deepEqual(rawDirs('unit', root), []);
  });

  it('is empty when no run left anything', async () => {
    const root = await coverageDir([]);
    assert.deepEqual(rawDirs('e2e', root), []);
  });
});
