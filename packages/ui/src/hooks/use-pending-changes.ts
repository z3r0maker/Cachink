/**
 * `usePendingChanges` — count of local rows that have been mutated but
 * not yet pushed to a sync server (ADR-039 wizard safety rail).
 *
 * Powers the "Tienes cambios sin sincronizar" blocker on Settings
 * re-runs. Returns `0` for `mode === 'local'` / `'lan-server'` (no
 * outbound sync) and for `null` (pre-wizard) — there is nothing to
 * lose. For `'lan-client'` and `'cloud'`, compares
 * `MAX(__cachink_change_log.id)` to `localPushHwm`; the difference is
 * the pending count.
 *
 * Defensive against fresh installs where the change-log table doesn't
 * yet exist (returns 0).
 */

import { useQuery } from '@tanstack/react-query';
import { sql } from 'drizzle-orm';
import { readHwm, type CachinkDatabase } from '@cachink/data';
import { useDatabase } from '../database/_internal';
import { useMode } from '../app-config/index';
import { syncKeys } from './query-keys';

export interface UsePendingChangesResult {
  readonly count: number;
  readonly loading: boolean;
}

async function safeMaxChangeLogId(db: CachinkDatabase): Promise<number> {
  try {
    const rows = (await db.all(
      sql`SELECT MAX("id") AS "max" FROM "__cachink_change_log"`,
    )) as Array<{ max: number | null }>;
    return rows[0]?.max ?? 0;
  } catch {
    // Table missing on a fresh install before migrations run.
    return 0;
  }
}

async function safePushHwm(db: CachinkDatabase): Promise<number> {
  try {
    return await readHwm(db, 'localPushHwm');
  } catch {
    return 0;
  }
}

export function usePendingChanges(): UsePendingChangesResult {
  const db = useDatabase();
  const mode = useMode();
  const enabled = mode === 'lan-client' || mode === 'cloud';
  const query = useQuery({
    queryKey: syncKeys.pendingChanges(),
    enabled,
    queryFn: async () => {
      const [maxId, hwm] = await Promise.all([safeMaxChangeLogId(db), safePushHwm(db)]);
      return Math.max(0, maxId - hwm);
    },
  });
  return {
    count: enabled ? (query.data ?? 0) : 0,
    loading: enabled && query.isLoading,
  };
}
