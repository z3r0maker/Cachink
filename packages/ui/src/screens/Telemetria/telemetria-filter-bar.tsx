/**
 * TelemetriaFilterBar — segmented control + period toggle for timeline filtering.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { SegmentedToggle } from '../../components/index';
import type { TelemetriaFilter, TelemetriaPeriod } from './use-telemetria-data';

export interface TelemetriaFilterBarProps {
  readonly filter: TelemetriaFilter;
  readonly onFilterChange: (f: TelemetriaFilter) => void;
  readonly period: TelemetriaPeriod;
  readonly onPeriodChange: (p: TelemetriaPeriod) => void;
}

const FILTER_OPTIONS = [
  { key: 'all' as const, label: 'Todo' },
  { key: 'audit' as const, label: 'Auditoría' },
  { key: 'error' as const, label: 'Errores' },
];

const PERIOD_OPTIONS = [
  { key: 'today' as const, label: 'Hoy' },
  { key: '7d' as const, label: '7 días' },
  { key: '30d' as const, label: '30 días' },
];

export function TelemetriaFilterBar({
  filter,
  onFilterChange,
  period,
  onPeriodChange,
}: TelemetriaFilterBarProps): ReactElement {
  return (
    <View paddingHorizontal="$3" gap="$2">
      <SegmentedToggle
        options={FILTER_OPTIONS}
        selected={filter}
        onSelect={(key) => onFilterChange(key as TelemetriaFilter)}
      />
      <SegmentedToggle
        options={PERIOD_OPTIONS}
        selected={period}
        onSelect={(key) => onPeriodChange(key as TelemetriaPeriod)}
      />
    </View>
  );
}
