import { join } from 'node:path';

import { runPhone } from '../phone/run-phone';
import { runAddress } from '../runner/address';
import type { Common } from '../runner/act';
import { runOne } from '../runner/run';
import type { Run } from '../schemas/run';
import { startApiProxy } from '../seeded/api-proxy';
import { webBase } from '../seeded/apply-web';
import type { SeededBug } from '../seeded/bugs';
import type { Stack, StackDeps } from '../stack/stack';

/**
 * One run on a corrida's stack, by its scenario's runner (S-05, S-06): what
 * `run-one` does once and a corrida (S-11) does per job. Each job gets its
 * own CDP or Metro port and, on the web, its own client address from its
 * index in the corrida. Under a seeded bug (S-12) the web run carries it into
 * its browser, and a phone run reaches the API through the bug's proxy; a
 * web-only bug leaves the phone as it is.
 */
export const mcpCliPath = (synthDir: string): string =>
  join(synthDir, 'vendor/playwright-mcp/node_modules/@playwright/mcp/cli.js');

export interface JobPlace {
  readonly stack: Stack;
  readonly deps: StackDeps;
  readonly corridaDir: string;
  readonly mcpCli: string;
  readonly seeded?: SeededBug;
}

async function phoneJob(place: JobPlace, c: Common): Promise<Run> {
  const { stack, deps } = place;
  const serverPort = stack.serverPort ?? 0;
  const rule = place.seeded?.phone?.net;
  const proxy =
    rule === undefined
      ? null
      : await startApiProxy({ upstream: `http://127.0.0.1:${serverPort}`, rule });
  try {
    return await runPhone({
      ...c,
      corridaDir: place.corridaDir,
      serverPort: proxy?.port ?? serverPort,
      serverLog: stack.names.serverLog,
      metroPort: await deps.freePort(),
    });
  } finally {
    await proxy?.close();
  }
}

export async function runJob(place: JobPlace, c: Common, index: number): Promise<Run> {
  if (c.scenario.runner === 'phone') return phoneJob(place, c);
  const { stack } = place;
  const served = await webBase(place.seeded, stack.baseUrl ?? '');
  try {
    return await runOne({
      ...c,
      corridaDir: place.corridaDir,
      baseUrl: served.baseUrl,
      cdpPort: await place.deps.freePort(),
      mcpCli: place.mcpCli,
      outboxDir: stack.names.outboxDir,
      address: runAddress(index),
      ...(place.seeded === undefined ? {} : { seeded: place.seeded }),
    });
  } finally {
    await served.close();
  }
}
