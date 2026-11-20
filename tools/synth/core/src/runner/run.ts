import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { walkOperatorDoor, walkOwnerDoor } from '@xangarro/testing/tenant';

import { runId, type Run } from '../schemas/run';
import type { RunAccess } from '../seed/seed';
import { accessLines, actAndRecord, seedRunTenant, type Common } from './act';
import { mcpConfig } from './actor-args';
import { launchBrowser, type RunBrowser } from './browser';
import { Capture } from './capture';
import { WEB_TOOLS } from './tools';

/**
 * `run.ts` (S-05): one persona, one scenario, one repetition, on a corrida's
 * stack, into `<corrida>/runs/<run-id>/`. The web runner owns the browser,
 * walks the door the scenario starts behind, and hands the screen to the actor
 * (`act.ts`), which decides success by SQL afterwards.
 */
export interface RunInput extends Common {
  readonly baseUrl: string;
  /** `tools/synth/reports/<corrida>`. */
  readonly corridaDir: string;
  readonly cdpPort: number;
  readonly mcpCli: string;
}

/** The door the scenario starts behind, walked by the runner, so the actor starts where the mission does. */
async function walkDoor(b: RunBrowser, i: RunInput, access: RunAccess): Promise<void> {
  if (i.scenario.start.auth_as !== 'operador') {
    await walkOwnerDoor(b.page, access.account);
    await b.page.goto(i.scenario.start.url);
    return;
  }
  const [op] = access.operators;
  if (op === undefined || access.activationCode === null) {
    throw new Error('an operador scenario needs an operator and a code');
  }
  await b.page.goto(i.scenario.start.url);
  await walkOperatorDoor(b.page, {
    email: access.tenant.email,
    code: access.activationCode,
    operador: op.nombre,
    nip: op.nip,
  });
}

/** A fresh profile and an empty folder for the actor, the browser, and its capture. */
async function openBrowser(i: RunInput, dir: string) {
  const profile = mkdtempSync(join(tmpdir(), 'synth-profile-'));
  const empty = mkdtempSync(join(tmpdir(), 'synth-actor-'));
  const browser = await launchBrowser({
    persona: i.persona,
    profileDir: profile,
    cdpPort: i.cdpPort,
    baseUrl: i.baseUrl,
  });
  return { profile, empty, browser, capture: new Capture(dir, browser.context, browser.page) };
}

export async function runOne(i: RunInput): Promise<Run> {
  const id = runId({
    persona: i.persona.id,
    scenario: i.scenario.id,
    style: 'task',
    repetition: i.repetition,
  });
  const dir = join(i.corridaDir, 'runs', id);
  mkdirSync(dir, { recursive: true });
  const startedAt = new Date();
  const access = await seedRunTenant(i, dir);
  const { profile, empty, browser, capture } = await openBrowser(i, dir);
  try {
    await capture.start();
    await walkDoor(browser, i, access);
    return await actAndRecord({
      ...i,
      runner: 'web',
      id,
      dir,
      empty,
      startedAt,
      biz: access.tenant.biz,
      access: accessLines(i.scenario, access),
      mcpConfig: mcpConfig({ node: process.execPath, cli: i.mcpCli, cdpUrl: browser.cdpUrl }),
      tools: WEB_TOOLS,
      step: (n, action) => capture.step(n, action),
    });
  } finally {
    await capture.stop();
    await browser.close().catch(() => undefined);
    rmSync(profile, { recursive: true, force: true });
    rmSync(empty, { recursive: true, force: true });
  }
}
