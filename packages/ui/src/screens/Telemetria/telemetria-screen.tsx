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

export function TelemetriaScreen(_props: TelemetriaScreenProps): ReactElement {
  const [filter, setFilter] = useState<TelemetriaFilter>('all');
  const [period, setPeriod] = useState<TelemetriaPeriod>('today');
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);

  const statsQuery = useTelemetriaStats();
  const dataQuery = useTelemetriaData({ filter, period });

  const handleEntryPress = useCallback((entry: TimelineEntry) => {
    setSelectedEntry(entry);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  const handleCopy = useCallback((json: string) => {
    // Platform-agnostic clipboard: use navigator.clipboard where available
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(json);
    }
  }, []);

  return (
    <View flex={1} backgroundColor="$background">
      {/* Header */}
      <SectionTitle>Telemetría</SectionTitle>

      {/* Stats Row */}
      <TelemetriaStatsRow stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      {/* Filter Bar */}
      <TelemetriaFilterBar
        filter={filter}
        onFilterChange={setFilter}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Timeline */}
      <View flex={1} marginTop="$2">
        <TelemetriaTimeline
          entries={dataQuery.data}
          isLoading={dataQuery.isLoading}
          onEntryPress={handleEntryPress}
        />
      </View>

      {/* Export hint */}
      {dataQuery.data && dataQuery.data.length > 0 && (
        <View padding="$3" alignItems="center">
          <Text fontSize="$1" color="$colorSubtle">
            {dataQuery.data.length} eventos · Actualización cada 5s
          </Text>
        </View>
      )}

      {/* Detail Sheet */}
      <TelemetriaDetailSheet
        entry={selectedEntry}
        onClose={handleClose}
        onCopy={handleCopy}
      />
    </View>
  );
}
