import assert from 'node:assert/strict';
import { join } from 'node:path';

import { afterEach, describe, it } from 'vitest';

import { actorEnv, runActor } from '../src/runner/actor-process';
import { decideOutcome } from '../src/runner/outcome';

/** The actor process against a fake `claude` that prints what a real one would. */
const FAKE = join(import.meta.dirname, 'fixtures/fake-actor.mjs');

function run(
  mode: string,
  o: { steps?: number; maxSteps?: number; maxTurns?: number; timeoutMs?: number } = {},
) {
  process.env.FAKE_ACTOR = mode;
  process.env.FAKE_STEPS = String(o.steps ?? 2);
  const seen: number[] = [];
  return runActor({
    command: process.execPath,
    args: [FAKE],
    prompt: 'misión',
    cwd: import.meta.dirname,
    maxSteps: o.maxSteps ?? 10,
    maxTurns: o.maxTurns ?? 50,
    timeoutMs: o.timeoutMs ?? 10_000,
    onStep: async (s) => void seen.push(s.n),
  }).then((r) => ({ ...r, seen }));
}

afterEach(() => {
  delete process.env.FAKE_ACTOR;
  delete process.env.FAKE_STEPS;
});

describe('runActor', () => {
  it('reads past a non-JSON line, hands every step to onStep in order, and keeps the result', async () => {
    const r = await run('steps', { steps: 3 });
    assert.equal(r.stop, 'ended');
    assert.deepEqual(r.seen, [1, 2, 3]);
    assert.equal(r.tracker.final?.costCents, 12);
    assert.deepEqual(decideOutcome(r).outcome, 'completed');
  });

  it('stops the actor one step past its patience, and that is abandoning', async () => {
    const r = await run('hang', { steps: 5, maxSteps: 3 });
    assert.equal(r.stop, 'max_steps');
    assert.equal(decideOutcome(r).outcome, 'abandoned');
  });

  it('stops an actor that runs past the time limit, and that is the harness failing', async () => {
    const r = await run('hang', { steps: 1, timeoutMs: 1_500 });
    assert.equal(r.stop, 'timeout');
    const d = decideOutcome(r);
    assert.equal(d.outcome, 'error');
    assert.match(d.error ?? '', /run_timeout_s/);
  });

  it('stops an actor past max_turns', async () => {
    const r = await run('hang', { steps: 6, maxTurns: 4 });
    assert.equal(r.stop, 'max_turns');
  });

  it('reports a crashed actor with the last line it wrote to stderr', async () => {
    const r = await run('crash');
    assert.equal(r.stop, 'crashed');
    assert.match(decideOutcome(r).error ?? '', /fatal: no login/);
  });

  it('an actor that ends without its report is an error, not a completion', async () => {
    const r = await run('noreport');
    assert.equal(r.stop, 'ended');
    assert.match(decideOutcome(r).error ?? '', /without the report/);
  });
});

describe('actorEnv', () => {
  it('drops the stack’s databases, ports and clock, and keeps what claude needs to run', () => {
    const env = actorEnv({
      PATH: '/usr/bin',
      HOME: '/Users/x',
      DATABASE_URL: 'postgres://a',
      DATABASE_SUPER_URL: 'postgres://b',
      BILLING_DATABASE_URL: 'postgres://c',
      XG_PG_PORT: '1',
      SYNTH_STACK: '1',
      PORTAL_TODAY: '2026-11-19',
    });
    assert.deepEqual(env, { PATH: '/usr/bin', HOME: '/Users/x' });
  });
});
