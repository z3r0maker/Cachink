import { z } from 'zod';

import { PersonaStatus, Positive, Text } from './common';

/** `<persona>__<scenario>__<style>__r<n>`: what ran, readable in a file name. */
export const RUN_ID = /^[a-z0-9-]+__[a-z0-9-]+__(?:task|walkthrough)__r[1-9]\d*$/;

/**
 * A finding (spec §6.4): a hypothesis the judge proposes, never a verdict.
 * The schema checks its shape. Whether it carries any evidence is a separate
 * question, because `aggregate.ts` drops one that does not (spec §6.4).
 */
export const FindingSchema = z.strictObject({
  id: z.string().regex(/^F-\d{4}-\d{2}-\d{2}-\d{3}$/, 'must look like F-2026-11-19-007'),
  run_id: z.string().regex(RUN_ID, 'must look like persona__scenario__task__r1'),
  category: z.enum([
    'bug',
    'friction',
    'comprehension',
    'agent_failure',
    'out_of_scope_expectation',
  ]),
  severity: z.enum(['critical', 'major', 'minor']),
  title: Text.max(140),
  description: Text,
  evidence: z.strictObject({
    steps: z.array(Positive),
    screenshots: z.array(Text),
    console: z.array(Text),
    network: z.array(Text),
  }),
  persona_status: PersonaStatus,
  repro: Text,
  confidence: z.enum(['high', 'medium', 'low']),
  /** Area, screen and problem, slash-separated: `caja/cobrar/boton-oculto-teclado`. */
  dedupe_key: z
    .string()
    .regex(
      /^[a-z0-9-]+(?:\/[a-z0-9-]+)+$/,
      'must be slash-separated kebab segments, like caja/cobrar/x',
    ),
});

export type Finding = z.infer<typeof FindingSchema>;

/** Whether a finding points at anything in the run: a step, a screenshot, a log line. */
export function hasEvidence(f: Pick<Finding, 'evidence'>): boolean {
  const e = f.evidence;
  return e.steps.length + e.screenshots.length + e.console.length + e.network.length > 0;
}
