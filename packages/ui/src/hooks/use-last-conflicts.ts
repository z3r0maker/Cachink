/**
 * `useLastConflicts` — reads the N newest rows from the
 * `__cachink_conflicts` audit table populated by the LAN sync applier
 * (ADR-029 / P1D-M4 C20).
 *
 * CLAUDE.md §1 mandates: "Conflicts surface inline, never silently."
 * This hook is the data source for the DirectorHome
 * `ConflictosRecientesCard` — when the result is non-empty, the card
 * renders a neutral "Conflictos recientes" block listing the most recent
 * losers so the Director can investigate.
 *
 * The hook intentionally never throws — if the conflicts table hasn't
 * been created yet (pre-P1D apps running an older migration), it
 * returns an empty array so the card simply doesn't render.
 */

import { sql } from 'drizzle-orm';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '../database/_internal';
import { syncKeys } from './query-keys';

export type ConflictDirection = 'inbound' | 'outbound';

export interface SyncConflictRow {
  readonly id: number;
  readonly detectedAt: string;
  readonly direction: ConflictDirection;
  readonly tableName: string;
  readonly rowId: string;
  readonly loserUpdatedAt: string;
  readonly loserDeviceId: string;
  readonly winnerUpdatedAt: string;
  readonly winnerDeviceId: string;
  readonly reason: string;
}

export interface UseLastConflictsResult {
  readonly conflicts: readonly SyncConflictRow[];
  readonly loading: boolean;
  readonly error: Error | null;
}

export const DEFAULT_CONFLICT_LIMIT = 10;

interface ConflictRowRaw {
  id: number;
  detected_at: string;
  direction: ConflictDirection;
  table_name: string;
  row_id: string;
  loser_updated_at: string;
  loser_device_id: string;
  winner_updated_at: string;
  winner_device_id: string;
  reason: string;
}

function mapConflictRow(r: ConflictRowRaw): SyncConflictRow {
  return {
    id: r.id,
    detectedAt: r.detected_at,
    direction: r.direction,
    tableName: r.table_name,
    rowId: r.row_id,
    loserUpdatedAt: r.loser_updated_at,
    loserDeviceId: r.loser_device_id,
    winnerUpdatedAt: r.winner_updated_at,
    winnerDeviceId: r.winner_device_id,
    reason: r.reason,
  };
}

async function fetchConflicts(
  db: ReturnType<typeof useDatabase>,
  limit: number,
): Promise<readonly SyncConflictRow[]> {
  try {
    const rows = (await db.all(
      sql`SELECT id, detected_at, direction, table_name, row_id,
                 loser_updated_at, loser_device_id,
                 winner_updated_at, winner_device_id, reason
          FROM __cachink_conflicts
          ORDER BY id DESC
          LIMIT ${limit}`,
    )) as ConflictRowRaw[];
    return rows.map(mapConflictRow);
  } catch {
    // Conflict table may not exist yet (pre-P1D migration); treat as empty.
    return [];
  }
}

export function useLastConflicts(limit: number = DEFAULT_CONFLICT_LIMIT): UseLastConflictsResult {
  const db = useDatabase();
  const query = useQuery({
    queryKey: syncKeys.conflicts(limit),
    queryFn: () => fetchConflicts(db, limit),
  });
  return {
    conflicts: query.data ?? [],
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
  };
}
