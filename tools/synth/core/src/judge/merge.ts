import type { Finding } from '../schemas/finding';

/**
 * A corrida's `findings.json` holds every run's findings (spec §5). Judging a
 * run replaces its own earlier findings and keeps the others; its new ones are
 * numbered after the day's highest id, so no id is ever reused for another.
 */
export function mergeFindings(
  existing: readonly Finding[],
  fresh: readonly Finding[],
  runId: string,
  date: string,
): { readonly findings: Finding[]; readonly firstNumber: number } {
  const others = existing.filter((f) => f.run_id !== runId);
  const today = existing
    .filter((f) => f.id.startsWith(`F-${date}-`))
    .map((f) => Number(f.id.slice(-3)));
  return { findings: [...others, ...fresh], firstNumber: Math.max(0, ...today) + 1 };
}
