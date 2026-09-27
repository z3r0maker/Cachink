/**
 * The retention and expiry sweeps the daily digest cron runs (N-05, N-07,
 * N-18, N-61, DB2-CRON-01). Each step is optional, logs its own failure and
 * never costs the digest: housekeeping that fails today runs again tomorrow.
 * The counts go to the cron's JSON answer, for the log only.
 */

type Step = () => Promise<number>;
type Log = (message: string, error: unknown) => void;

export interface HousekeepingDeps {
  /** N-05's follow-up: expired staff sessions. */
  readonly pruneSessions?: Step;
  /** N-61: geographic counters past their retention. */
  readonly pruneGeo?: Step;
  /** N-07: latency counters past their retention. */
  readonly pruneLatency?: Step;
  /** DB2-CRON-01: `xangarro.security_prune()` — the portal's dead sessions
   * and stale throttle rows, which nothing pruned before. */
  readonly prunePortalSecurity?: Step;
  /** N-18: expire approvals the tenant ignored for 14 days, and purge the
   * files of rows resolved 30+ days ago (LFPDPPP). */
  readonly expireAssisted?: Step;
  readonly purgeAssistedFiles?: Step;
}

export interface HousekeepingResult {
  readonly prunedSessions: number | null;
  readonly prunedGeo: number | null;
  readonly prunedLatency: number | null;
  readonly prunedPortalSecurity: number | null;
  readonly expiredAssisted: number;
  readonly purgedAssistedFiles: number;
}

/** One sweep; null when it is not wired or it failed (and was logged). */
async function sweep(step: Step | undefined, what: string, log: Log): Promise<number | null> {
  if (step === undefined) return null;
  try {
    return await step();
  } catch (error) {
    log(`digest: ${what} failed`, error);
    return null;
  }
}

/** N-18's pair runs as one step, as it always has. */
async function assistedSweeps(deps: HousekeepingDeps, log: Log) {
  try {
    return {
      expired: deps.expireAssisted ? await deps.expireAssisted() : 0,
      purgedFiles: deps.purgeAssistedFiles ? await deps.purgeAssistedFiles() : 0,
    };
  } catch (error) {
    log('digest: assisted-import sweeps failed', error);
    return { expired: 0, purgedFiles: 0 };
  }
}

export async function housekeeping(deps: HousekeepingDeps, log: Log): Promise<HousekeepingResult> {
  const prunedSessions = await sweep(deps.pruneSessions, 'pruning staff sessions', log);
  const prunedGeo = await sweep(deps.pruneGeo, 'pruning geo counters', log);
  const prunedLatency = await sweep(deps.pruneLatency, 'pruning latency counters', log);
  const prunedPortalSecurity = await sweep(
    deps.prunePortalSecurity,
    'pruning portal sessions and throttle',
    log,
  );
  const assisted = await assistedSweeps(deps, log);
  return {
    prunedSessions,
    prunedGeo,
    prunedLatency,
    prunedPortalSecurity,
    expiredAssisted: assisted.expired,
    purgedAssistedFiles: assisted.purgedFiles,
  };
}
