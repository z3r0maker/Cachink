import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { ConfigSchema } from '../src/schemas/config';
import { RunSchema, runId } from '../src/schemas/run';
import { CONFIG } from './fixtures';
import { failingPaths, issues, withPatch } from './helpers';

const STEP = (n: number) => ({
  n,
  thought: 'Busco dónde cobrar.',
  action: 'click «Cobrar»',
  observed: 'Se abrió el cobro.',
  fingerprint: `url:/operador/caja#dom:${n}`,
});

const RUN = {
  id: 'taquero__primera-venta__task__r1',
  persona: 'taquero',
  scenario: 'primera-venta',
  style: 'task',
  repetition: 1,
  runner: 'web',
  outcome: 'completed',
  success: true,
  checks: [{ check: 'venta-efectivo', passed: true }],
  steps: [STEP(1), STEP(2), STEP(3)],
  looks: 4,
  exit_interview: {
    hardest_moments: [{ step: 2, what: 'no vi el cambio' }],
    not_understood: 'ninguno',
    expected_missing: 'nada',
  },
  tokens: { input: 12_000, output: 900, cache_read: 30_000, cache_write: 4_000 },
  estimated_cost_usd_cents: 42,
  duration_ms: 95_000,
  started_at: '2026-11-19T18:00:00.000Z',
} as const;

describe('RunSchema', () => {
  it('accepts a completed run, and its id is built from what it ran', () => {
    assert.deepEqual(issues(RunSchema, RUN), []);
    assert.equal(runId(RUN), RUN.id);
  });

  it('refuses an id that does not match its persona, scenario, style and repetition', () => {
    const [issue] = issues(RunSchema, withPatch(RUN, { repetition: 2 }));
    assert.match(issue ?? '', /^id: .*taquero__primera-venta__task__r2/);
  });

  it('refuses steps out of order, or a step without the screen fingerprint reactions read (ADR-154)', () => {
    assert.deepEqual(failingPaths(RunSchema, withPatch(RUN, { steps: [STEP(1), STEP(3)] })), [
      'steps.1.n',
    ]);
    const { fingerprint: _, ...blind } = STEP(1);
    assert.deepEqual(failingPaths(RunSchema, withPatch(RUN, { steps: [blind] })), [
      'steps.0.fingerprint',
    ]);
  });

  it('requires an error message exactly when the harness failed, and no success verdict then', () => {
    const broken = withPatch(RUN, { outcome: 'error', success: null });
    assert.deepEqual(failingPaths(RunSchema, broken), ['error']);
    assert.deepEqual(
      issues(RunSchema, withPatch(RUN, { outcome: 'error', success: null, error: 'timeout' })),
      [],
    );
    assert.deepEqual(failingPaths(RunSchema, withPatch(RUN, { error: 'timeout' })), ['error']);
  });

  it('refuses a float cost or negative tokens: cost is integer cents of an estimate', () => {
    const bad = withPatch(RUN, {
      estimated_cost_usd_cents: 4.2,
      tokens: { ...RUN.tokens, output: -1 },
    });
    assert.deepEqual(failingPaths(RunSchema, bad).sort(), [
      'estimated_cost_usd_cents',
      'tokens.output',
    ]);
  });
});

describe('ConfigSchema', () => {
  it('accepts the harness’s config', () => {
    assert.deepEqual(issues(ConfigSchema, CONFIG), []);
  });

  it('refuses a host outside the local three: widening it takes a code change and an ADR', () => {
    const bad = withPatch(CONFIG, { allowed_hosts: ['127.0.0.1', 'staging.xangarro.mx'] });
    assert.deepEqual(failingPaths(ConfigSchema, bad), ['allowed_hosts.1']);
  });

  it('refuses a second phone: the phone runner has one emulator (ADR-153 §5)', () => {
    assert.deepEqual(
      failingPaths(ConfigSchema, withPatch(CONFIG, { concurrency: { web: 3, phone: 2 } })),
      ['concurrency.phone'],
    );
  });

  it('refuses a corrida cap above the day’s, and «stuck» before «doubt»', () => {
    const bad = withPatch(CONFIG, {
      estimated_cost_caps: { per_corrida_usd_cents: 6_000, per_day_usd_cents: 5_000 },
      reactions: { doubt_after: 3, stuck_after: 3, patience_stuck_at: 0.75 },
    });
    assert.deepEqual(failingPaths(ConfigSchema, bad).sort(), [
      'estimated_cost_caps.per_corrida_usd_cents',
      'reactions.stuck_after',
    ]);
  });

  it('refuses a model that is not a Claude model id', () => {
    const bad = withPatch(CONFIG, { models: { ...CONFIG.models, judge: 'gpt-5' } });
    assert.deepEqual(failingPaths(ConfigSchema, bad), ['models.judge']);
  });
});
