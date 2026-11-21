/**
 * Sending a report from the sheet, and what waits to be sent (M-23).
 *
 * - `useEnviarReporte`: builds the payload (the tap, the sentence, the build,
 *   the scrubbed log snapshot) and hands it to `sendReport`, which sends it or
 *   keeps it on the device when there is no connection.
 * - `useReportesPorEnviar`: how many wait, for Mi turno's row and the sheet.
 * - `useDrenarReportes`: sends what waited after every sync run that reached
 *   the server (so the connection is back, whether or not the caja had
 *   noticed it was gone) and when the app comes back to the front. One drain
 *   at a time.
 */
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { drainReports, queuedReports, sendReport, type ReportResult } from '@xangarro/application';
import type { DeviceContext } from '@xangarro/observability';
import { useCloudSync } from '../app/cloud-sync-bridge';
import { useAppConfigRepository } from '../app/repository-provider';
import { useBugReportSender } from '../observability/bug-report-sender';
import { useLogStore } from '../observability/observability-provider';
import {
  collectReport,
  toBugReport,
  type ReportInput,
} from '../screens/Settings/bug-report-payload';

export const REPORTES_QUERY_KEY = ['reportes', 'porEnviar'] as const;

export function useReportesPorEnviar(): number {
  const store = useAppConfigRepository();
  const q = useQuery({
    queryKey: REPORTES_QUERY_KEY,
    queryFn: async () => (await queuedReports(store)).length,
  });
  return q.data ?? 0;
}

export function useEnviarReporte(
  deviceContext?: DeviceContext | null,
): (input: ReportInput) => Promise<ReportResult> {
  const sender = useBugReportSender();
  const store = useAppConfigRepository();
  const logStore = useLogStore();
  const queryClient = useQueryClient();
  return useCallback(
    async (input) => {
      if (sender === null) return 'failed';
      try {
        const snapshot = logStore
          ? await logStore.exportSnapshot({ auditLimit: 50, errorLimit: 20 })
          : null;
        const data = snapshot === null ? null : collectReport(snapshot);
        return await sendReport(toBugReport(input, data, deviceContext), { store, sender });
      } catch {
        return 'failed';
      } finally {
        void queryClient.invalidateQueries({ queryKey: REPORTES_QUERY_KEY });
      }
    },
    [sender, store, logStore, queryClient, deviceContext],
  );
}

export function useDrenarReportes(): void {
  const sender = useBugReportSender();
  const store = useAppConfigRepository();
  const queryClient = useQueryClient();
  const { lastSyncAt } = useCloudSync().state;
  const running = useRef(false);
  const drain = useCallback(async () => {
    if (sender === null || running.current) return;
    running.current = true;
    try {
      const { sent } = await drainReports({ store, sender });
      if (sent > 0) void queryClient.invalidateQueries({ queryKey: REPORTES_QUERY_KEY });
    } catch {
      // The queue stays as it was; the next reconnect or foreground tries again.
    } finally {
      running.current = false;
    }
  }, [sender, store, queryClient]);
  useEffect(() => {
    if (lastSyncAt !== null) void drain();
  }, [lastSyncAt, drain]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void drain();
    });
    return () => sub.remove();
  }, [drain]);
}
