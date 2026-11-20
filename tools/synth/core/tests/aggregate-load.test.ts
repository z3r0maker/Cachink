import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, it } from 'vitest';

import { corridaCells, findingKeys, loadCorrida, writeCorridaFile } from '../src/aggregate/load';
import { CorridaSchema } from '../src/schemas/corrida';
import { finding, run } from './aggregate-fixtures';

/** A corrida folder read back: `corrida.json` when there is one, every `run.json`, the judge's findings. */
const REPO = resolve(import.meta.dirname, '../../../..');

function corridaDir(reports: string, id: string, runs: ReturnType<typeof run>[]): string {
  const dir = join(reports, id);
  for (const r of runs) {
    mkdirSync(join(dir, 'runs', r.id), { recursive: true });
    writeFileSync(join(dir, 'runs', r.id, 'run.json'), JSON.stringify(r));
  }
  return dir;
}

describe('loadCorrida', () => {
  const reports = mkdtempSync(join(tmpdir(), 'synth-agg-'));
  const taq = run({
    persona: 'taquero',
    scenario: 'primera-venta',
    started_at: '2026-11-20T02:00:00.000Z',
  });

  it('reads the runs, counts console errors by error, and takes its start from the first run', () => {
    const dir = corridaDir(reports, '20261120-aaaa', [taq]);
    writeFileSync(
      join(dir, 'runs', taq.id, 'console.jsonl'),
      [
        { type: 'error', text: 'TypeError: x' },
        { type: 'error', text: '    at f (a.js:1)' },
        { type: 'log', text: 'ok' },
      ]
        .map((l) => JSON.stringify(l))
        .join('\n'),
    );
    const c = loadCorrida(dir, '20261120-aaaa');
    assert.equal(c.meta, undefined);
    assert.equal(c.started_at, taq.started_at);
    assert.equal(c.runs[0]?.consoleErrors, 1);
    assert.deepEqual(c.findings, []);
  });

  it('refuses a folder with neither corrida.json nor a run', () => {
    mkdirSync(join(reports, '20261120-bbbb'));
    assert.throws(() => loadCorrida(join(reports, '20261120-bbbb'), '20261120-bbbb'), /no run/);
  });

  it('refuses a findings.json that is not findings', () => {
    const dir = corridaDir(reports, '20261120-cccc', [taq]);
    writeFileSync(join(dir, 'findings.json'), JSON.stringify([{ id: 'nope' }]));
    assert.throws(() => loadCorrida(dir, '20261120-cccc'));
  });

  it('lists only corridas with runs, as the cells they ran', () => {
    assert.deepEqual(
      corridaCells(reports).map((c) => [c.id, c.cells]),
      [
        ['20261120-aaaa', ['taquero__primera-venta__task']],
        ['20261120-cccc', ['taquero__primera-venta__task']],
      ],
    );
  });
});

describe('writeCorridaFile', () => {
  it('records the app’s commit and whether the tree had changes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'synth-corrida-'));
    writeCorridaFile(dir, { id: '20261120-dddd', mode: 'single', repetitions: 1 }, REPO);
    const c = CorridaSchema.parse(JSON.parse(readFileSync(join(dir, 'corrida.json'), 'utf8')));
    assert.match(c.app_commit, /^[0-9a-f]{40}$/);
    assert.equal(typeof c.app_dirty, 'boolean');
    // `git status` over this repo and its worktrees takes seconds while every package's tests run
    // at once in the pre-push hook; 5 s timed out there.
  }, 30_000);
});

describe('findingKeys', () => {
  it('keeps real findings with evidence, not agent failures or evidence-less ones', () => {
    const id = 'taquero__primera-venta__task__r1';
    const none = { steps: [], screenshots: [], console: [], network: [] };
    assert.deepEqual(
      findingKeys([
        finding({ run_id: id, dedupe_key: 'a/b/c' }),
        finding({ run_id: id, dedupe_key: 'a/b/d', category: 'agent_failure' }),
        finding({ run_id: id, dedupe_key: 'a/b/e', evidence: none }),
      ]),
      ['a/b/c'],
    );
  });
});

describe('CorridaSchema', () => {
  const ok = {
    id: '20261120-1a14',
    started_at: '2026-11-20T01:00:00.000Z',
    mode: 'smoke',
    repetitions: 3,
    app_commit: 'abcdef0123456789abcdef0123456789abcdef01',
    app_dirty: false,
  };
  it('accepts a corrida record', () => assert.ok(CorridaSchema.safeParse(ok).success));
  it('refuses a short commit', () =>
    assert.ok(!CorridaSchema.safeParse({ ...ok, app_commit: 'abcdef0' }).success));
  it('refuses an id that is not a corrida folder name', () =>
    assert.ok(!CorridaSchema.safeParse({ ...ok, id: 'corrida-1' }).success));
  it('refuses a mode no matrix has', () =>
    assert.ok(!CorridaSchema.safeParse({ ...ok, mode: 'nightly' }).success));
});
