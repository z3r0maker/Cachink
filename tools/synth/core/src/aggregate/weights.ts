import type { PersonaKind } from '../schemas/common';

/**
 * The market weight each persona's findings count at (S-09's priority). A
 * human persona carries its segment's estimate (owner decision 12). A chaos or
 * device persona is not a segment: what it breaks, it breaks for every human
 * segment, so it counts at the humans' summed weight (S-10).
 */
export interface WeightedPersona {
  readonly id: string;
  readonly kind: PersonaKind;
  /** As declared: a human's estimate, or 0 for a non-human. */
  readonly weight: number;
}

const hundredths = (n: number): number => Math.round(n * 100) / 100;

export function marketWeights(personas: readonly WeightedPersona[]): Map<string, number> {
  const seen = new Set<string>();
  for (const p of personas) {
    if (seen.has(p.id)) throw new Error(`persona «${p.id}» twice`);
    seen.add(p.id);
    if (p.kind !== 'human' && p.weight !== 0) {
      throw new Error(`${p.id}: a ${p.kind} persona inherits its weight, and declares 0`);
    }
  }
  const humans = hundredths(
    personas.filter((p) => p.kind === 'human').reduce((sum, p) => sum + p.weight, 0),
  );
  return new Map(personas.map((p) => [p.id, p.kind === 'human' ? p.weight : humans]));
}
