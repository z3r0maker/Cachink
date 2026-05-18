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

import { useCallback, useState, type ReactElement } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { View, Text } from '@tamagui/core';
import { scrubRecord, formatTimelineAsText, type LogSnapshot, type TimelineEntry } from '@cachink/observability';
import { Btn } from '../../components/index';
import { useLogStore } from '../../observability/observability-provider';
import { useTranslation } from '../../i18n/index';

export interface BugReportSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Platform-specific share function. Receives the report JSON + optional text timeline. */
  readonly onShare: (json: string, filename: string, readableTimeline?: string) => void;
  readonly testID?: string;
}

export function BugReportSheet({
  visible,
  onClose,
  onShare,
  testID,
}: BugReportSheetProps): ReactElement | null {
  const { t } = useTranslation();
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

      // Scrub PII from metadata/context
      const scrubbed = {
        ...snapshot,
        auditEvents: snapshot.auditEvents.map((e) => ({
          ...e,
          metadata: e.metadata ? scrubRecord(e.metadata) : undefined,
        })),
        errors: snapshot.errors.map((e) => ({
          ...e,
          context: e.context ? scrubRecord(e.context) : undefined,
          errorStack: undefined, // Never share stack traces externally
        })),
      };

      // Phase 8: Generate human-readable timeline
      const allEntries: readonly TimelineEntry[] = [
        ...snapshot.auditEvents.map((e) => ({ type: 'audit' as const, ...e })),
        ...snapshot.errors.map((e) => ({ type: 'error' as const, ...e })),
      ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const readableTimeline = formatTimelineAsText(allEntries);

      const report = {
        description: description.trim(),
        submittedAt: new Date().toISOString(),
        readableTimeline,
        snapshot: scrubbed,
      };

      const json = JSON.stringify(report, null, 2);
      const filename = `cachink-bug-report-${Date.now()}.json`;
      onShare(json, filename, readableTimeline);
      setDescription('');
      onClose();
    } finally {
      setIsExporting(false);
    }
  }, [logStore, description, onShare, onClose]);

  if (!visible) return null;

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
      elevation={10}
      testID={testID}
    >
      {/* Header */}
      <View flexDirection="row" justifyContent="space-between" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <Text fontSize="$4" fontWeight="700">Enviar Reporte</Text>
        <Btn size="$2" variant="ghost" onPress={onClose}>✕</Btn>
      </View>

      {/* Content */}
      <ScrollView style={{ padding: 12 }}>
        <Text fontSize="$2" color="$colorSubtle" marginBottom="$2">
          Describe el problema que encontraste. Se adjuntarán automáticamente
          los últimos 50 eventos y 20 errores (sin datos personales).
        </Text>

        <TextInput
          placeholder="¿Qué pasó? ¿Qué esperabas que pasara?"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            minHeight: 100,
            textAlignVertical: 'top',
            fontSize: 14,
          }}
        />

        <Text fontSize="$1" color="$colorSubtle" marginTop="$2">
          ℹ️ El reporte se comparte como archivo JSON. Puedes enviarlo
          por WhatsApp, AirDrop, o correo electrónico.
        </Text>
      </ScrollView>

      {/* Actions */}
      <View flexDirection="row" padding="$3" gap="$2" borderTopWidth={1} borderTopColor="$borderColor">
        <Btn flex={1} variant="outlined" onPress={onClose}>
          Cancelar
        </Btn>
        <Btn
          flex={1}
          variant="primary"
          onPress={() => void handleSubmit()}
          disabled={!description.trim() || isExporting || !logStore}
        >
          {isExporting ? 'Exportando…' : 'Compartir Reporte'}
        </Btn>
      </View>
    </View>
  );
}
