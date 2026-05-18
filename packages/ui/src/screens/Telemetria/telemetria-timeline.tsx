/**
 * TelemetriaTimeline — FlatList rendering timeline entries.
 */

import { useCallback, type ReactElement } from 'react';
import { FlatList } from 'react-native';
import { View, Text } from '@tamagui/core';
import type { TimelineEntry } from '@cachink/observability';
import { TelemetriaEntryRow } from './telemetria-entry-row';

export interface TelemetriaTimelineProps {
  readonly entries: readonly TimelineEntry[] | undefined;
  readonly isLoading: boolean;
  readonly onEntryPress: (entry: TimelineEntry) => void;
}

export function TelemetriaTimeline({
  entries,
  isLoading,
  onEntryPress,
}: TelemetriaTimelineProps): ReactElement {
  const renderItem = useCallback(
    ({ item }: { item: TimelineEntry }) => (
      <TelemetriaEntryRow entry={item} onPress={onEntryPress} />
    ),
    [onEntryPress],
  );

  if (isLoading) {
    return (
      <View padding="$4" alignItems="center">
        <Text color="$colorSubtle">Cargando timeline…</Text>
      </View>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <View padding="$4" alignItems="center">
        <Text color="$colorSubtle">Sin eventos registrados</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries as TimelineEntry[]}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      initialNumToRender={30}
      maxToRenderPerBatch={20}
    />
  );
}
