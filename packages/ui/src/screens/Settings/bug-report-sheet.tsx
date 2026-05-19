/**
 * BugReportSheet — production bug report flow.
 *
 * 1. User writes a description of the issue
 * 2. App auto-attaches last 50 audit + 20 error entries
 * 3. PII is scrubbed via @cachink/observability/pii-scrubber
 * 4. Exported as shareable .json file (WhatsApp / AirDrop / Email)
 *
 * This component renders as a bottom sheet (or modal on desktop) that
 * the user triggers from Settings.
 */

import React, { useCallback, useState, type ReactElement } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { View, Text } from '@tamagui/core';
import {
  scrubRecord,
  formatTimelineAsText,
  type LogSnapshot,
  type TimelineEntry,
} from '@cachink/observability';
import { Btn } from '../../components/index';
import { useLogStore } from '../../observability/observability-provider';

export interface BugReportSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Platform-specific share function. Receives the report JSON + optional text timeline. */
  readonly onShare: (json: string, filename: string, readableTimeline?: string) => void;
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
      />
      <Text fontSize="$1" color="$colorSubtle" marginTop="$2">
        El reporte se comparte como archivo JSON. Puedes enviarlo por WhatsApp, AirDrop, o correo
        electrónico.
      </Text>
    </ScrollView>
  );
}

function BugReportActions(props: {
  onClose: () => void;
  onSubmit: () => void;
  disabled: boolean;
  isExporting: boolean;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      padding="$3"
      gap="$2"
      borderTopWidth={1}
      borderTopColor="$borderColor"
    >
      <View flex={1}>
        <Btn variant="outline" fullWidth onPress={props.onClose}>
          Cancelar
        </Btn>
      </View>
      <View flex={1}>
        <Btn variant="primary" fullWidth onPress={props.onSubmit} disabled={props.disabled}>
          {props.isExporting ? 'Exportando…' : 'Compartir Reporte'}
        </Btn>
      </View>
    </View>
  );
}

function useBugReportSubmit(onShare: BugReportSheetProps['onShare'], onClose: () => void) {
  const logStore = useLogStore();
  const [description, setDescription] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!logStore || !description.trim()) return;
    setIsExporting(true);
    try {
      const snapshot: LogSnapshot = await logStore.exportSnapshot({
        auditLimit: 50,
        errorLimit: 20,
      });
      const readableTimeline = buildTimeline(snapshot);
      const report = {
        description: description.trim(),
        submittedAt: new Date().toISOString(),
        readableTimeline,
        snapshot: scrubSnapshot(snapshot),
      };
      onShare(
        JSON.stringify(report, null, 2),
        `cachink-bug-report-${Date.now()}.json`,
        readableTimeline,
      );
      setDescription('');
      onClose();
    } finally {
      setIsExporting(false);
    }
  }, [logStore, description, onShare, onClose]);

  return { logStore, description, setDescription, isExporting, handleSubmit };
}

export function BugReportSheet({
  visible,
  onClose,
  onShare,
  testID,
}: BugReportSheetProps): ReactElement | null {
  const { logStore, description, setDescription, isExporting, handleSubmit } = useBugReportSubmit(
    onShare,
    onClose,
  );

  if (!visible) return null;

  return (
    <BugReportShell testID={testID}>
      <BugReportHeader onClose={onClose} />
      <BugReportBody description={description} onChangeDescription={setDescription} />
      <BugReportActions
        onClose={onClose}
        onSubmit={() => void handleSubmit()}
        disabled={!description.trim() || isExporting || !logStore}
        isExporting={isExporting}
      />
    </BugReportShell>
  );
}
