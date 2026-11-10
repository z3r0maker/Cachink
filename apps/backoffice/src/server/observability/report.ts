import { describeError, stackFrames } from '@xangarro/config/error-report';

/**
 * Where every failure the console catches goes: one structured line on stderr
 * (audit F-14). It replaces `console.error(label, error)` at each call site,
 * which printed the whole object — for a failed query, the SQL with its bound
 * parameters and Postgres' `detail`, into the runtime logs.
 *
 * What may be said is the portal's rule, not a second one
 * (`@xangarro/config/error-report`): a database error is its name, its
 * SQLSTATE and the names of the constraint, table and column; any other error
 * keeps its message. The console has no Sentry, so the line carries the stack
 * frames too. They say where, and never what with.
 */
const MAX_FRAMES = 12;

export function reportError(error: unknown, where: string): void {
  const stack = stackFrames(error)
    .slice(0, MAX_FRAMES)
    .map((frame) => frame.trim());
  console.error(JSON.stringify({ evt: 'error', where, ...describeError(error), stack }));
}
