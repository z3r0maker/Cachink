/**
 * The suite's two halves, which CI runs on separate runners (ADR-144).
 *
 * The parallel phase reads the seeded tenant under its write lock: the
 * viewport projects and the edge days. The serial phase is everything else,
 * one worker at a time: `unlock`, `serial`, `operador`, `devices`, `sync`,
 * `webkit-operador`. In one run the serial phase waits for the parallel one
 * because they share a database. On two runners each half has a Postgres of
 * its own, so the wait buys nothing.
 *
 *   XG_E2E_PHASE=parallel playwright test --shard=1/2   # half of the reads
 *   XG_E2E_PHASE=serial playwright test                 # the whole chain
 *
 * Unset, the config is the whole suite in one run, exactly as before. The
 * serial phase is defined as "not parallel" on purpose: a project added
 * without a thought for phases still runs somewhere.
 */

export type Phase = 'parallel' | 'serial';

/** The phase this run is limited to, or `undefined` for the whole suite. */
export function e2ePhase(): Phase | undefined {
  const phase = process.env.XG_E2E_PHASE;
  if (phase === undefined || phase === '') return undefined;
  if (phase === 'parallel' || phase === 'serial') return phase;
  throw new Error(`XG_E2E_PHASE must be "parallel" or "serial", not "${phase}".`);
}

/** The project every other one depends on, so both phases keep it. */
const SETUP = 'setup';

/**
 * The projects of `phase`, in config order. `parallel` names the phase's own
 * projects; the serial phase is everything outside them.
 */
export function projectsForPhase<P extends { name?: string }>(
  all: readonly P[],
  parallel: ReadonlySet<string>,
  phase: Phase | undefined,
): P[] {
  if (phase === undefined) return [...all];
  const inParallel = (p: P): boolean => parallel.has(p.name ?? '');
  if (phase === 'parallel') return all.filter((p) => p.name === SETUP || inParallel(p));
  return all.filter((p) => !inParallel(p));
}
