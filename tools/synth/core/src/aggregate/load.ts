import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { bugCandidates } from '../judge/candidates';
import { CorridaSchema, type Corrida } from '../schemas/corrida';
import { FindingSchema, hasEvidence, type Finding } from '../schemas/finding';
import { RunSchema, type Run } from '../schemas/run';
import { cellOf, type CorridaCells } from './metrics';

/**
 * A corrida folder read back (S-09): its `corrida.json` when it has one, every
 * run's `run.json` with its console errors counted, and the judge's
 * `findings.json`. A corrida from before S-09 has no `corrida.json`; it still
 * aggregates, and its start is its first run's.
 */
export interface LoadedCorrida {
  readonly id: string;
  readonly started_at: string;
  readonly meta: Corrida | undefined;
  readonly runs: { readonly run: Run; readonly consoleErrors: number }[];
  readonly findings: Finding[];
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8')) as unknown;

/** Every run folder under `runs/` that holds a `run.json`. */
function runFolders(dir: string): string[] {
  const runs = join(dir, 'runs');
  if (!existsSync(runs)) return [];
  return readdirSync(runs)
    .map((n) => join(runs, n))
    .filter((d) => existsSync(join(d, 'run.json')))
    .sort();
}

export function loadCorrida(dir: string, id: string): LoadedCorrida {
  const metaPath = join(dir, 'corrida.json');
  const meta = existsSync(metaPath) ? CorridaSchema.parse(readJson(metaPath)) : undefined;
  const runs = runFolders(dir).map((d) => {
    const consolePath = join(d, 'console.jsonl');
    const consoleText = existsSync(consolePath) ? readFileSync(consolePath, 'utf8') : '';
    return {
      run: RunSchema.parse(readJson(join(d, 'run.json'))),
      consoleErrors: bugCandidates(consoleText, '').length,
    };
  });
  const findingsPath = join(dir, 'findings.json');
  const findings = existsSync(findingsPath)
    ? FindingSchema.array().parse(readJson(findingsPath))
    : [];
  const first = runs.map((r) => r.run.started_at).sort()[0];
  const started_at = meta?.started_at ?? first;
  if (started_at === undefined) throw new Error(`${dir} has no corrida.json and no run`);
  return { id, started_at, meta, runs, findings };
}

/** Each corrida under `reportsDir` with at least one run, as the cells it ran. */
export function corridaCells(reportsDir: string): CorridaCells[] {
  return readdirSync(reportsDir)
    .filter((n) => /^\d{8}-[0-9a-f]{4}$/.test(n))
    .flatMap((id) => {
      const folders = runFolders(join(reportsDir, id));
      if (folders.length === 0) return [];
      const runs = folders.map((d) => RunSchema.parse(readJson(join(d, 'run.json'))));
      const meta = join(reportsDir, id, 'corrida.json');
      const started =
        (existsSync(meta) ? CorridaSchema.parse(readJson(meta)).started_at : undefined) ??
        (runs.map((r) => r.started_at).sort()[0] as string);
      return [{ id, started_at: started, cells: [...new Set(runs.map(cellOf))] }];
    });
}

/** The dedupe keys a corrida's findings stand on: real findings with evidence only. */
export const findingKeys = (findings: readonly Finding[]): string[] => [
  ...new Set(
    findings
      .filter((f) => f.category !== 'agent_failure' && hasEvidence(f))
      .map((f) => f.dedupe_key),
  ),
];

/** `corrida.json`, written when a corrida starts: the app's commit and how it was run. */
export function writeCorridaFile(
  dir: string,
  c: Pick<Corrida, 'id' | 'mode' | 'repetitions'>,
  repo: string,
): void {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo }).toString().trim();
  const corrida: Corrida = CorridaSchema.parse({
    ...c,
    started_at: new Date().toISOString(),
    app_commit: git('rev-parse', 'HEAD'),
    app_dirty: git('status', '--porcelain') !== '',
  });
  writeFileSync(join(dir, 'corrida.json'), `${JSON.stringify(corrida, null, 2)}\n`);
}
