/**
 * Registros por enviar's data on the phone: the grouped outbox
 * (`useColaPendiente`) said as rows (`comoRegistro`), the refusals that wait
 * for a person (`useRejectedRows`, terminal ones only: the retrying ones are
 * in the queue), and the cloud sync's phase. «Reintentar ahora» is a manual
 * sync (push, then pull), past the engine's own backoff. Opening the screen
 * with something queued sends it once, like the web. While the engine waits
 * on a busy or slow server the phase is «reintentando» (DS-05), and each
 * retrying row says its last and next attempt (DS-07).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { comoRegistro } from '@xangarro/caja/pendientes';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useAhora } from '../../hooks/use-ahora';
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
  const ahora = useAhora(sync.reintento != null && cola.length > 0);
  const reintento = sync.reintento != null && sync.reintento.en > ahora ? sync.reintento : null;
  const fase = faseDe(sync.phase === 'syncing', cola, reintento?.causa != null);
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
    fase,
    offline: sync.phase === 'offline',
    sinInternet: intentado && sync.phase === 'offline',
    reintento,
    ahora,
    intentado: intentado && fase === 'reintentando',
    onReintentar: () => {
      setIntentado(true);
      syncNow();
    },
    onReintentarRechazados: retry,
    onRetryLeer: () => void refetch(),
  };
}
