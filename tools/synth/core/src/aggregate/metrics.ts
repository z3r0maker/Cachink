import type { Finding } from '../schemas/finding';
import type { Run } from '../schemas/run';

/**
 * A corrida's numbers (spec §9 `aggregate.ts`, §14): per run, what happened;
 * per persona × scenario × style, what a later corrida can be compared with.
 * A success rate is never shown on its own: only its change against a
 * comparable earlier corrida, in points (spec §9, §11).
 */
export interface RunMetric {
  readonly run_id: string;
  readonly cell: string;
  readonly repetition: number;
  readonly outcome: Run['outcome'];
  readonly success: boolean | null;
  readonly steps: number;
  readonly optimal_steps: number;
  /** The last step of an abandoned or blocked run. */
  readonly abandon_step: number | null;
  readonly console_errors: number;
  readonly agent_failures: number;
  readonly tokens: Run['tokens'];
  readonly estimated_cost_usd_cents: number;
  readonly duration_ms: number;
}

export interface CellMetric {
  readonly cell: string;
  /** Runs the harness completed; an `error` run says nothing about the app. */
  readonly runs: number;
  readonly successes: number;
  readonly mean_steps: number;
}

export interface MetricDelta {
  readonly cell: string;
  /** The change in success rate, in whole percentage points. */
  readonly success_points: number;
  /** The change in mean steps, to one decimal. */
  readonly mean_steps: number;
}

export const cellOf = (r: Pick<Run, 'persona' | 'scenario' | 'style'>) =>
  `${r.persona}__${r.scenario}__${r.style}`;

export function runMetrics(
  runs: readonly { readonly run: Run; readonly consoleErrors: number }[],
  findings: readonly Finding[],
  optimalSteps: ReadonlyMap<string, number>,
): RunMetric[] {
  return runs.map(({ run, consoleErrors }) => {
    const optimal = optimalSteps.get(run.scenario);
    if (optimal === undefined) throw new Error(`${run.id}: no optimal_steps for «${run.scenario}»`);
    const stopped = run.outcome === 'abandoned' || run.outcome === 'blocked';
    return {
      run_id: run.id,
      cell: cellOf(run),
      repetition: run.repetition,
      outcome: run.outcome,
      success: run.success,
      steps: run.steps.length,
      optimal_steps: optimal,
      abandon_step: stopped ? run.steps.length : null,
      console_errors: consoleErrors,
      agent_failures: findings.filter((f) => f.run_id === run.id && f.category === 'agent_failure')
        .length,
      tokens: run.tokens,
      estimated_cost_usd_cents: run.estimated_cost_usd_cents,
      duration_ms: run.duration_ms,
    };
  });
}

const oneDecimal = (n: number) => Math.round(n * 10) / 10;

export function cellMetrics(metrics: readonly RunMetric[]): CellMetric[] {
  const cells = [...new Set(metrics.map((m) => m.cell))].sort();
  return cells.flatMap((cell) => {
    const ran = metrics.filter((m) => m.cell === cell && m.outcome !== 'error');
    if (ran.length === 0) return [];
    return [
      {
        cell,
        runs: ran.length,
        successes: ran.filter((m) => m.success === true).length,
        mean_steps: oneDecimal(ran.reduce((s, m) => s + m.steps, 0) / ran.length),
      },
    ];
  });
}

export function metricDeltas(
  current: readonly CellMetric[],
  previous: readonly CellMetric[],
): MetricDelta[] {
  return current.flatMap((now) => {
    const before = previous.find((p) => p.cell === now.cell);
    if (before === undefined) return [];
    const rate = (c: CellMetric) => (100 * c.successes) / c.runs;
    return [
      {
        cell: now.cell,
        success_points: Math.round(rate(now) - rate(before)),
        mean_steps: oneDecimal(now.mean_steps - before.mean_steps),
      },
    ];
  });
}

export function findingDeltas(
  current: readonly string[],
  previous: readonly string[],
): { appeared: string[]; gone: string[] } {
  const was = new Set(previous);
  const is = new Set(current);
  return {
    appeared: [...is].filter((k) => !was.has(k)).sort(),
    gone: [...was].filter((k) => !is.has(k)).sort(),
  };
}

export interface CorridaCells {
  readonly id: string;
  readonly started_at: string;
  readonly cells: readonly string[];
}

/** The latest corrida that started before this one and ran at least one of its cells. */
export function comparablePrevious(
  me: CorridaCells,
  others: readonly CorridaCells[],
): string | undefined {
  const mine = new Set(me.cells);
  return others
    .filter((o) => o.id !== me.id && o.started_at < me.started_at)
    .filter((o) => o.cells.some((c) => mine.has(c)))
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0]?.id;
}
