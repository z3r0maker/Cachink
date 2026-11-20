import { join } from 'node:path';

import { StackError } from './errors';

/**
 * Everything a corrida owns is named after its id (ADR-153 §3): its Postgres
 * container, its build, its mail and its lock. No two corridas share any of
 * them, and none of them is ever the shared `xangarro-pg`.
 */
export interface StackNames {
  /** The Docker container `db-local.sh` creates (`XG_PG_NAME`). */
  readonly pgName: string;
  /** The Next build, relative to `apps/web` (`NEXT_DIST_DIR`). */
  readonly distDir: string;
  /** Where the portal writes this corrida's mail (`EMAIL_OUTBOX_DIR`). */
  readonly outboxDir: string;
  /** The server's log. */
  readonly serverLog: string;
  /** What the reaper reads if this process dies without tearing down. */
  readonly lockFile: string;
}

/** Docker names allow 63 characters; the prefix takes 18 and a date-based id needs room. */
const ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** `tools/synth/reports/`: gitignored, and where a corrida's evidence lands anyway. */
export const reportsDir = (repoRoot: string): string => join(repoRoot, 'tools/synth/reports');

/** Where every live stack's lock file lives. */
export const locksDir = (repoRoot: string): string => join(reportsDir(repoRoot), '.stacks');

export function stackNames(id: string, repoRoot: string): StackNames {
  if (!ID.test(id)) {
    throw new StackError(
      'STACK_ID_INVALID',
      `corrida id «${id}» must be lowercase letters, digits and «-», up to 40`,
    );
  }
  const reports = reportsDir(repoRoot);
  return {
    pgName: `xangarro-pg-synth-${id}`,
    distDir: `.next-synth/${id}`,
    outboxDir: join(reports, id, 'outbox'),
    serverLog: join(reports, id, 'server.log'),
    lockFile: join(locksDir(repoRoot), `${id}.json`),
  };
}
