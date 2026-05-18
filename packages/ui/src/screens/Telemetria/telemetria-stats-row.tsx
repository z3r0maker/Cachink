/**
 * TelemetriaStatsRow — horizontal scrollable row of 4 stat mini-cards.
 *
 * Shows: total operations, total errors, last error time, coverage.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View, Text } from '@tamagui/core';
import type { LogStats } from '@cachink/observability';

export interface TelemetriaStatsRowProps {
  readonly stats: LogStats | undefined;
  readonly isLoading: boolean;
}

function StatCard({
  value,
  label,
  color,
}: {
  readonly value: string;
  readonly label: string;
  readonly color: string;
}): ReactElement {
  return (
    <View
      backgroundColor="$backgroundStrong"
      borderRadius="$3"
      padding="$3"
      minWidth={90}
      marginRight="$2"
      alignItems="center"
    >
      <Text fontSize="$6" fontWeight="700" color={color}>{value}</Text>
      <Text fontSize="$1" color="$colorSubtle" marginTop="$1">{label}</Text>
    </View>
  );
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function TelemetriaStatsRow({ stats, isLoading }: TelemetriaStatsRowProps): ReactElement {
  if (isLoading || !stats) {
    return (
      <View height={80} justifyContent="center" alignItems="center">
        <Text color="$colorSubtle">Cargando stats…</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 8 }}>
      <View flexDirection="row" paddingHorizontal="$3">
        <StatCard value={String(stats.totalAuditEvents)} label="Operaciones" color="$blue10" />
        <StatCard value={String(stats.totalErrors)} label="Errores" color="$red10" />
        <StatCard value={formatRelativeTime(stats.lastErrorAt)} label="Último error" color="$yellow10" />
        <StatCard value="13/13" label="Cobertura" color="$green10" />
      </View>
    </ScrollView>
  );
}
