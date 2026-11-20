import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { walkOperatorDoor, walkOwnerDoor } from '@xangarro/testing/tenant';

import type { Config } from '../schemas/config';
import type { Persona } from '../schemas/persona';
import { RunSchema, runId, type Run } from '../schemas/run';
import type { Scenario } from '../schemas/scenario';
import { seedRun, type RunAccess } from '../seed/seed';
import { actorArgs, mcpConfig } from './actor-args';
import { runActor, type ActorRun } from './actor-process';
import { launchBrowser, type RunBrowser } from './browser';
import { Capture } from './capture';
import { decideOutcome, type Outcome } from './outcome';
import { renderActorPrompt } from './prompt';
import { evaluateSuccess } from './success';

/**
 * `run.ts` (S-05): one persona, one scenario, one repetition, on a corrida's
 * stack, into `<corrida>/runs/<run-id>/`. The runner owns the browser, walks
 * the door the scenario starts behind, hands the screen to the actor, and
 * decides success by SQL afterwards.
 */
export interface RunInput {
  readonly repoRoot: string;
  readonly baseUrl: string;
  readonly today: string;
  readonly config: Config;
  readonly persona: Persona;
  readonly scenario: Scenario;
  readonly repetition: number;
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

/** What the persona has at hand, in its own words. */
function accessLines(i: RunInput, access: RunAccess): string[] {
  const op = access.operators[0];
  if (i.scenario.start.auth_as === 'operador' && op !== undefined) {
    return [
      `Ya entraste a la caja con tu nombre, ${op.nombre}.`,
      `Tu NIP es ${op.nip}, por si te lo pide.`,
    ];
  }
  return [`Ya entraste a tu cuenta (${access.account.email}).`];
}

/** The run's own tenant, with a note of which it is (no NIPs or passwords written down). */
async function seedFor(i: RunInput, dir: string): Promise<RunAccess> {
  const access = await seedRun({
    seed: i.scenario.start.seed,
    authAs: i.scenario.start.auth_as,
    today: i.today,
    allowedHosts: i.config.allowed_hosts,
    label: i.persona.id,
  });
  const note = { biz: access.tenant.biz, operators: access.operators.map((o) => o.nombre) };
  writeFileSync(join(dir, 'access.json'), `${JSON.stringify(note, null, 2)}\n`);
  return access;
}

export async function runOne(i: RunInput): Promise<Run> {
  const style = 'task';
  const id = runId({
    persona: i.persona.id,
    scenario: i.scenario.id,
    style,
    repetition: i.repetition,
  });
  const dir = join(i.corridaDir, 'runs', id);
  mkdirSync(dir, { recursive: true });
  const startedAt = new Date();
  const access = await seedFor(i, dir);
  const profile = mkdtempSync(join(tmpdir(), 'synth-profile-'));
  const empty = mkdtempSync(join(tmpdir(), 'synth-actor-'));
  const browser = await launchBrowser({
    persona: i.persona,
    profileDir: profile,
    cdpPort: i.cdpPort,
    baseUrl: i.baseUrl,
  });
  const capture = new Capture(dir, browser.context, browser.page);
  try {
    await capture.start();
    await walkDoor(browser, i, access);
    return await act(i, { id, dir, empty, startedAt, access, browser, capture });
  } finally {
    await capture.stop();
    await browser.close().catch(() => undefined);
    rmSync(profile, { recursive: true, force: true });
    rmSync(empty, { recursive: true, force: true });
  }
}

interface Live {
  readonly id: string;
  readonly dir: string;
  readonly empty: string;
  readonly startedAt: Date;
  readonly access: RunAccess;
  readonly browser: RunBrowser;
  readonly capture: Capture;
}

async function act(i: RunInput, l: Live): Promise<Run> {
  const maxSteps = Math.min(i.persona.patience.max_steps, i.config.limits.max_steps);
  const mcpPath = join(l.dir, 'mcp.json');
  writeFileSync(
    mcpPath,
    `${JSON.stringify(mcpConfig({ node: process.execPath, cli: i.mcpCli, cdpUrl: l.browser.cdpUrl }), null, 2)}\n`,
  );
  const template = readFileSync(join(i.repoRoot, 'tools/synth/prompts/actor-task.md'), 'utf8');
  const systemPrompt = renderActorPrompt(template, i.persona, accessLines(i, l.access), maxSteps);
  const fingerprints = new Map<number, string>();
  const actor = await runActor({
    command: 'claude',
    args: actorArgs({
      model: i.config.models.actor,
      mcpConfigPath: mcpPath,
      budgetUsd: i.config.estimated_cost_caps.per_corrida_usd_cents / 100,
      systemPrompt,
    }),
    prompt: i.scenario.mission,
    cwd: l.empty,
    maxSteps,
    maxTurns: i.config.limits.max_turns,
    timeoutMs: i.config.limits.run_timeout_s * 1000,
    onStep: async (s) =>
      void fingerprints.set(s.n, (await l.capture.step(s.n, s.action)).fingerprint),
    streamFile: join(l.dir, 'actor.stream.jsonl'),
  });
  writeFileSync(join(l.dir, 'actor.stderr.log'), actor.stderr);
  const decided = decideOutcome(actor);
  const failed = decided.outcome === 'error';
  const checks = failed ? [] : await evaluateSuccess(l.access.tenant.biz, i.scenario.success);
  const run = buildRun(i, l, { actor, decided, checks, fingerprints });
  writeFileSync(join(l.dir, 'run.json'), `${JSON.stringify(run, null, 2)}\n`);
  return run;
}

interface Ended {
  readonly actor: ActorRun;
  readonly decided: Outcome;
  readonly checks: readonly { readonly check: string; readonly passed: boolean }[];
  readonly fingerprints: ReadonlyMap<number, string>;
}

/** `run.json`, parsed against `RunSchema` so a run that breaks the contract fails loudly. */
function buildRun(i: RunInput, l: Live, e: Ended): Run {
  const { actor, decided, checks, fingerprints } = e;
  const failed = decided.outcome === 'error';
  const final = actor.tracker.final;
  return RunSchema.parse({
    id: l.id,
    persona: i.persona.id,
    scenario: i.scenario.id,
    style: 'task',
    repetition: i.repetition,
    runner: 'web',
    outcome: decided.outcome,
    success: failed ? null : checks.every((c) => c.passed),
    checks,
    ...(decided.error === undefined ? {} : { error: decided.error }),
    steps: actor.tracker.steps.map((s) => ({
      n: s.n,
      thought: s.thought,
      action: s.action,
      observed: s.observed,
      fingerprint: fingerprints.get(s.n) ?? 'unknown',
    })),
    looks: actor.tracker.looks,
    ...(decided.report === null ? {} : { exit_interview: decided.report.exit_interview }),
    tokens: final?.tokens ?? { input: 0, output: 0, cache_read: 0, cache_write: 0 },
    estimated_cost_usd_cents: final?.costCents ?? 0,
    duration_ms: Date.now() - l.startedAt.getTime(),
    started_at: l.startedAt.toISOString(),
  });
}
