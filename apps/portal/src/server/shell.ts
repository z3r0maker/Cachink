import 'server-only';

import { shellCounts } from '@xangarro/data-pg';

import { withTenant } from './db';

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
 * two badges instead of taking down the app.
 */
export interface ShellCounts {
  readonly pendingRows: number;
  readonly unreadNotices: number;
}

const NONE: ShellCounts = { pendingRows: 0, unreadNotices: 0 };

export async function loadShellCounts(businessId: string): Promise<ShellCounts> {
  try {
    return await withTenant(businessId, (tx) => shellCounts(tx));
  } catch (error) {
    // Never silent: the screens surface their own error state, but the shell
    // has nowhere to put one, so the log is the only trace.
    console.error('[shell] counts unavailable, showing zero', error);
    return NONE;
  }
}
