/**
 * TelemetriaEntryRow — single timeline row in the Telemetría list.
 *
 * Visual coding:
 *   - Success: green left accent + 🟢
 *   - Error: red left accent + 🔴
 */

import type { ReactElement } from 'react';
import { View, Text } from '@tamagui/core';
import type { TimelineEntry } from '@cachink/observability';

export interface TelemetriaEntryRowProps {
  readonly entry: TimelineEntry;
  readonly onPress: (entry: TimelineEntry) => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso.slice(11, 19);
  }
}

function getOperation(entry: TimelineEntry): string {
  if (entry.type === 'audit') return entry.operation;
  return entry.operation ?? entry.source;
}

function getDescription(entry: TimelineEntry): string {
  if (entry.type === 'audit') {
    if (entry.status === 'error') return `ERROR: ${entry.errorMessage ?? 'Unknown'}`;
    const entityShort = entry.entityId.slice(0, 8);
    return `${entry.entityType} ${entityShort}…`;
  }
  return `${entry.errorName}: ${entry.errorMessage}`.slice(0, 80);
}

/** Performance badge: green < 100ms, yellow < 500ms, red >= 500ms. */
function getDurationBadge(entry: TimelineEntry): { text: string; color: string } | null {
  if (entry.type !== 'audit' || entry.durationMs == null) return null;
  const ms = entry.durationMs;
  if (ms < 100) return { text: `${ms}ms`, color: '$green9' };
  if (ms < 500) return { text: `${ms}ms`, color: '$yellow9' };
  return { text: `${ms}ms`, color: '$red9' };
}

export function TelemetriaEntryRow({ entry, onPress }: TelemetriaEntryRowProps): ReactElement {
  const isError = entry.type === 'error' || (entry.type === 'audit' && entry.status === 'error');
  const accentColor = isError ? '$red8' : '$green8';
  const indicator = isError ? '🔴' : '🟢';

  return (
    <View
      onPress={() => onPress(entry)}
      flexDirection="row"
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      pressStyle={{ opacity: 0.7 }}
      cursor="pointer"
    >
      <View width={4} borderRadius="$1" backgroundColor={accentColor} marginRight="$2" />
      <View flex={1}>
        <View flexDirection="row" alignItems="center" gap="$1">
          <Text fontSize="$1">{indicator}</Text>
          <Text fontSize="$2" fontFamily="$mono" color="$colorSubtle">
            {formatTime(entry.timestamp)}
          </Text>
          <Text fontSize="$2" fontWeight="600" marginLeft="$1">
            {getOperation(entry)}
          </Text>
          {(() => {
            const badge = getDurationBadge(entry);
            if (!badge) return null;
            return (
              <Text fontSize="$1" fontFamily="$mono" color={badge.color} marginLeft="$1">
                {badge.text}
              </Text>
            );
          })()}
        </View>
        <Text fontSize="$1" color="$colorSubtle" marginTop="$0.5" numberOfLines={1}>
          {getDescription(entry)}
        </Text>
        <Text fontSize="$1" color="$colorSubtle" numberOfLines={1}>
          {entry.userId?.slice(0, 8) ?? '—'} · {entry.deviceId.slice(0, 8)}
        </Text>
      </View>
    </View>
  );
}
