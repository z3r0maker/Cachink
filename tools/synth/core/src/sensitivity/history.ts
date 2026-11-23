import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import type { Recall, Tally } from './score';

/**
 * `calibration/sensitivity-history.csv` (spec §9): one row per scoring, with
 * the judge's model and a hash of its prompt beside the app commit measured,
 * so each prompt change shows as a change in recall.
 */
export interface HistoryRow {
  readonly date: string;
  readonly appCommit: string;
  readonly judgeModel: string;
  /** The first 12 hex of `prompts/judge.md`'s sha256. */
  readonly judgePrompt: string;
  readonly baseline: string;
  readonly corridas: readonly string[];
  readonly recall: Recall;
  readonly note: string;
}

export const HISTORY_HEADER = [
  'date',
  'app_commit',
  'judge_model',
  'judge_prompt',
  'baseline',
  'corridas',
  'recall',
  'hits',
  'recall_bug',
  'recall_friction',
  'recall_comprehension',
  'recall_web',
  'recall_phone',
  'note',
].join(',');

const two = (t: Tally): string => (t.recall === null ? '' : t.recall.toFixed(2));

/** A CSV cell: quoted when it holds a comma, a quote or a line break. */
const cell = (s: string): string => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function historyLine(r: HistoryRow): string {
  const { overall, byCategory, byRunner } = r.recall;
  return [
    r.date,
    r.appCommit,
    r.judgeModel,
    r.judgePrompt,
    r.baseline,
    r.corridas.join(' '),
    two(overall),
    `${overall.hits}/${overall.of}`,
    two(byCategory.bug),
    two(byCategory.friction),
    two(byCategory.comprehension),
    two(byRunner.web),
    two(byRunner.phone),
    cell(r.note),
  ].join(',');
}

export function appendHistory(file: string, row: HistoryRow): void {
  mkdirSync(dirname(file), { recursive: true });
  const head = existsSync(file) ? '' : `${HISTORY_HEADER}\n`;
  appendFileSync(file, `${head}${historyLine(row)}\n`);
}
