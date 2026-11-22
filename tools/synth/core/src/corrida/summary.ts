import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { interference } from './interference';
import type { Job } from './jobs';
import type { PoolResult } from './pool';
import { runRecord } from './records';

/**
 * A corrida's `pool.json` (S-11): what each job did, how long the corrida took,
 * and the interference check over the runs that finished: whether any two
 * shared what a run owns, and how many ran at once.
 */
export interface JobDone {
  readonly runId: string;
  readonly outcome: string;
  readonly success: boolean | null;
  /** The judge's findings that stood, or null when the run was not judged. */
  readonly findings: number | null;
}

function line(r: PoolResult<Job, JobDone>) {
  const cell = { persona: r.job.persona, scenario: r.job.scenario, runner: r.job.runner };
  if (r.status === 'done') return { ...cell, status: r.status, ...r.value };
  if (r.status === 'failed') return { ...cell, status: r.status, error: r.error };
  return { ...cell, status: r.status, reason: r.reason };
}

export function writePoolSummary(
  corridaDir: string,
  results: readonly PoolResult<Job, JobDone>[],
  elapsedMs: number,
) {
  const records = results.flatMap((r) =>
    r.status === 'done' ? [runRecord(join(corridaDir, 'runs', r.value.runId))] : [],
  );
  const summary = {
    elapsed_s: Math.round(elapsedMs / 1000),
    jobs: results.map(line),
    interference: interference(records),
  };
  writeFileSync(join(corridaDir, 'pool.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}
