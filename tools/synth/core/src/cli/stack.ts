import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { parse } from 'yaml';

import { AuthAs, Seed } from '../schemas/common';
import { ConfigSchema } from '../schemas/config';
import { seedRun } from '../seed/seed';
import { nodeStackDeps } from '../stack/adapters';
import { reapOrphans } from '../stack/reap';
import { tearDownOnSignals } from '../stack/signals';
import { startStack, type Stack } from '../stack/stack';

/**
 * `pnpm --filter @xangarro/synth-core stack <up|reap>`.
 *
 *   up [--id <id>] [--today YYYY-MM-DD] [--no-server] [--seed <seed> --auth-as <role>]
 *       Brings up a corrida's stack, prints one JSON `ready` line on stdout, and
 *       stays up until it is signalled; then it tears down.
 *   reap
 *       Removes the stacks of corridas that died without tearing down.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');

const loadConfig = () =>
  ConfigSchema.parse(parse(readFileSync(join(REPO, 'tools/synth/config.yaml'), 'utf8')));

const today = () => new Date().toISOString().slice(0, 10);

const newId = () => {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');
  return `${stamp}-${randomBytes(2).toString('hex')}`;
};

/** The stack's databases, for this process's fixtures (`@xangarro/testing/tenant` reads them). */
function useStackDatabases(stack: Stack): void {
  process.env.DATABASE_URL = stack.urls.database;
  process.env.DATABASE_SUPER_URL = stack.urls.superUser;
  process.env.BILLING_DATABASE_URL = stack.urls.billing;
}

async function up(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      id: { type: 'string' },
      today: { type: 'string' },
      'no-server': { type: 'boolean' },
      seed: { type: 'string' },
      'auth-as': { type: 'string' },
    },
  });
  const config = loadConfig();
  const day = values.today ?? today();
  const stack = await startStack(nodeStackDeps(REPO), {
    id: values.id ?? newId(),
    repoRoot: REPO,
    today: day,
    allowedHosts: config.allowed_hosts,
    server: values['no-server'] !== true,
  });
  tearDownOnSignals(stack);
  useStackDatabases(stack);
  const access = values.seed
    ? await seedRun({
        seed: Seed.parse(values.seed),
        authAs: AuthAs.parse(values['auth-as'] ?? 'owner'),
        today: day,
        allowedHosts: config.allowed_hosts,
      })
    : null;
  const { stop: _, names, ...ready } = stack;
  process.stdout.write(
    `${JSON.stringify({ ready: { ...ready, outboxDir: names.outboxDir, pid: process.pid, access } })}\n`,
  );
  setInterval(() => undefined, 60_000);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (command === 'up') return up(rest);
  if (command === 'reap') {
    const reaped = await reapOrphans(nodeStackDeps(REPO));
    process.stdout.write(`${JSON.stringify({ reaped })}\n`);
    return;
  }
  process.stderr.write('usage: stack <up|reap> (see src/cli/stack.ts)\n');
  process.exit(2);
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
