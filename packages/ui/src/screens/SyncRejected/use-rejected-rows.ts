/**
 * useRejectedRows — "No enviados" data (A-08). The bridge invalidates it
 * after every sync run, so a retried row leaves the list once accepted and
 * comes back with its button if the server refuses it again.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RejectedRow } from '@xangarro/sync';
import { CLOUD_SYNC_QUERY_KEY, useCloudSync, type RowRef } from '../../app/cloud-sync-bridge';

export const REJECTED_ROWS_KEY = [...CLOUD_SYNC_QUERY_KEY, 'rejected'] as const;

export function useRejectedRows(): {
  readonly rows: readonly RejectedRow[];
  readonly loading: boolean;
  readonly retry: (rows: readonly RowRef[]) => void;
} {
  const { listRejected, requeue } = useCloudSync();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: REJECTED_ROWS_KEY, queryFn: listRejected });
  const retry = (rows: readonly RowRef[]): void => {
    void requeue(rows).then(() => queryClient.invalidateQueries({ queryKey: REJECTED_ROWS_KEY }));
  };
  return { rows: query.data ?? [], loading: query.isLoading, retry };
}
