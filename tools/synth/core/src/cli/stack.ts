import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { parse } from 'yaml';

import { AuthAs, Seed } from '../schemas/common';
import { ConfigSchema } from '../schemas/config';
import { seedRun } from '../seed/seed';
import { nodeStackDeps } from '../stack/adapters';
import { stackEnv, useStackDatabases } from '../stack/env';
import { reapOrphans } from '../stack/reap';
import { tearDownOnSignals } from '../stack/signals';
import { startStack } from '../stack/stack';

/**
 * `pnpm --filter @xangarro/synth-core stack <up|run|reap>`.
 *
 *   up [--id <id>] [--today YYYY-MM-DD] [--no-server] [--seed <seed> --auth-as <role>]
 *       Brings up a corrida's stack, prints one JSON `ready` line on stdout, and
 *       stays up until it is signalled; then it tears down.
 *   run [--today YYYY-MM-DD] [--no-server] -- <command…>
 *       Brings one up, runs the command with the stack's databases, portal and
 *       mail folder in its environment (`stack/env.ts`), tears down, and exits
 *       with the command's code. What `test:db` and `test:seeded` run on.
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

const OPTIONS = {
  id: { type: 'string' },
  today: { type: 'string' },
  'no-server': { type: 'boolean' },
  seed: { type: 'string' },
  'auth-as': { type: 'string' },
} as const;

async function bringUp(values: { id?: string; today?: string; 'no-server'?: boolean }) {
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
  return { stack, config, day };
}

async function up(argv: string[]): Promise<void> {
  const { values } = parseArgs({ args: argv, options: OPTIONS });
  const { stack, config, day } = await bringUp(values);
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

async function run(argv: string[]): Promise<void> {
  const split = argv.indexOf('--');
  const [cmd, ...args] = split === -1 ? [] : argv.slice(split + 1);
  if (cmd === undefined) throw new Error('usage: stack run [--no-server] -- <command…>');
  const { values } = parseArgs({ args: argv.slice(0, split), options: OPTIONS });
  const { stack, day } = await bringUp(values);
  const env = { ...process.env, ...stackEnv(stack), SYNTH_TODAY: day };
  const child = spawn(cmd, args, { stdio: 'inherit', env, cwd: process.cwd() });
  const code = await new Promise<number>((r) => child.once('exit', (c) => r(c ?? 1)));
  await stack.stop();
  process.exit(code);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (command === 'up') return up(rest);
  if (command === 'run') return run(rest);
  if (command === 'reap') {
    const reaped = await reapOrphans(nodeStackDeps(REPO));
    process.stdout.write(`${JSON.stringify({ reaped })}\n`);
    return;
  }
  process.stderr.write('usage: stack <up|run|reap> (see src/cli/stack.ts)\n');
  process.exit(2);
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
