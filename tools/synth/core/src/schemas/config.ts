import { z } from 'zod';

import { Count, Positive, Text } from './common';

/**
 * The hosts a run or a seed may touch (ADR-153 §3, track S §3): the stack's
 * own loopback, and the emulator's alias for it. The list is closed in code:
 * `config.yaml` may narrow it, and widening it takes a code change and an ADR.
 */
export const LOCAL_HOSTS = ['127.0.0.1', 'localhost', '10.0.2.2'] as const;

const Model = z
  .string()
  .regex(/^claude-[a-z0-9-]+$/, 'must be a Claude model id, like claude-opus-5-5');

/** A fraction from 0 to 1 exclusive: a share of something, never all of it. */
const Fraction = z.number().gt(0).lt(1);

/**
 * `config.yaml` (spec §14): models per role (owner decision 5), the limits a
 * run cannot pass, concurrency, the estimated-cost caps (owner decision 6) and
 * the thresholds Studio's reactions use (ADR-154 §4).
 */
export const ConfigSchema = z
  .strictObject({
    allowed_hosts: z.array(z.enum(LOCAL_HOSTS)).min(1),
    models: z.strictObject({ actor: Model, judge: Model, triage: Model }),
    limits: z.strictObject({
      max_steps: Positive.max(200),
      max_turns: Positive.max(400),
      run_timeout_s: Positive.max(3_600),
      /** Spec §14's «tope de runs por corrida»: cells × repetitions may not pass it. */
      max_runs_per_corrida: Positive.max(200),
    }),
    /** The phone runner drives one emulator, so it runs one at a time (ADR-153 §5). */
    concurrency: z.strictObject({ web: Positive.max(8), phone: z.literal(1) }),
    /** Estimated from reported usage, in whole US cents. */
    estimated_cost_caps: z.strictObject({ per_corrida_usd_cents: Count, per_day_usd_cents: Count }),
    reactions: z.strictObject({
      /** Steps in a row without a screen change before a face shows «Dudando». */
      doubt_after: Positive,
      /** …and before it shows «Atorada». */
      stuck_after: Positive,
      /** The share of `max_steps` spent at which a face shows «Atorada». */
      patience_stuck_at: Fraction,
    }),
    android: z.strictObject({ avd: Text }).optional(),
  })
  .superRefine((c, ctx) => {
    const caps = c.estimated_cost_caps;
    if (caps.per_corrida_usd_cents > caps.per_day_usd_cents) {
      ctx.addIssue({
        code: 'custom',
        path: ['estimated_cost_caps', 'per_corrida_usd_cents'],
        message: 'a corrida cannot be allowed more than the whole day',
      });
    }
    if (c.reactions.stuck_after <= c.reactions.doubt_after) {
      ctx.addIssue({
        code: 'custom',
        path: ['reactions', 'stuck_after'],
        message: '«Atorada» comes after «Dudando»: stuck_after must be greater than doubt_after',
      });
    }
  });

export type Config = z.infer<typeof ConfigSchema>;
