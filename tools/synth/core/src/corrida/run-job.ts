import { join } from 'node:path';

import { runPhone } from '../phone/run-phone';
import { runAddress } from '../runner/address';
import type { Common } from '../runner/act';
import { runOne } from '../runner/run';
import type { Run } from '../schemas/run';
import type { Stack, StackDeps } from '../stack/stack';

/**
 * One run on a corrida's stack, by its scenario's runner (S-05, S-06): what
 * `run-one` does once and a corrida (S-11) does per job. Each job gets its
 * own CDP or Metro port and, on the web, its own client address from its
 * index in the corrida.
 */
export const mcpCliPath = (synthDir: string): string =>
  join(synthDir, 'vendor/playwright-mcp/node_modules/@playwright/mcp/cli.js');

export interface JobPlace {
  readonly stack: Stack;
  readonly deps: StackDeps;
  readonly corridaDir: string;
  readonly mcpCli: string;
}

export async function runJob(place: JobPlace, c: Common, index: number): Promise<Run> {
  const { stack, deps, corridaDir } = place;
  if (c.scenario.runner === 'phone') {
    return runPhone({
      ...c,
      corridaDir,
      serverPort: stack.serverPort ?? 0,
      serverLog: stack.names.serverLog,
      metroPort: await deps.freePort(),
    });
  }
  return runOne({
    ...c,
    corridaDir,
    baseUrl: stack.baseUrl ?? '',
    cdpPort: await deps.freePort(),
    mcpCli: place.mcpCli,
    outboxDir: stack.names.outboxDir,
    address: runAddress(index),
  });
}

/** The stack's databases, for the seed and the success checks in this process. */
export function useStackDatabases(stack: Stack): void {
  process.env.DATABASE_URL = stack.urls.database;
  process.env.DATABASE_SUPER_URL = stack.urls.superUser;
  process.env.BILLING_DATABASE_URL = stack.urls.billing;
}
