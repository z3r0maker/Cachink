import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, it } from 'vitest';

import { budgetLeftCents, spentOnDayCents } from '../src/corrida/spend';
import { CONFIG } from './fixtures';
import { run } from './aggregate-fixtures';

/**
 * Owner decision 6's caps, enforced across corridas (S-11): what the day
 * already spent is read back from every corrida's runs and judge records, so
 * a second corrida on the same day starts with what the first left.
 */
let reports: string;
beforeEach(() => {
  reports = mkdtempSync(join(tmpdir(), 'synth-spend-'));
});
afterEach(() => rmSync(reports, { recursive: true, force: true }));

function corrida(id: string, startedAt: string, runs: number[], judged: number[] = []) {
  const dir = join(reports, id);
  runs.forEach((cents, i) => {
    const r = run({ persona: 'taquero', scenario: 'primera-venta', repetition: i + 1 });
    mkdirSync(join(dir, 'runs', r.id), { recursive: true });
    writeFileSync(
      join(dir, 'runs', r.id, 'run.json'),
      JSON.stringify({ ...r, estimated_cost_usd_cents: cents }),
    );
    const judge = judged[i];
    if (judge !== undefined) {
      mkdirSync(join(dir, 'judge', r.id), { recursive: true });
      writeFileSync(
        join(dir, 'judge', r.id, 'judge.json'),
        JSON.stringify({ estimated_cost_usd_cents: judge }),
      );
    }
  });
  writeFileSync(join(dir, 'corrida.json'), JSON.stringify({ id, started_at: startedAt }));
}

describe('spentOnDayCents', () => {
  it('sums the day’s runs and judges across corridas', () => {
    corrida('a', '2026-11-21T10:00:00.000Z', [30, 40], [100]);
    corrida('b', '2026-11-21T15:00:00.000Z', [25]);
    assert.equal(spentOnDayCents(reports, '2026-11-21'), 195);
  });

  it('leaves out another day’s corridas', () => {
    corrida('old', '2026-11-20T23:00:00.000Z', [500]);
    corrida('new', '2026-11-21T01:00:00.000Z', [10]);
    assert.equal(spentOnDayCents(reports, '2026-11-21'), 10);
  });

  it('skips a folder that is not a corrida, and a run that never wrote run.json', () => {
    mkdirSync(join(reports, '.stacks'));
    mkdirSync(join(reports, 'x', 'runs', 'half'), { recursive: true });
    writeFileSync(
      join(reports, 'x', 'corrida.json'),
      JSON.stringify({ id: 'x', started_at: '2026-11-21T09:00:00.000Z' }),
    );
    assert.equal(spentOnDayCents(reports, '2026-11-21'), 0);
  });
});

describe('budgetLeftCents', () => {
  it('is the smaller of what the corrida and the day still allow', () => {
    const caps = CONFIG.estimated_cost_caps; // 2000 per corrida, 5000 per day
    assert.equal(budgetLeftCents(caps, { corrida: 500, dayBefore: 1000 }), 1500);
    assert.equal(budgetLeftCents(caps, { corrida: 500, dayBefore: 4000 }), 500);
  });

  it('never goes below zero', () => {
    assert.equal(budgetLeftCents(CONFIG.estimated_cost_caps, { corrida: 2500, dayBefore: 0 }), 0);
  });
});
