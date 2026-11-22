import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { aggregateCorrida } from '../aggregate/aggregate-corrida';
import { writeCorridaFile } from '../aggregate/load';
import { entry, loadCatalogue, type Catalogue } from '../corrida/catalogue';
import { corridaJobs, type Job } from '../corrida/jobs';
import { runPool } from '../corrida/pool';
import { mcpCliPath, runJob, useStackDatabases, type JobPlace } from '../corrida/run-job';
import { budgetLeftCents, corridaSpentCents, spentOnDayCents } from '../corrida/spend';
import { writePoolSummary, type JobDone } from '../corrida/summary';
import { judgeOne, judgeSummary, judgeTemplate } from '../judge/judge-one';
import { holdsMaestroLock, rerunUnderMaestroLock } from '../phone/lock';
import { nodeStackDeps } from '../stack/adapters';
import { reportsDir } from '../stack/names';
import { tearDownOnSignals } from '../stack/signals';
import { startStack } from '../stack/stack';

/**
 * `pnpm --filter @xangarro/synth-core corrida --matrix <name>` (S-11): a whole
 * corrida. One stack, the matrix's runs through the pool (web and phone side
 * by side, each lane at its `concurrency`), each run judged as it ends, then
 * `aggregate`. No run starts once the corrida's or the day's cost cap is
 * reached. `pool.json` records what each job did and the interference check.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');
const SYNTH = join(REPO, 'tools/synth');
const MCP_CLI = mcpCliPath(SYNTH);

function matrixName(): string {
  const { values } = parseArgs({ options: { matrix: { type: 'string' } } });
  if (!values.matrix) throw new Error('usage: corrida --matrix <name of matrix/<name>.yaml>');
  if (!existsSync(MCP_CLI)) {
    throw new Error(
      'Playwright MCP is not installed: run `pnpm --filter @xangarro/synth-core setup`',
    );
  }
  return values.matrix;
}

interface Corrida {
  readonly catalogue: Catalogue;
  readonly place: JobPlace;
  readonly today: string;
  readonly dayBefore: number;
}

const left = (c: Corrida): number =>
  budgetLeftCents(c.catalogue.config.estimated_cost_caps, {
    corrida: corridaSpentCents(c.place.corridaDir),
    dayBefore: c.dayBefore,
  });

/** One job: the run, then its judge, in the same slot so the pool bounds both. */
async function runAndJudge(c: Corrida, job: Job, index: number): Promise<JobDone> {
  const { catalogue, place, today } = c;
  const common = {
    repoRoot: REPO,
    today,
    config: catalogue.config,
    persona: entry(catalogue.personas, 'persona', job.persona).value,
    scenario: entry(catalogue.scenarios, 'scenario', job.scenario).value,
    repetition: job.repetition,
    budgetCents: left(c),
  };
  const run = await runJob(place, common, index);
  process.stdout.write(`run ${run.id}: ${run.outcome}, success ${String(run.success)}\n`);
  const done = { runId: run.id, outcome: run.outcome, success: run.success };
  if (run.outcome === 'error') return { ...done, findings: null };
  const dir = join(place.corridaDir, 'runs', run.id);
  const judged = await judgeOne(dir, catalogue, { template: judgeTemplate(SYNTH), date: today });
  process.stdout.write(judgeSummary(REPO, dir, judged));
  return { ...done, findings: judged.review.findings.length };
}

async function start(catalogue: Catalogue, mode: 'smoke' | 'full', repetitions: number) {
  const today = new Date().toISOString().slice(0, 10);
  const dayBefore = spentOnDayCents(reportsDir(REPO), today);
  if (budgetLeftCents(catalogue.config.estimated_cost_caps, { corrida: 0, dayBefore }) === 0) {
    throw new Error(
      `today's cost cap is spent (~$${(dayBefore / 100).toFixed(2)}): no corrida starts`,
    );
  }
  const deps = nodeStackDeps(REPO);
  const id = `${today.replace(/-/g, '')}-${randomBytes(2).toString('hex')}`;
  const stack = await startStack(deps, {
    id,
    repoRoot: REPO,
    today,
    allowedHosts: catalogue.config.allowed_hosts,
  });
  tearDownOnSignals(stack);
  const corridaDir = join(reportsDir(REPO), id);
  mkdirSync(corridaDir, { recursive: true });
  writeCorridaFile(corridaDir, { id, mode, repetitions }, REPO);
  useStackDatabases(stack);
  return {
    stack,
    corrida: { catalogue, today, dayBefore, place: { stack, deps, corridaDir, mcpCli: MCP_CLI } },
  };
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const name = matrixName();
  const catalogue = loadCatalogue(SYNTH);
  const matrix = catalogue.matrices.get(name);
  if (matrix === undefined) throw new Error(`no matrix «${name}» in tools/synth/matrix/`);
  const scenarios = new Map([...catalogue.scenarios].map(([id, e]) => [id, e.value]));
  const jobs = corridaJobs(matrix, scenarios, catalogue.config.limits.max_runs_per_corrida);
  // A corrida with a phone run holds the machine-wide Maestro lock throughout.
  if (jobs.some((j) => j.runner === 'phone') && !holdsMaestroLock())
    process.exit(await rerunUnderMaestroLock(REPO));
  const { stack, corrida } = await start(catalogue, matrix.mode, matrix.repetitions);
  try {
    const results = await runPool(
      jobs,
      catalogue.config.concurrency,
      (job, index) => runAndJudge(corrida, job, index),
      { canStart: () => left(corrida) > 0 },
    );
    const dir = corrida.place.corridaDir;
    const a = aggregateCorrida(REPO, dir, catalogue);
    const s = writePoolSummary(dir, results, Date.now() - startedAt);
    process.stdout.write(
      `${relative(REPO, dir)}: ${s.jobs.length} runs in ${s.elapsed_s} s, ${s.interference.peak} at once, ` +
        `${s.interference.issues.length} interference issues, ${a.findings} findings → report.md, pool.json\n`,
    );
    for (const issue of s.interference.issues) process.stdout.write(`  interference: ${issue}\n`);
  } finally {
    await stack.stop();
  }
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
});
