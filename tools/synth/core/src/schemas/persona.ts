import { z } from 'zod';

import { KebabId, PersonaKind, PersonaStatus, Positive, Source, Text } from './common';

/**
 * A persona (spec §6.1): concrete behaviors and expectations, never a
 * biography or a personality. Every behavior names its source, and a persona
 * is `grounded` only when at least 60% of them cite real evidence.
 */

/** The share of behaviors that cite evidence rather than a hypothesis. */
export const GROUNDED_SHARE = 0.6;

const Behavior = z.strictObject({ trait: Text, source: Source });
export type Behavior = z.infer<typeof Behavior>;

/** The fraction of `behaviors` that cite evidence, 0 when there are none. */
export function evidenceShare(behaviors: readonly { readonly source: string }[]): number {
  if (behaviors.length === 0) return 0;
  return behaviors.filter((b) => b.source !== 'hypothesis').length / behaviors.length;
}

const Viewport = z.tuple([Positive, Positive]);

export const PersonaSchema = z
  .strictObject({
    id: KebabId,
    kind: PersonaKind,
    tier: z.enum(['core', 'pool', 'anti']),
    status: PersonaStatus,
    /** The segment's estimated share of the market, and where that estimate comes from. */
    market_weight: z.strictObject({
      value: z.number().min(0).max(1),
      source: z.union([z.literal('estimate'), Source]),
    }),
    business: z.strictObject({
      type: Text,
      team: Text,
      formality: z.enum(['informal', 'resico', 'formal-con-contador']),
    }),
    device: z.strictObject({
      viewport: Viewport,
      network: z.enum(['wifi', '4g', 'slow-3g', 'offline-intermitente']),
      input: z.enum(['touch', 'mouse']),
    }),
    comparators: z.array(Text),
    goals: z.array(Text).min(1),
    knows: z.array(Text),
    /** Words the persona does not understand when they appear on screen. */
    does_not_know: z.array(Text),
    behaviors: z.array(Behavior).min(1),
    patience: z.strictObject({
      max_steps: Positive,
      abandon_triggers: z.array(Text),
    }),
  })
  .superRefine((p, ctx) => {
    if (p.status === 'grounded' && evidenceShare(p.behaviors) < GROUNDED_SHARE) {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: `«grounded» needs at least ${GROUNDED_SHARE * 100}% of behaviors citing evidence`,
      });
    }
  });

export type Persona = z.infer<typeof PersonaSchema>;
