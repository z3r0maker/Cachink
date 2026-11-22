import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, it } from 'vitest';

import { appendHistory, HISTORY_HEADER, type HistoryRow } from '../src/sensitivity/history';

/**
 * `calibration/sensitivity-history.csv` (spec §9): one row per scoring, so a
 * change to the judge's prompt or model shows as a change in recall beside
 * the prompt's hash and the app commit it was measured on.
 */
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'synth-history-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const ROW: HistoryRow = {
  date: '2026-11-22',
  appCommit: 'a'.repeat(40),
  judgeModel: 'claude-opus-5-5',
  judgePrompt: 'abc123def456',
  baseline: '20261122-0001',
  corridas: ['20261122-0002', '20261122-0003'],
  recall: {
    overall: { hits: 6, of: 10, recall: 0.6 },
    byCategory: {
      bug: { hits: 4, of: 7, recall: 4 / 7 },
      friction: { hits: 1, of: 2, recall: 0.5 },
      comprehension: { hits: 1, of: 1, recall: 1 },
    },
    byRunner: { web: { hits: 5, of: 8, recall: 0.625 }, phone: { hits: 1, of: 2, recall: 0.5 } },
  },
  note: 'first run',
};

describe('appendHistory', () => {
  it('writes the header once, then one row per scoring', () => {
    const file = join(dir, 'calibration', 'sensitivity-history.csv');
    appendHistory(file, ROW);
    appendHistory(file, { ...ROW, note: 'prompt rule 5 tightened' });
    const lines = readFileSync(file, 'utf8').trimEnd().split('\n');
    assert.equal(lines[0], HISTORY_HEADER);
    assert.equal(lines.length, 3);
  });

  it('writes recall to two decimals with hits/of, and the corridas space-separated', () => {
    const file = join(dir, 'h.csv');
    appendHistory(file, ROW);
    const row = readFileSync(file, 'utf8').trimEnd().split('\n')[1] ?? '';
    assert.ok(row.startsWith(`2026-11-22,${'a'.repeat(40)},claude-opus-5-5,abc123def456,`), row);
    assert.ok(row.includes(',0.60,6/10,'), row);
    assert.ok(row.includes(',0.57,'), row);
    assert.ok(row.includes(',20261122-0002 20261122-0003,'), row);
  });

  it('leaves a category nothing measured empty, never 0', () => {
    const file = join(dir, 'h.csv');
    const none = { hits: 0, of: 0, recall: null };
    appendHistory(file, {
      ...ROW,
      recall: { ...ROW.recall, byRunner: { ...ROW.recall.byRunner, phone: none } },
    });
    const cells = (readFileSync(file, 'utf8').trimEnd().split('\n')[1] ?? '').split(',');
    const at = HISTORY_HEADER.split(',').indexOf('recall_phone');
    assert.equal(cells[at], '');
  });

  it('quotes a note with a comma in it', () => {
    const file = join(dir, 'h.csv');
    appendHistory(file, { ...ROW, note: 'judge, rule 5' });
    assert.ok(readFileSync(file, 'utf8').trimEnd().endsWith('"judge, rule 5"'));
  });
});
