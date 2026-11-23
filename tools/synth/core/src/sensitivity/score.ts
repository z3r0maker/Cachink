import type { Finding } from '../schemas/finding';
import type { Run } from '../schemas/run';
import type { SeededBug } from '../seeded/bugs';

/**
 * S-13's recall (spec §9 `sensitivity.ts`). A seeded bug is detected on a
 * runner when the judge, on a run of the scenario it was aimed at, reported a
 * finding of the expected category whose `dedupe_key` sits under the
 * expected `área/acción`, and the clean smoke had not already found that in
 * the same cell. A bug that also reaches the phone is measured there on its
 * own. A scenario with no finished run is not measured, rather than missed.
 */
export type Category = SeededBug['expected_category'];
export type Runner = 'web' | 'phone';

/** What the clean smoke found: per cell, category and key. */
export interface BaselineEntry {
  readonly cell: string;
  readonly category: string;
  readonly key: string;
}

export interface Measurement {
  readonly bug: string;
  readonly category: Category;
  readonly runner: Runner;
  readonly measured: boolean;
  readonly hit: boolean;
  /** The finding that counted, when one did. */
  readonly finding: string | null;
  /** Right category or right key, not both: there to tune the judge's prompt. */
  readonly nearMisses: string[];
}

export const cellOfRun = (r: Pick<Run, 'persona' | 'scenario' | 'style'>): string =>
  `${r.persona}__${r.scenario}__${r.style}`;

const under = (key: string, prefix: string): boolean =>
  key === prefix || key.startsWith(`${prefix}/`);

function measureOn(
  bug: SeededBug,
  target: { readonly runner: Runner; readonly scenario: string },
  runs: readonly Run[],
  findings: readonly Finding[],
  baseline: readonly BaselineEntry[],
): Measurement {
  const aimed = runs.filter((r) => r.scenario === target.scenario && r.outcome !== 'error');
  const cells = new Map(aimed.map((r) => [r.id, cellOfRun(r)]));
  const known = (f: Finding) =>
    baseline.some(
      (b) => b.cell === cells.get(f.run_id) && b.category === f.category && b.key === f.dedupe_key,
    );
  const fresh = findings.filter((f) => cells.has(f.run_id) && !known(f));
  const cat = (f: Finding) => f.category === bug.expected_category;
  const key = (f: Finding) => under(f.dedupe_key, bug.expected_dedupe_prefix);
  const hit = fresh.find((f) => cat(f) && key(f));
  return {
    bug: bug.id,
    category: bug.expected_category,
    runner: target.runner,
    measured: aimed.length > 0,
    hit: hit !== undefined,
    finding: hit?.id ?? null,
    nearMisses: fresh.filter((f) => cat(f) !== key(f)).map((f) => `${f.category} ${f.dedupe_key}`),
  };
}

/** The bug's measurements in its corrida: on the web, and on the phone when it reaches it. */
export function measure(
  bug: SeededBug,
  runs: readonly Run[],
  findings: readonly Finding[],
  baseline: readonly BaselineEntry[],
): Measurement[] {
  const targets: { readonly runner: Runner; readonly scenario: string }[] = [
    { runner: 'web', scenario: bug.scenario },
    ...(bug.phone ? [{ runner: 'phone' as const, scenario: bug.phone.scenario }] : []),
  ];
  return targets.map((t) => measureOn(bug, t, runs, findings, baseline));
}

export interface Tally {
  readonly hits: number;
  readonly of: number;
  /** Null when nothing was measured: never a 0 that means «no data». */
  readonly recall: number | null;
}

export interface Recall {
  readonly overall: Tally;
  readonly byCategory: Readonly<Record<Category, Tally>>;
  readonly byRunner: Readonly<Record<Runner, Tally>>;
}

function tally(ms: readonly Measurement[]): Tally {
  const measured = ms.filter((m) => m.measured);
  const hits = measured.filter((m) => m.hit).length;
  return {
    hits,
    of: measured.length,
    recall: measured.length === 0 ? null : hits / measured.length,
  };
}

export function recall(ms: readonly Measurement[]): Recall {
  const by = <K extends string>(keys: readonly K[], pick: (m: Measurement) => K) =>
    Object.fromEntries(keys.map((k) => [k, tally(ms.filter((m) => pick(m) === k))])) as Record<
      K,
      Tally
    >;
  return {
    overall: tally(ms),
    byCategory: by(['bug', 'friction', 'comprehension'] as const, (m) => m.category),
    byRunner: by(['web', 'phone'] as const, (m) => m.runner),
  };
}
