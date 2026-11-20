import { z } from 'zod';

import { AuthAs, KebabId, PersonaKind, Positive, Runner, Seed, Text } from './common';

/**
 * A scenario (spec §6.2): the mission is the only thing the actor is told.
 * Success is never judged by a model: each check names an SQL assertion the
 * runner evaluates under `withTenant` after the run (S-05).
 */
const SuccessCheck = z.strictObject({
  check: KebabId,
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const ScenarioSchema = z
  .strictObject({
    id: KebabId,
    title: Text,
    mission: Text,
    runner: Runner,
    start: z.strictObject({
      seed: Seed,
      auth_as: AuthAs,
      /** A path on the stack's own host: the runner owns the host (allowed_hosts). */
      url: z.string().regex(/^\/(?!\/)/, 'must be a path starting with «/», not a URL'),
    }),
    success: z.array(SuccessCheck).min(1),
    optimal_steps: Positive,
    interruptions: z.array(KebabId),
    applies_to: z.array(PersonaKind).min(1),
  })
  .superRefine((s, ctx) => {
    const issue = (path: string[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    // The capture app is single-role: a phone signs in as an operator (ADR-053).
    if (s.runner === 'phone' && s.start.auth_as !== 'operador') {
      issue(
        ['start', 'auth_as'],
        'the phone runner signs in as «operador»: the capture app has no member sign-in',
      );
    }
    if (s.start.seed === 'sin-cuenta') signupIssues(s, issue);
  });

/**
 * `sin-cuenta` (S-10): no tenant and no door. The actor signs up on the web
 * at /signup, and the account it makes is an owner's.
 */
function signupIssues(
  s: { runner: string; start: { auth_as: string; url: string } },
  issue: (path: string[], message: string) => void,
): void {
  if (s.runner !== 'web') issue(['runner'], '«sin-cuenta» is a web signup: the phone has none');
  if (s.start.auth_as !== 'owner') {
    issue(['start', 'auth_as'], '«sin-cuenta» signs up an owner');
  }
  if (!/^\/signup(?:[?#]|$)/.test(s.start.url)) {
    issue(['start', 'url'], '«sin-cuenta» starts at /signup: there is no door to walk');
  }
}

export type Scenario = z.infer<typeof ScenarioSchema>;
