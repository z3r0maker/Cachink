/**
 * Submit logic for the bug-report sheet.
 *
 * Split out of `bug-report-sheet.tsx`, which had grown past the §2.6 200-line
 * file budget with a 95-line hook inside it. This module owns snapshot
 * scrubbing, timeline formatting, and the two submit paths (remote-first, with
 * share-as-file as the fallback and the only route when consent is off). The
 * sheet itself is now presentation.
 */

import { useCallback, useState } from 'react';
import {
  scrubRecord,
  formatTimelineAsText,
  type BugReport,
  type DeviceContext,
  type LogSnapshot,
  type RemoteLogStore,
  type TimelineEntry,
} from '@cachink/observability';
import { useLogStore } from '../../observability/observability-provider';

/** Share callback shape, mirrored from `BugReportSheetProps['onShare']`. */
type ShareFn = (json: string, filename: string, readableTimeline?: string) => void;

function scrubSnapshot(snapshot: LogSnapshot) {
  return {
    ...snapshot,
    auditEvents: snapshot.auditEvents.map((e) => ({
      ...e,
      metadata: e.metadata ? scrubRecord(e.metadata) : undefined,
    })),
    errors: snapshot.errors.map((e) => ({
      ...e,
      context: e.context ? scrubRecord(e.context) : undefined,
      errorStack: undefined,
    })),
  };
}

function buildTimeline(snapshot: LogSnapshot): string {
  const allEntries: readonly TimelineEntry[] = [
    ...snapshot.auditEvents.map((e) => ({ type: 'audit' as const, ...e })),
    ...snapshot.errors.map((e) => ({ type: 'error' as const, ...e })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return formatTimelineAsText(allEntries);
}

/** Snapshot the log store and scrub it. Null when there is nothing to report. */
function useReportBuilder(logStore: ReturnType<typeof useLogStore>, description: string) {
  return useCallback(async () => {
    if (!logStore || !description.trim()) return null;
    const snapshot = await logStore.exportSnapshot({
      auditLimit: 50,
      errorLimit: 20,
    });
    const readableTimeline = buildTimeline(snapshot);
    const scrubbed = scrubSnapshot(snapshot);
    return { snapshot, scrubbed, readableTimeline };
  }, [logStore, description]);
}

interface SubmitState {
  readonly setIsExporting: (v: boolean) => void;
  readonly setStatusMessage: (v: string | undefined) => void;
  readonly setDescription: (v: string) => void;
}

/** The wire payload for a remote submit. */
function toBugReport(description: string, data: NonNullable<ReportData>): BugReport {
  return {
    description: description.trim(),
    deviceId: data.snapshot.deviceId,
    businessId: null,
    userId: null,
    snapshot: {
      auditEvents: data.scrubbed.auditEvents as readonly Record<string, unknown>[],
      errors: data.scrubbed.errors as readonly Record<string, unknown>[],
    },
    submittedAt: new Date().toISOString(),
  };
}

/** The richer JSON a human receives through the share sheet. */
function toSharedReport(
  description: string,
  data: NonNullable<ReportData>,
  deviceContext?: DeviceContext | null,
  featureFlags?: Record<string, boolean> | null,
): Record<string, unknown> {
  return {
    description: description.trim(),
    submittedAt: new Date().toISOString(),
    readableTimeline: data.readableTimeline,
    snapshot: data.scrubbed,
    ...(deviceContext
      ? {
          deviceModel: deviceContext.model,
          osName: deviceContext.osName,
          osVersion: deviceContext.osVersion,
          appVersion: deviceContext.appVersion,
          platform: deviceContext.platform,
        }
      : {}),
    ...(featureFlags ? { featureFlags } : {}),
  };
}

/** POST the scrubbed report to the Edge Function, falling back to a message. */
function useRemoteSubmit(
  buildReport: () => Promise<ReportData | null>,
  description: string,
  state: SubmitState,
  onClose: () => void,
  logStore: ReturnType<typeof useLogStore>,
  remote?: RemoteLogStore | null,
) {
  const { setIsExporting, setStatusMessage, setDescription } = state;
  return useCallback(async () => {
    if (!remote || !logStore || !description.trim()) return;
    setIsExporting(true);
    setStatusMessage(undefined);
    try {
      const data = await buildReport();
      if (!data) return;
      await remote.sendBugReport(toBugReport(description, data));
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
        `cachink-bug-report-${Date.now()}.json`,
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

type ReportData = Awaited<ReturnType<ReturnType<typeof useReportBuilder>>>;

export function useBugReportSubmit(
  onShare: ShareFn,
  onClose: () => void,
  remote?: RemoteLogStore | null,
  deviceContext?: DeviceContext | null,
  featureFlags?: Record<string, boolean> | null,
) {
  const logStore = useLogStore();
  const [description, setDescription] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const state: SubmitState = { setIsExporting, setStatusMessage, setDescription };

  const build = useReportBuilder(logStore, description);
  const handleRemoteSubmit = useRemoteSubmit(build, description, state, onClose, logStore, remote);
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
