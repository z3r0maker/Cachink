/**
 * Whether the first download is still open (DS-10): the phone opened before
 * the snapshot's last page (a poor connection, the app closed mid-way), so
 * Inventario says «Terminando de descargar el inventario…» until a sync
 * finishes it. Keyed under the cloud sync's queries: every run reads it again.
 */
import { useQuery } from '@tanstack/react-query';
import { snapshotProgress } from '@xangarro/sync';
import { CLOUD_SYNC_QUERY_KEY } from '../../app/cloud-sync-bridge';
import { useAppConfigRepository } from '../../app/repository-provider';

export const SNAPSHOT_KEY = [...CLOUD_SYNC_QUERY_KEY, 'snapshot'] as const;

export function useSnapshotPendiente(): boolean {
  const appConfig = useAppConfigRepository();
  const q = useQuery({
    queryKey: SNAPSHOT_KEY,
    queryFn: async () => (await snapshotProgress(appConfig)) !== null,
  });
  return q.data === true;
}
