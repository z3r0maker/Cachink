import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

import { StepTracker, type TrackedStep } from './stream';
import type { ToolSet } from './tools';

/**
 * The actor as a process: `claude -p` in an empty folder, its stream read line
 * by line. Each completed step is handed to `onStep` (the runner's screenshot)
 * in order. The runner enforces the limits the CLI has no flag for: steps
 * beyond the persona's patience, turns, and time; any of them stops the actor.
 */
export type StopReason = 'ended' | 'max_steps' | 'max_turns' | 'timeout' | 'crashed';

export interface ActorRun {
  readonly tracker: StepTracker;
  readonly stop: StopReason;
  readonly exitCode: number | null;
  readonly stderr: string;
}

export interface ActorProcessInput {
  readonly command: string;
  readonly args: readonly string[];
  /** The mission: the only thing the actor is told about the task. */
  readonly prompt: string;
  /** An empty folder: the actor never sees the repo. */
  readonly cwd: string;
  readonly maxSteps: number;
  readonly maxTurns: number;
  readonly timeoutMs: number;
  readonly onStep: (step: TrackedStep) => Promise<void>;
  /** Where every event is kept as it arrives: the actor's own record, for the judge. */
  readonly streamFile?: string;
  /** Which calls are steps and how they read; the web's by default. */
  readonly tools?: ToolSet;
}

/** Nothing about the stack or the repo reaches the actor's environment. */
export function actorEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(env).filter(([k]) => !/^(DATABASE|BILLING_DATABASE|XG_|SYNTH_|PORTAL_)/.test(k)),
  );
}

/** One stdout line as an event, kept in the stream file; the CLI's non-JSON warnings are skipped. */
function readEvent(line: string, streamFile: string | undefined): unknown {
  if (!line.startsWith('{')) return undefined;
  if (streamFile !== undefined) appendFileSync(streamFile, `${line}\n`);
  try {
    return JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
}

export function runActor(i: ActorProcessInput): Promise<ActorRun> {
  const tracker = new StepTracker(i.tools);
  const child = spawn(i.command, [...i.args, i.prompt], {
    cwd: i.cwd,
    env: actorEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stop: StopReason = 'ended';
  let stderr = '';
  let chain = Promise.resolve();
  const halt = (why: StopReason) => {
    if (stop !== 'ended') return;
    stop = why;
    child.kill('SIGTERM');
  };
  const timer = setTimeout(() => halt('timeout'), i.timeoutMs);
  child.stderr.on('data', (b: Buffer) => (stderr = (stderr + b.toString()).slice(-8_000)));
  createInterface({ input: child.stdout }).on('line', (line) => {
    const event = readEvent(line, i.streamFile);
    if (event === undefined) return;
    const step = tracker.feed(event);
    if (step !== undefined) chain = chain.then(() => i.onStep(step));
    // One step of grace: the actor is told to give up at max_steps and report.
    if (tracker.steps.length > i.maxSteps) halt('max_steps');
    if (tracker.turns > i.maxTurns) halt('max_turns');
  });
  return new Promise((resolve) => {
    child.once('error', (e) => {
      stderr += e.message;
      stop = stop === 'ended' ? 'crashed' : stop;
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (stop === 'ended' && code !== 0 && tracker.final === undefined) stop = 'crashed';
      void chain.then(() => resolve({ tracker, stop, exitCode: code, stderr }));
    });
  });
}
