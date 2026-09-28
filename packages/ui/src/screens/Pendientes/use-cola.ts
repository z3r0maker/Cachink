/**
 * The phone's outbox, grouped as Registros por enviar lists it
 * (`colaPendiente`). Keyed under the cloud sync's queries, so every sync run
 * refreshes it along with the pill; Avisos' «N registros siguen sin enviarse»
 * reads the same entry.
 */
import { useQuery } from '@tanstack/react-query';
import type { PendienteCrudo } from '@xangarro/caja/lectura';
import { CLOUD_SYNC_QUERY_KEY } from '../../app/cloud-sync-bridge';
import { useDatabase } from '../../database/index';
import { colaPendiente } from '../../sync/cola/index';

export const COLA_KEY = [...CLOUD_SYNC_QUERY_KEY, 'cola'] as const;

export function useColaPendiente() {
  const db = useDatabase();
  return useQuery<readonly PendienteCrudo[], Error>({
    queryKey: COLA_KEY,
    queryFn: () => colaPendiente(db),
  });
}
