import { z } from 'zod';

import { Count, KebabId, Positive, Runner, Style, Text } from './common';
import { RUN_ID } from './finding';

/**
 * One step of the actor, as the runner records it: the thought it wrote
 * before acting, the action, what came back, and the screen fingerprint
 * Studio's reactions are computed from (ADR-154 §4): URL plus DOM hash on the
 * web, the hierarchy hash on the phone.
 */
const Step = z.strictObject({
  n: Positive,
  thought: z.string(),
  action: Text,
  observed: z.string(),
  fingerprint: Text,
});

/** The actor's forced-choice exit interview (spec §8.1). */
export const ExitInterview = z.strictObject({
  hardest_moments: z
    .array(z.strictObject({ step: z.number().int().min(0), what: z.string() }))
    .max(2),
  not_understood: z.string(),
  expected_missing: z.string(),
});
export type ExitInterview = z.infer<typeof ExitInterview>;

/** One of the scenario's success checks, as the SQL answered it. */
const CheckResult = z.strictObject({ check: KebabId, passed: z.boolean() });

/** What ran, as one id: `<persona>__<scenario>__<style>__r<repetition>`. */
export function runId(r: {
  readonly persona: string;
  readonly scenario: string;
  readonly style: string;
  readonly repetition: number;
}): string {
  return `${r.persona}__${r.scenario}__${r.style}__r${r.repetition}`;
}

/**
 * `run.json` (S-05): outcome, steps, tokens, estimated cost and duration.
 * `outcome` is the actor's own (spec §8.1) plus `error`, which is the harness
 * failing rather than the persona giving up. `success` is the SQL checks'
 * verdict, and there is none when the harness failed.
 */
export const RunSchema = z
  .strictObject({
    id: z.string().regex(RUN_ID, 'must look like persona__scenario__task__r1'),
    persona: KebabId,
    scenario: KebabId,
    style: Style,
    repetition: Positive,
    runner: Runner,
    outcome: z.enum(['completed', 'abandoned', 'blocked', 'error']),
    success: z.boolean().nullable(),
    /** Each success check's answer; `success` is all of them. Empty when the harness failed. */
    checks: z.array(CheckResult),
    error: Text.optional(),
    steps: z.array(Step),
    /** Snapshots, screenshots and waits: looking, which is not a step. */
    looks: Count,
    /** Absent when the actor ended without the contract's report. */
    exit_interview: ExitInterview.optional(),
    tokens: z.strictObject({ input: Count, output: Count, cache_read: Count, cache_write: Count }),
    /** An estimate from the reported usage, in whole US cents: never a float. */
    estimated_cost_usd_cents: Count,
    duration_ms: Count,
    started_at: z.iso.datetime(),
  })
  .superRefine((r, ctx) => {
    const expected = runId(r);
    if (r.id !== expected) {
      ctx.addIssue({ code: 'custom', path: ['id'], message: `must be ${expected}` });
    }
    r.steps.forEach((s, i) => {
      if (s.n !== i + 1) {
        ctx.addIssue({ code: 'custom', path: ['steps', i, 'n'], message: `must be ${i + 1}` });
      }
    });
    const failed = r.outcome === 'error';
    if (failed !== (r.error !== undefined)) {
      const message = failed ? 'an «error» run says what failed' : 'only an «error» run has one';
      ctx.addIssue({ code: 'custom', path: ['error'], message });
    }
  });

export type Run = z.infer<typeof RunSchema>;
