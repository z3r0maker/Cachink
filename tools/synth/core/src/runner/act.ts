import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Config } from '../schemas/config';
import type { Persona } from '../schemas/persona';
import { RunSchema, type Run } from '../schemas/run';
import type { Scenario } from '../schemas/scenario';
import { seedRun, type RunAccess } from '../seed/seed';
import { actorArgs } from './actor-args';
import { runActor, type ActorRun } from './actor-process';
import { decideOutcome, type Outcome } from './outcome';
import { renderActorPrompt } from './prompt';
import { evaluateSuccess } from './success';
import type { ToolSet } from './tools';

/**
 * What every runner shares once its device is ready (S-05, S-06): seed the
 * run's tenant, hand the screen to the actor with its tools, judge success by
 * SQL, and write `run.json`. The runner brings the browser or the phone, the
 * door it walked, and how it captures a step.
 */
export interface Common {
  readonly repoRoot: string;
  readonly today: string;
  readonly config: Config;
  readonly persona: Persona;
  readonly scenario: Scenario;
  readonly repetition: number;
}

/** The run's own tenant, with a note of which it is (no NIPs or passwords written down). */
export async function seedRunTenant(c: Common, dir: string): Promise<RunAccess> {
  const access = await seedRun({
    seed: c.scenario.start.seed,
    authAs: c.scenario.start.auth_as,
    today: c.today,
    allowedHosts: c.config.allowed_hosts,
    label: c.persona.id,
  });
  const note = { biz: access.tenant.biz, operators: access.operators.map((o) => o.nombre) };
  writeFileSync(join(dir, 'access.json'), `${JSON.stringify(note, null, 2)}\n`);
  return access;
}

/** What the persona has at hand once the runner walked the door, in its own words. */
export function accessLines(scenario: Scenario, access: RunAccess): string[] {
  const op = access.operators[0];
  if (scenario.start.auth_as === 'operador' && op !== undefined) {
    return [
      `Ya entraste a la caja con tu nombre, ${op.nombre}.`,
      `Tu NIP es ${op.nip}, por si te lo pide.`,
    ];
  }
  return [`Ya entraste a tu cuenta (${access.account.email}).`];
}

export interface ActInput extends Common {
  readonly runner: Run['runner'];
  readonly id: string;
  readonly dir: string;
  /** An empty folder: the actor's working directory. */
  readonly empty: string;
  readonly startedAt: Date;
  readonly biz: string;
  /** What the persona has at hand, in its own words. */
  readonly access: readonly string[];
  readonly mcpConfig: unknown;
  readonly tools: ToolSet;
  readonly step: (n: number, action: string) => Promise<{ readonly fingerprint: string }>;
  /** How long the register's outbox gets to reach Postgres. */
  readonly successWaitMs?: number;
}

export async function actAndRecord(a: ActInput): Promise<Run> {
  const maxSteps = Math.min(a.persona.patience.max_steps, a.config.limits.max_steps);
  const mcpPath = join(a.dir, 'mcp.json');
  writeFileSync(mcpPath, `${JSON.stringify(a.mcpConfig, null, 2)}\n`);
  const template = readFileSync(join(a.repoRoot, 'tools/synth/prompts/actor-task.md'), 'utf8');
  const systemPrompt = renderActorPrompt(template, a.persona, a.access, maxSteps);
  const fingerprints = new Map<number, string>();
  const actor = await runActor({
    command: 'claude',
    args: actorArgs({
      model: a.config.models.actor,
      mcpConfigPath: mcpPath,
      budgetUsd: a.config.estimated_cost_caps.per_corrida_usd_cents / 100,
      systemPrompt,
      tools: a.tools,
    }),
    prompt: a.scenario.mission,
    cwd: a.empty,
    maxSteps,
    maxTurns: a.config.limits.max_turns,
    timeoutMs: a.config.limits.run_timeout_s * 1000,
    onStep: async (s) => void fingerprints.set(s.n, (await a.step(s.n, s.action)).fingerprint),
    streamFile: join(a.dir, 'actor.stream.jsonl'),
    tools: a.tools,
  });
  writeFileSync(join(a.dir, 'actor.stderr.log'), actor.stderr);
  const decided = decideOutcome(actor);
  const failed = decided.outcome === 'error';
  const checks = failed ? [] : await evaluateSuccess(a.biz, a.scenario.success, a.successWaitMs);
  const run = buildRun(a, { actor, decided, checks, fingerprints });
  writeFileSync(join(a.dir, 'run.json'), `${JSON.stringify(run, null, 2)}\n`);
  return run;
}

interface Ended {
  readonly actor: ActorRun;
  readonly decided: Outcome;
  readonly checks: readonly { readonly check: string; readonly passed: boolean }[];
  readonly fingerprints: ReadonlyMap<number, string>;
}

/** `run.json`, parsed against `RunSchema` so a run that breaks the contract fails loudly. */
function buildRun(a: ActInput, e: Ended): Run {
  const { actor, decided, checks, fingerprints } = e;
  const final = actor.tracker.final;
  return RunSchema.parse({
    id: a.id,
    persona: a.persona.id,
    scenario: a.scenario.id,
    style: 'task',
    repetition: a.repetition,
    runner: a.runner,
    outcome: decided.outcome,
    success: decided.outcome === 'error' ? null : checks.every((c) => c.passed),
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
    duration_ms: Date.now() - a.startedAt.getTime(),
    started_at: a.startedAt.toISOString(),
  });
}
