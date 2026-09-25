import 'server-only';

import { eq } from 'drizzle-orm';
import { businesses, shellCounts } from '@xangarro/data-pg';

import { withTenant } from './db';
import { reportError } from './observability/report';

/**
 * The counts the app shell shows on every page.
 *
 * Until this existed, `layout.tsx` passed `pendingRows={3}` and
 * `unreadNotices={4}` as literals, and `shell.spec.ts` asserted the pill read
 * "3 registros no enviados" — a test that a constant equals itself, beside a UI
 * that told the shopkeeper a number nobody had computed.
 *
 * **The catch is load-bearing, not defensive habit.** `layout.tsx` is a server
 * component and wraps every route; an uncaught throw there hands the whole
 * portal to `global-error`, including `/suscripcion`, which reads no database
 * and works today without one. Degrading to zero keeps a database blip local to
 * three badges instead of taking down the app.
 */
export interface ShellCounts {
  readonly pendingRows: number;
  readonly unreadNotices: number;
  /** Products and clients an operator created at the counter, awaiting review. */
  readonly revisionPendiente: number;
}

const NONE: ShellCounts = { pendingRows: 0, unreadNotices: 0, revisionPendiente: 0 };

export async function loadShellCounts(businessId: string): Promise<ShellCounts> {
  try {
    return await withTenant(businessId, (tx) => shellCounts(tx, businessId));
  } catch (error) {
    // Never silent: the screens surface their own error state, but the shell
    // has nowhere to put one, so the log is the only trace.
    reportError(error, { endpoint: 'shell:counts', businessId });
    return NONE;
  }
}

/**
 * The business's logo for the sidebar brand block (N-19); null when none —
 * the wordmark renders instead. Same degradation rule as the counts: a
 * database blip must not take the shell down.
 */
export async function loadShellLogo(businessId: string): Promise<string | null> {
  try {
    return await withTenant(businessId, async (tx) => {
      const [row] = await tx
        .select({ logoUrl: businesses.logoUrl })
        .from(businesses)
        .where(eq(businesses.id, businessId));
      return row?.logoUrl ?? null;
    });
  } catch (error) {
    reportError(error, { endpoint: 'shell:logo', businessId });
    return null;
  }
}
