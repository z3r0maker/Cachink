import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { parse } from 'yaml';

import { ConfigSchema } from '../schemas/config';
import type { Run } from '../schemas/run';
import { PersonaSchema } from '../schemas/persona';
import { ScenarioSchema } from '../schemas/scenario';
import { runOne } from '../runner/run';
import { nodeStackDeps } from '../stack/adapters';
import { reportsDir } from '../stack/names';
import { tearDownOnSignals } from '../stack/signals';
import { startStack } from '../stack/stack';
import { formatIssue, validateTree } from '../validate/tree';
import { existsUnder, readTree } from './read-tree';

/**
 * `pnpm --filter @xangarro/synth-core run-one --persona <id> --scenario <id> [--repetition n]`
 *
 * One run, end to end (S-05's acceptance): validate the tree, bring up a
 * corrida's stack, run the persona through the scenario into
 * `tools/synth/reports/<corrida>/runs/<run-id>/`, print the verdict, tear down.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');
const SYNTH = join(REPO, 'tools/synth');
const MCP_CLI = join(SYNTH, 'vendor/playwright-mcp/node_modules/@playwright/mcp/cli.js');

function load(personaId: string, scenarioId: string) {
  const files = readTree(SYNTH);
  const issues = validateTree(files, existsUnder(SYNTH));
  if (issues.length > 0)
    throw new Error(`tools/synth/ is not valid:\n${issues.map(formatIssue).join('\n')}`);
  const text = (p: string) => files.find((f) => f.path === p)?.text;
  const personaText = files.find(
    (f) => f.path.startsWith('personas/') && f.path.endsWith(`/${personaId}.yaml`),
  )?.text;
  const scenarioText = text(`scenarios/${scenarioId}.yaml`);
  if (personaText === undefined) throw new Error(`no persona «${personaId}»`);
  if (scenarioText === undefined) throw new Error(`no scenario «${scenarioId}»`);
  return {
    config: ConfigSchema.parse(parse(text('config.yaml') ?? '')),
    persona: PersonaSchema.parse(parse(personaText)),
    scenario: ScenarioSchema.parse(parse(scenarioText)),
  };
}

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
  const { config, persona, scenario } = load(args.persona, args.scenario);
  if (scenario.runner !== 'web') {
    throw new Error(`«${scenario.id}» runs on the ${scenario.runner}; this is the web runner`);
  }
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
  process.env.DATABASE_URL = stack.urls.database;
  process.env.DATABASE_SUPER_URL = stack.urls.superUser;
  process.env.BILLING_DATABASE_URL = stack.urls.billing;
  try {
    const run = await runOne({
      repoRoot: REPO,
      baseUrl: stack.baseUrl ?? '',
      today,
      config,
      persona,
      scenario,
      repetition: args.repetition,
      corridaDir: join(reportsDir(REPO), id),
      cdpPort: await deps.freePort(),
      mcpCli: MCP_CLI,
    });
    printVerdict(run, id);
  } finally {
    await stack.stop();
  }
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
});
