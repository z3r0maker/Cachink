import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { linkIn, walkOperatorDoor, walkOwnerDoor } from '@xangarro/testing/tenant';

import { runId, type Run } from '../schemas/run';
import { seededTenant, type RunAccess } from '../seed/seed';
import { businessOf } from '../success/business';
import { accessLines, actAndRecord, seedRunTenant, type Common } from './act';
import { mcpConfig } from './actor-args';
import { launchBrowser, type RunBrowser } from './browser';
import { Capture } from './capture';
import { watchConfirmation, type ConfirmationWatch } from './confirm';
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
  /** Where the corrida's portal writes its mail (`EMAIL_OUTBOX_DIR`). */
  readonly outboxDir: string;
  /** The run's own client address (`runAddress`), so throttles never cross runs. */
  readonly address: string;
}

/** Where a signup's confirmation link points (N-83). */
const CONFIRM_PATH = '/signup/confirmar';

/**
 * A signup run (`sin-cuenta`): no door, the actor starts at /signup, and the
 * runner opens the confirmation link in the actor's tab when the email lands.
 */
function startSignup(
  b: RunBrowser,
  i: RunInput,
  access: RunAccess,
  dir: string,
): ConfirmationWatch {
  const watch = watchConfirmation({
    find: () => linkIn(i.outboxDir, access.account.email, CONFIRM_PATH),
    open: async (link) => void (await b.page.goto(link)),
  });
  // For the judge: the tab moved by the runner's hand, not the actor's. The
  // token stays out of the run folder.
  void watch.done.then(({ opened, error }) => {
    if (opened === null && error === undefined) return;
    const note = {
      note: 'The runner opened the emailed confirmation link in the actor’s tab: the actor has no email.',
      opened: opened !== null,
      at: new Date().toISOString(),
      ...(error === undefined ? {} : { error }),
    };
    writeFileSync(join(dir, 'confirmation.json'), `${JSON.stringify(note, null, 2)}\n`);
  });
  return watch;
}

/** The door the scenario starts behind, walked by the runner, so the actor starts where the mission does. */
async function walkDoor(b: RunBrowser, i: RunInput, access: RunAccess): Promise<void> {
  if (access.tenant === null) {
    await b.page.goto(i.scenario.start.url);
    return;
  }
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
    email: seededTenant(access).email,
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
    address: i.address,
  });
  // What this run held while it ran, for the corrida's interference check (S-11).
  const held = { cdp_port: i.cdpPort, address: i.address, profile };
  writeFileSync(join(dir, 'runner.json'), `${JSON.stringify(held, null, 2)}\n`);
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
  const signup = access.tenant === null ? startSignup(browser, i, access, dir) : null;
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
      biz: async () => access.tenant?.biz ?? businessOf(access.account.email),
      access: accessLines(i.scenario, access),
      mcpConfig: mcpConfig({ node: process.execPath, cli: i.mcpCli, cdpUrl: browser.cdpUrl }),
      tools: WEB_TOOLS,
      step: (n, action) => capture.step(n, action),
    });
  } finally {
    signup?.stop();
    await capture.stop();
    await browser.close().catch(() => undefined);
    rmSync(profile, { recursive: true, force: true });
    rmSync(empty, { recursive: true, force: true });
  }
}
