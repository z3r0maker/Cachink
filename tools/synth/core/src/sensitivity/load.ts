import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadCorrida } from '../aggregate/load';
import { seededBug } from '../seeded/bugs';
import {
  cellOfRun,
  measure,
  recall,
  type BaselineEntry,
  type Measurement,
  type Recall,
} from './score';

/**
 * A sensitivity scoring read off disk (S-13): the clean smoke's findings as
 * the baseline, and each seeded corrida's bug (`seeded.json`, which the judge
 * never sees), runs and findings, measured against it.
 */
export interface Scored {
  readonly measurements: Measurement[];
  readonly recall: Recall;
  /** The app commit the baseline ran on: what the recall was measured against. */
  readonly appCommit: string;
}

/** The clean smoke's findings, per cell. */
export function baselineEntries(reportsDir: string, id: string): BaselineEntry[] {
  const c = loadCorrida(join(reportsDir, id), id);
  const cells = new Map(c.runs.map(({ run }) => [run.id, cellOfRun(run)]));
  return c.findings.map((f) => ({
    cell: cells.get(f.run_id) ?? '',
    category: f.category,
    key: f.dedupe_key,
  }));
}

/** The seeded bug a corrida ran under; refuses a corrida that ran under none. */
function bugOf(dir: string): ReturnType<typeof seededBug> {
  const file = join(dir, 'seeded.json');
  if (!existsSync(file)) throw new Error(`${dir}: no seeded.json, so no seeded bug to score`);
  const { id } = JSON.parse(readFileSync(file, 'utf8')) as { id: string };
  return seededBug(id);
}

export function scoreCorridas(
  reportsDir: string,
  baselineId: string,
  corridaIds: readonly string[],
): Scored {
  const baseline = baselineEntries(reportsDir, baselineId);
  const measurements = corridaIds.flatMap((id) => {
    const dir = join(reportsDir, id);
    const c = loadCorrida(dir, id);
    return measure(
      bugOf(dir),
      c.runs.map((r) => r.run),
      c.findings,
      baseline,
    );
  });
  const base = loadCorrida(join(reportsDir, baselineId), baselineId);
  return { measurements, recall: recall(measurements), appCommit: base.meta?.app_commit ?? '' };
}
