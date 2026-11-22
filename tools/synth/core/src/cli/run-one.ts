import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { writeCorridaFile } from '../aggregate/load';
import { entry, loadCatalogue } from '../corrida/catalogue';
import { mcpCliPath, runJob, useStackDatabases } from '../corrida/run-job';
import { holdsMaestroLock, rerunUnderMaestroLock } from '../phone/lock';
import type { Run } from '../schemas/run';
import { nodeStackDeps } from '../stack/adapters';
import { reportsDir } from '../stack/names';
import { tearDownOnSignals } from '../stack/signals';
import { startStack } from '../stack/stack';

/**
 * `pnpm --filter @xangarro/synth-core run-one --persona <id> --scenario <id> [--repetition n]`
 *
 * One run, end to end (S-05's acceptance): validate the tree, bring up a
 * corrida's stack, run the persona through the scenario into
 * `tools/synth/reports/<corrida>/runs/<run-id>/`, print the verdict, tear down.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');
const SYNTH = join(REPO, 'tools/synth');
const MCP_CLI = mcpCliPath(SYNTH);

function cliArgs(): { persona: string; scenario: string; repetition: number } {
  const { values } = parseArgs({
    options: {
      persona: { type: 'string' },
      scenario: { type: 'string' },
      repetition: { type: 'string' },
    },
  });
  if (!values.persona || !values.scenario) {
    throw new Error('usage: run-one --persona <id> --scenario <id>');
  }
  if (!existsSync(MCP_CLI)) {
    throw new Error(
      'Playwright MCP is not installed: run `pnpm --filter @xangarro/synth-core setup`',
    );
  }
  return {
    persona: values.persona,
    scenario: values.scenario,
    repetition: Number(values.repetition ?? '1'),
  };
}

function printVerdict(run: Run, corrida: string): void {
  const verdict = {
    id: run.id,
    outcome: run.outcome,
    success: run.success,
    steps: run.steps.length,
    looks: run.looks,
    cost_usd_cents: run.estimated_cost_usd_cents,
    seconds: Math.round(run.duration_ms / 1000),
    folder: join('tools/synth/reports', corrida, 'runs', run.id),
    ...(run.error ? { error: run.error } : {}),
  };
  process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
}

async function main(): Promise<void> {
  const args = cliArgs();
  const catalogue = loadCatalogue(SYNTH);
  const { config } = catalogue;
  const persona = entry(catalogue.personas, 'persona', args.persona).value;
  const scenario = entry(catalogue.scenarios, 'scenario', args.scenario).value;
  // A phone run starts over inside a shell holding the machine-wide Maestro lock.
  if (scenario.runner === 'phone' && !holdsMaestroLock())
    process.exit(await rerunUnderMaestroLock(REPO));
  const deps = nodeStackDeps(REPO);
  const today = new Date().toISOString().slice(0, 10);
  const id = `${today.replace(/-/g, '')}-${randomBytes(2).toString('hex')}`;
  const stack = await startStack(deps, {
    id,
    repoRoot: REPO,
    today,
    allowedHosts: config.allowed_hosts,
  });
  tearDownOnSignals(stack);
  const corridaDir = join(reportsDir(REPO), id);
  mkdirSync(corridaDir, { recursive: true });
  writeCorridaFile(corridaDir, { id, mode: 'single', repetitions: 1 }, REPO);
  useStackDatabases(stack);
  try {
    const common = {
      repoRoot: REPO,
      today,
      config,
      persona,
      scenario,
      repetition: args.repetition,
    };
    const place = { stack, deps, corridaDir, mcpCli: MCP_CLI };
    printVerdict(await runJob(place, common, 0), id);
  } finally {
    await stack.stop();
  }
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
});
