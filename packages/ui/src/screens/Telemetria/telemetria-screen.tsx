/**
 * TelemetriaScreen — dev-only observability dashboard for Directors.
 *
 * Shows a real-time timeline of all audit events and errors, with filters,
 * stats, and detail inspection. Lives in the Otros tab, gated by __DEV__.
 */

import { useCallback, useState, type ReactElement } from 'react';
import { View, Text } from '@tamagui/core';
import type { TimelineEntry } from '@cachink/observability';
import { SectionTitle } from '../../components/index';
import { TelemetriaStatsRow } from './telemetria-stats-row';
import { TelemetriaFilterBar } from './telemetria-filter-bar';
import { TelemetriaTimeline } from './telemetria-timeline';
import { TelemetriaDetailSheet } from './telemetria-detail-sheet';
import { useTelemetriaData, useTelemetriaStats, type TelemetriaFilter, type TelemetriaPeriod } from './use-telemetria-data';

export interface TelemetriaScreenProps {
  readonly testID?: string;
}

function useTelemetriaScreen() {
  const [filter, setFilter] = useState<TelemetriaFilter>('all');
  const [period, setPeriod] = useState<TelemetriaPeriod>('today');
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const statsQuery = useTelemetriaStats();
  const dataQuery = useTelemetriaData({ filter, period });
  const handleEntryPress = useCallback((entry: TimelineEntry) => setSelectedEntry(entry), []);
  const handleClose = useCallback(() => setSelectedEntry(null), []);
  const handleCopy = useCallback((json: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) void navigator.clipboard.writeText(json);
  }, []);
  return { filter, setFilter, period, setPeriod, selectedEntry, statsQuery, dataQuery, handleEntryPress, handleClose, handleCopy };
}

export function TelemetriaScreen(_props: TelemetriaScreenProps): ReactElement {
  const s = useTelemetriaScreen();
  return (
    <View flex={1} backgroundColor="$background">
      <SectionTitle>Telemetr\u00eda</SectionTitle>
      <TelemetriaStatsRow stats={s.statsQuery.data} isLoading={s.statsQuery.isLoading} />
      <TelemetriaFilterBar filter={s.filter} onFilterChange={s.setFilter} period={s.period} onPeriodChange={s.setPeriod} />
      <View flex={1} marginTop="$2">
        <TelemetriaTimeline entries={s.dataQuery.data} isLoading={s.dataQuery.isLoading} onEntryPress={s.handleEntryPress} />
      </View>
      {s.dataQuery.data && s.dataQuery.data.length > 0 && (
        <View padding="$3" alignItems="center">
          <Text fontSize="$1" color="$colorSubtle">{s.dataQuery.data.length} eventos</Text>
        </View>
      )}
      <TelemetriaDetailSheet entry={s.selectedEntry} onClose={s.handleClose} onCopy={s.handleCopy} />
    </View>
  );
}
