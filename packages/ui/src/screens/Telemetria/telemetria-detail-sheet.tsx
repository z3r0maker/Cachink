/**
 * TelemetriaDetailSheet — bottom sheet showing full entry detail.
 *
 * Includes full metadata JSON, stack traces for errors, and copy/export actions.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View, Text } from '@tamagui/core';
import type { TimelineEntry } from '@cachink/observability';
import { Btn } from '../../components/index';

export interface TelemetriaDetailSheetProps {
  readonly entry: TimelineEntry | null;
  readonly onClose: () => void;
  readonly onCopy: (json: string) => void;
}

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function DetailRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View flexDirection="row" paddingVertical="$1">
      <Text fontSize="$2" color="$colorSubtle" width={110}>{label}:</Text>
      <Text fontSize="$2" flex={1} fontFamily="$mono">{value}</Text>
    </View>
  );
}

export function TelemetriaDetailSheet({
  entry,
  onClose,
  onCopy,
}: TelemetriaDetailSheetProps): ReactElement | null {
  if (!entry) return null;

  const isError = entry.type === 'error' || (entry.type === 'audit' && entry.status === 'error');
  const fullJson = formatJson(entry);

  return (
    <View
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor="$background"
      borderTopLeftRadius="$4"
      borderTopRightRadius="$4"
      maxHeight="70%"
      shadowColor="black"
      shadowOpacity={0.2}
      shadowRadius={10}
      elevation={10}
    >
      {/* Header */}
      <View flexDirection="row" justifyContent="space-between" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <Text fontSize="$4" fontWeight="700">Detalle de Evento</Text>
        <Btn size="$2" variant="ghost" onPress={onClose}>✕</Btn>
      </View>

      {/* Content */}
      <ScrollView style={{ padding: 12, maxHeight: 400 }}>
        <DetailRow label="Tipo" value={entry.type} />
        <DetailRow label="Timestamp" value={entry.timestamp} />
        {entry.type === 'audit' && (
          <>
            <DetailRow label="Operación" value={entry.operation} />
            <DetailRow label="Estado" value={entry.status === 'success' ? '✅ success' : '❌ error'} />
            <DetailRow label="Entity" value={`${entry.entityType} / ${entry.entityId}`} />
          </>
        )}
        {entry.type === 'error' && (
          <>
            <DetailRow label="Source" value={entry.source} />
            <DetailRow label="Error" value={entry.errorName} />
            <DetailRow label="Message" value={entry.errorMessage} />
          </>
        )}
        <DetailRow label="User" value={entry.userId ?? '—'} />
        <DetailRow label="Device" value={entry.deviceId} />
        <DetailRow label="Business" value={(entry.type === 'audit' ? entry.businessId : entry.businessId) ?? '—'} />

        {/* Metadata / Context */}
        {entry.type === 'audit' && entry.metadata && (
          <View marginTop="$2">
            <Text fontSize="$2" fontWeight="600" marginBottom="$1">Metadata:</Text>
            <View backgroundColor="$backgroundStrong" borderRadius="$2" padding="$2">
              <Text fontSize="$1" fontFamily="$mono">{formatJson(entry.metadata)}</Text>
            </View>
          </View>
        )}
        {entry.type === 'error' && entry.errorStack && (
          <View marginTop="$2">
            <Text fontSize="$2" fontWeight="600" marginBottom="$1">Stack Trace:</Text>
            <View backgroundColor="$backgroundStrong" borderRadius="$2" padding="$2">
              <Text fontSize="$1" fontFamily="$mono" numberOfLines={20}>{entry.errorStack}</Text>
            </View>
          </View>
        )}
        {entry.type === 'error' && entry.context && (
          <View marginTop="$2">
            <Text fontSize="$2" fontWeight="600" marginBottom="$1">Context:</Text>
            <View backgroundColor="$backgroundStrong" borderRadius="$2" padding="$2">
              <Text fontSize="$1" fontFamily="$mono">{formatJson(entry.context)}</Text>
            </View>
          </View>
        )}

        {isError && entry.type === 'audit' && entry.errorMessage && (
          <View marginTop="$2">
            <Text fontSize="$2" color="$red10">
              {entry.errorCode}: {entry.errorMessage}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View flexDirection="row" padding="$3" gap="$2" borderTopWidth={1} borderTopColor="$borderColor">
        <Btn flex={1} variant="outlined" onPress={() => onCopy(fullJson)}>
          Copiar JSON
        </Btn>
        <Btn flex={1} variant="outlined" onPress={onClose}>
          Cerrar
        </Btn>
      </View>
    </View>
  );
}
