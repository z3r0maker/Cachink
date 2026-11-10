/**
 * Submit logic for the bug-report sheet.
 *
 * Split out of `bug-report-sheet.tsx`, which had grown past the §2.6 200-line
 * file budget with a 95-line hook inside it. This module owns the two submit
 * paths (remote-first, with share-as-file as the fallback and the only route
 * when consent is off); what a report carries is `bug-report-payload.ts`'s.
 * The sheet itself is presentation.
 */

import { useCallback, useState } from 'react';
import type { DeviceContext } from '@xangarro/observability';
import type { BugReportSender } from '../../observability/bug-report-sender';
import { useLogStore } from '../../observability/observability-provider';
import { collectReport, toBugReport, toSharedReport, type ReportData } from './bug-report-payload';

/** Share callback shape, mirrored from `BugReportSheetProps['onShare']`. */
type ShareFn = (json: string, filename: string, readableTimeline?: string) => void;

/** Snapshot the log store and scrub it. Null when there is nothing to report. */
function useReportBuilder(logStore: ReturnType<typeof useLogStore>, description: string) {
  return useCallback(async (): Promise<ReportData | null> => {
    if (!logStore || !description.trim()) return null;
    const snapshot = await logStore.exportSnapshot({
      auditLimit: 50,
      errorLimit: 20,
    });
    return collectReport(snapshot);
  }, [logStore, description]);
}

interface SubmitState {
  readonly setIsExporting: (v: boolean) => void;
  readonly setStatusMessage: (v: string | undefined) => void;
  readonly setDescription: (v: string) => void;
}

/** Where a remote submit goes, and the build it reports from. */
interface RemoteTarget {
  readonly remote?: BugReportSender | null;
  readonly deviceContext?: DeviceContext | null;
}

/** Send the scrubbed report through the device API, falling back to a message. */
function useRemoteSubmit(
  buildReport: () => Promise<ReportData | null>,
  description: string,
  state: SubmitState,
  onClose: () => void,
  logStore: ReturnType<typeof useLogStore>,
  { remote, deviceContext }: RemoteTarget,
) {
  const { setIsExporting, setStatusMessage, setDescription } = state;
  return useCallback(async () => {
    if (!remote || !logStore || !description.trim()) return;
    setIsExporting(true);
    setStatusMessage(undefined);
    try {
      const data = await buildReport();
      if (!data) return;
      await remote.sendBugReport(toBugReport(description, data, deviceContext));
      setStatusMessage('✓ Reporte enviado');
      setDescription('');
      setTimeout(() => {
        setStatusMessage(undefined);
        onClose();
      }, 1500);
    } catch {
      setStatusMessage('No se pudo enviar. Intenta compartir como archivo.');
    } finally {
      setIsExporting(false);
    }
  }, [
    remote,
    deviceContext,
    logStore,
    description,
    buildReport,
    onClose,
    setIsExporting,
    setStatusMessage,
    setDescription,
  ]);
}

/** Hand the report to the platform share sheet as a JSON file. */
function useShareSubmit(
  buildReport: () => Promise<ReportData | null>,
  description: string,
  state: SubmitState,
  onShare: ShareFn,
  onClose: () => void,
  logStore: ReturnType<typeof useLogStore>,
  deviceContext?: DeviceContext | null,
  featureFlags?: Record<string, boolean> | null,
) {
  const { setIsExporting, setDescription } = state;
  return useCallback(async () => {
    if (!logStore || !description.trim()) return;
    setIsExporting(true);
    try {
      const data = await buildReport();
      if (!data) return;
      const report = toSharedReport(description, data, deviceContext, featureFlags);
      onShare(
        JSON.stringify(report, null, 2),
        `xangarro-bug-report-${Date.now()}.json`,
        data.readableTimeline,
      );
      setDescription('');
      onClose();
    } finally {
      setIsExporting(false);
    }
  }, [
    logStore,
    description,
    buildReport,
    onShare,
    onClose,
    deviceContext,
    featureFlags,
    setIsExporting,
    setDescription,
  ]);
}

export function useBugReportSubmit(
  onShare: ShareFn,
  onClose: () => void,
  remote?: BugReportSender | null,
  deviceContext?: DeviceContext | null,
  featureFlags?: Record<string, boolean> | null,
) {
  const logStore = useLogStore();
  const [description, setDescription] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const state: SubmitState = { setIsExporting, setStatusMessage, setDescription };

  const build = useReportBuilder(logStore, description);
  const handleRemoteSubmit = useRemoteSubmit(build, description, state, onClose, logStore, {
    remote,
    deviceContext,
  });
  const handleShareSubmit = useShareSubmit(
    build,
    description,
    state,
    onShare,
    onClose,
    logStore,
    deviceContext,
    featureFlags,
  );

  return {
    logStore,
    description,
    setDescription,
    isExporting,
    statusMessage,
    handleRemoteSubmit,
    handleShareSubmit,
  };
}
