/**
 * Registros por enviar's data on the phone: the grouped outbox
 * (`useColaPendiente`) said as rows (`comoRegistro`), the refusals that wait
 * for a person (`useRejectedRows`, terminal ones only: the retrying ones are
 * in the queue), and the cloud sync's phase. «Reintentar ahora» is a manual
 * sync (push, then pull), past the engine's own backoff. Opening the screen
 * with something queued sends it once, like the web.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { comoRegistro } from '@xangarro/caja/pendientes';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useRejectedRows } from '../SyncRejected/use-rejected-rows';
import type { PendientesScreenProps } from './pendientes-screen';
import { faseDe } from './pendientes-logica';
import { useColaPendiente } from './use-cola';

export function usePendientes(): PendientesScreenProps {
  const q = useColaPendiente();
  const { rows, retry } = useRejectedRows();
  const { state: sync, syncNow } = useCloudSync();
  const [intentado, setIntentado] = useState(false);
  const cola = useMemo(() => (q.data ?? []).map(comoRegistro), [q.data]);
  const alAbrir = useRef(false);
  useEffect(() => {
    if (alAbrir.current || q.data === undefined) return;
    alAbrir.current = true;
    if (q.data.length > 0 && sync.phase !== 'syncing') syncNow();
  }, [q.data, sync.phase, syncNow]);
  const { refetch } = q;
  return {
    state: q.isError ? 'error' : q.data === undefined ? 'loading' : 'happy',
    cola,
    rechazados: rows.filter((r) => !r.retryable),
    fase: faseDe(sync.phase === 'syncing', cola),
    offline: sync.phase === 'offline',
    sinInternet: intentado && sync.phase === 'offline',
    onReintentar: () => {
      setIntentado(true);
      syncNow();
    },
    onReintentarRechazados: retry,
    onRetryLeer: () => void refetch(),
  };
}
