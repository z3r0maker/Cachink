/**
 * DeltaIndicator — shows change vs a previous period.
 *
 * Renders "↑ 12% vs mes anterior" (green), "↓ 8% vs mes anterior" (red),
 * or "= sin cambio vs mes anterior" (muted) depending on the delta.
 *
 * Renders nothing when `previous` is null (no prior data).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, fontSizes, typography } from '../../theme';

export interface DeltaIndicatorProps {
  readonly current: number;
  readonly previous: number | null;
  readonly format: 'percent' | 'money' | 'number';
  /** e.g. "vs mes anterior" */
  readonly periodLabel: string;
  readonly testID?: string;
}

function formatDelta(abs: number, format: 'percent' | 'money' | 'number'): string {
  switch (format) {
    case 'percent':
      return `${Math.round(abs * 100)}%`;
    case 'money':
      return `$${abs.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'number':
      return abs.toFixed(1);
  }
}

function computePercentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : current > 0 ? 1 : -1;
  return (current - previous) / Math.abs(previous);
}

export function DeltaIndicator(props: DeltaIndicatorProps): ReactElement | null {
  if (props.previous === null) return null;

  const pctChange = computePercentChange(props.current, props.previous);
  const isPositive = pctChange > 0.005;
  const isNegative = pctChange < -0.005;

  const arrow = isPositive ? '↑' : isNegative ? '↓' : '=';
  const label =
    isPositive || isNegative
      ? `${arrow} ${formatDelta(Math.abs(pctChange), 'percent')} ${props.periodLabel}`
      : `= sin cambio ${props.periodLabel}`;
  const textColor = isPositive ? colors.greenText : isNegative ? colors.redText : colors.textMuted;

  return (
    <View testID={props.testID ?? 'delta-indicator'}>
      <Text
        testID="delta-indicator-label"
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.xs}
        color={textColor}
        fontVariant={['tabular-nums']}
      >
        {label}
      </Text>
    </View>
  );
}
