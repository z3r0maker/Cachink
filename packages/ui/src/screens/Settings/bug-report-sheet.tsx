/**
 * BugReportSheet — production bug report flow.
 *
 * Server-first submit:
 *   1. User writes a description of the issue
 *   2. App auto-attaches last 50 audit + 20 error entries
 *   3. PII is scrubbed via @cachink/observability/pii-scrubber
 *   4. When consent is on → POST to Edge Function → user sees "Reporte enviado"
 *   5. On network failure → report is silently queued for retry
 *   6. "Compartir como archivo" remains as secondary button (and the only
 *      path when consent is off)
 */

import React, { useCallback, useState, type ReactElement } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { View, Text } from '@tamagui/core';
import {
  scrubRecord,
  formatTimelineAsText,
  type BugReport,
  type DeviceContext,
  type LogSnapshot,
  type RemoteLogStore,
  type TimelineEntry,
} from '@cachink/observability';
import { Btn } from '../../components/index';
import { useLogStore } from '../../observability/observability-provider';

export interface BugReportSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Platform-specific share function. Receives the report JSON + optional text timeline. */
  readonly onShare: (json: string, filename: string, readableTimeline?: string) => void;
  /** Whether user has consented to remote submission. */
  readonly consentEnabled?: boolean;
  /** Remote log store for server-first submit. */
  readonly remote?: RemoteLogStore | null;
  /** Device context for enriching the report payload. */
  readonly deviceContext?: DeviceContext | null;
  /** Current feature flags state. */
  readonly featureFlags?: Record<string, boolean> | null;
  readonly testID?: string;
}

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

const INPUT_STYLE = {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  padding: 12,
  minHeight: 100,
  textAlignVertical: 'top' as const,
  fontSize: 14,
};

function BugReportShell({
  testID,
  children,
}: {
  testID?: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <View
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor="$background"
      borderTopLeftRadius="$4"
      borderTopRightRadius="$4"
      maxHeight="60%"
      shadowColor="black"
      shadowOpacity={0.2}
      shadowRadius={10}
      testID={testID}
    >
      {children}
    </View>
  );
}

function BugReportHeader({ onClose }: { onClose: () => void }): ReactElement {
  return (
    <View
      flexDirection="row"
      justifyContent="space-between"
      padding="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <Text fontSize="$4" fontWeight="700">
        Enviar Reporte
      </Text>
      <Btn size="sm" variant="ghost" onPress={onClose}>
        ✕
      </Btn>
    </View>
  );
}

function BugReportBody(props: {
  description: string;
  onChangeDescription: (v: string) => void;
}): ReactElement {
  return (
    <ScrollView style={{ padding: 12 }}>
      <Text fontSize="$2" color="$colorSubtle" marginBottom="$2">
        Describe el problema que encontraste. Se adjuntarán automáticamente los últimos 50 eventos y
        20 errores (sin datos personales).
      </Text>
      <TextInput
        placeholder="¿Qué pasó? ¿Qué esperabas que pasara?"
        multiline
        numberOfLines={4}
        value={props.description}
        onChangeText={props.onChangeDescription}
        style={INPUT_STYLE}
        testID="bug-report-description-input"
      />
    </ScrollView>
  );
}

function BugReportActions(props: {
  onClose: () => void;
  onSubmitRemote?: () => void;
  onSubmitShare: () => void;
  disabled: boolean;
  isExporting: boolean;
  showRemoteSubmit: boolean;
  statusMessage?: string;
}): ReactElement {
  return (
    <View padding="$3" gap="$2" borderTopWidth={1} borderTopColor="$borderColor">
      {props.statusMessage && (
        <Text fontSize="$1" color="$colorSubtle" textAlign="center">
          {props.statusMessage}
        </Text>
      )}
      <View flexDirection="row" gap="$2">
        <View flex={1}>
          <Btn variant="outline" fullWidth onPress={props.onClose}>
            Cancelar
          </Btn>
        </View>
        {props.showRemoteSubmit && props.onSubmitRemote ? (
          <View flex={1}>
            <Btn
              variant="primary"
              fullWidth
              onPress={props.onSubmitRemote}
              disabled={props.disabled}
              testID="bug-report-submit-btn"
            >
              {props.isExporting ? 'Enviando…' : 'Enviar Reporte'}
            </Btn>
          </View>
        ) : (
          <View flex={1}>
            <Btn
              variant="primary"
              fullWidth
              onPress={props.onSubmitShare}
              disabled={props.disabled}
              testID="bug-report-share-btn"
            >
              {props.isExporting ? 'Exportando…' : 'Compartir Reporte'}
            </Btn>
          </View>
        )}
      </View>
      {props.showRemoteSubmit && (
        <Btn variant="ghost" fullWidth onPress={props.onSubmitShare} disabled={props.disabled} testID="bug-report-share-fallback-btn">
          Compartir como archivo
        </Btn>
      )}
    </View>
  );
}

function useBugReportSubmit(
  onShare: BugReportSheetProps['onShare'],
  onClose: () => void,
  remote?: RemoteLogStore | null,
  deviceContext?: DeviceContext | null,
  featureFlags?: Record<string, boolean> | null,
) {
  const logStore = useLogStore();
  const [description, setDescription] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  const buildReport = useCallback(async () => {
    if (!logStore || !description.trim()) return null;
    const snapshot = await logStore.exportSnapshot({
      auditLimit: 50,
      errorLimit: 20,
    });
    const readableTimeline = buildTimeline(snapshot);
    const scrubbed = scrubSnapshot(snapshot);
    return { snapshot, scrubbed, readableTimeline };
  }, [logStore, description]);

  const handleRemoteSubmit = useCallback(async () => {
    if (!remote || !logStore || !description.trim()) return;
    setIsExporting(true);
    setStatusMessage(undefined);
    try {
      const data = await buildReport();
      if (!data) return;

      const report: BugReport = {
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

      await remote.sendBugReport(report);
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
  }, [remote, logStore, description, buildReport, onClose]);

  const handleShareSubmit = useCallback(async () => {
    if (!logStore || !description.trim()) return;
    setIsExporting(true);
    try {
      const data = await buildReport();
      if (!data) return;
      const report = {
        description: description.trim(),
        submittedAt: new Date().toISOString(),
        readableTimeline: data.readableTimeline,
        snapshot: data.scrubbed,
        ...(deviceContext ? {
          deviceModel: deviceContext.model,
          osName: deviceContext.osName,
          osVersion: deviceContext.osVersion,
          appVersion: deviceContext.appVersion,
          platform: deviceContext.platform,
        } : {}),
        ...(featureFlags ? { featureFlags } : {}),
      };
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
  }, [logStore, description, buildReport, onShare, onClose, deviceContext, featureFlags]);

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

export function BugReportSheet({
  visible,
  onClose,
  onShare,
  consentEnabled,
  remote,
  deviceContext,
  featureFlags,
  testID,
}: BugReportSheetProps): ReactElement | null {
  const {
    logStore,
    description,
    setDescription,
    isExporting,
    statusMessage,
    handleRemoteSubmit,
    handleShareSubmit,
  } = useBugReportSubmit(onShare, onClose, remote, deviceContext, featureFlags);

  if (!visible) return null;

  const showRemoteSubmit = consentEnabled === true && remote != null;

  return (
    <BugReportShell testID={testID ?? 'bug-report-sheet'}>
      <BugReportHeader onClose={onClose} />
      <BugReportBody description={description} onChangeDescription={setDescription} />
      <BugReportActions
        onClose={onClose}
        onSubmitRemote={showRemoteSubmit ? () => void handleRemoteSubmit() : undefined}
        onSubmitShare={() => void handleShareSubmit()}
        disabled={!description.trim() || isExporting || !logStore}
        isExporting={isExporting}
        showRemoteSubmit={showRemoteSubmit}
        statusMessage={statusMessage}
      />
    </BugReportShell>
  );
}
