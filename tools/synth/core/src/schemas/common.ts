import { z } from 'zod';

/**
 * The vocabulary every Synth file shares. Each enum here is the closed list
 * the spec (docs/plan/25-synth-spec.md §6) and track S's corrections
 * (docs/plan/24-synth.md §2) name; a value outside it is a typo, not a new
 * kind of thing.
 */

/** Ids are kebab-case and double as file names: `taquero` is `taquero.yaml`. */
export const KebabId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be kebab-case: lowercase letters, digits and «-»');

/** Text a person reads: present, and not just whitespace. */
export const Text = z.string().trim().min(1, 'must not be empty');

export const PersonaKind = z.enum(['human', 'chaos', 'device']);
export type PersonaKind = z.infer<typeof PersonaKind>;

/** Who the actor signs in as. There is no «director» (track S §2). */
export const AuthAs = z.enum(['owner', 'admin', 'viewer', 'operador']);

/** `web` drives the portal in Chromium; `phone` drives the capture app on the emulator. */
export const Runner = z.enum(['web', 'phone']);

/** `task` completes the mission; `walkthrough` is the cognitive walkthrough (spec §8.2). */
export const Style = z.enum(['task', 'walkthrough']);

/** The seeds `seed.ts` knows (S-04). */
export const Seed = z.enum([
  'vacio',
  'negocio-con-catalogo-minimo',
  'negocio-con-historial-30-dias',
  'plan-al-limite',
]);

export const PersonaStatus = z.enum(['hypothesis', 'grounded']);

/** A whole number of at least 1. */
export const Positive = z.number().int().min(1);

/** A whole number of at least 0. */
export const Count = z.number().int().min(0);

/**
 * Where a behavior comes from: a file under `personas/evidence/`, optionally a
 * line or range in it (`#L12`, `#L12-L18`), or the literal `hypothesis`.
 * Relative to `personas/`, and never climbing out of `evidence/`.
 */
export const EVIDENCE_SOURCE = /^evidence\/(?!.*\.\.)[A-Za-z0-9._/-]+\.[a-z]+(?:#L\d+(?:-L\d+)?)?$/;

export const Source = z.union([
  z.literal('hypothesis'),
  z
    .string()
    .regex(
      EVIDENCE_SOURCE,
      'must be «hypothesis» or a file under evidence/, like evidence/x.md#L12',
    ),
]);

/** The evidence file a source names, relative to `tools/synth/`, or `null` for a hypothesis. */
export function evidenceFile(source: string): string | null {
  if (source === 'hypothesis') return null;
  return `personas/${source.replace(/#.*$/, '')}`;
}
