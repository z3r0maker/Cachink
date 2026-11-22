import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { RunSchema } from '../schemas/run';
import type { RunRecord } from './interference';

/**
 * What a finished run held, read back from its folder (S-11): its span from
 * `run.json`, its tenant from `access.json` (null for a signup run, which had
 * none when it started), and on the web what `runner.json` says its browser
 * held. A phone run writes no `runner.json`: it has no browser.
 */
const json = (path: string): Record<string, unknown> | null =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>) : null;

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);

export function runRecord(runDir: string): RunRecord {
  const raw = json(join(runDir, 'run.json'));
  if (raw === null) throw new Error(`${runDir}: no run.json`);
  const run = RunSchema.parse(raw);
  const access = json(join(runDir, 'access.json'));
  const held = json(join(runDir, 'runner.json'));
  return {
    id: run.id,
    runner: run.runner,
    started_at: run.started_at,
    ended_at: new Date(Date.parse(run.started_at) + run.duration_ms).toISOString(),
    biz: str(access?.biz),
    cdp_port: num(held?.cdp_port),
    address: str(held?.address),
    profile: str(held?.profile),
  };
}
