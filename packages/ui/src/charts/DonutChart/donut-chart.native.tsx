/**
 * DonutChart (mobile) — Victory Native XL PolarChart with Pie.Chart.
 *
 * Renders a donut (ring) chart with GPU-accelerated Skia rendering.
 * Slices below 3% are merged into "Otro" to avoid tiny slivers.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { PolarChart, Pie } from 'victory-native';
import { colors, fontSizes, shapeRadii, typography } from '../../theme';
import type { DonutSlice, DonutChartProps } from './donut-types';

export type { DonutSlice, DonutChartProps } from './donut-types';

const DEFAULT_SIZE = 180;
const MIN_PERCENT_THRESHOLD = 3;

function mergeSmallSlices(slices: readonly DonutSlice[]): DonutSlice[] {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return [];
  const kept: DonutSlice[] = [];
  let otroValue = 0;
  for (const s of slices) {
    const pct = (s.value / total) * 100;
    if (pct < MIN_PERCENT_THRESHOLD) {
      otroValue += s.value;
    } else {
      kept.push(s);
    }
  }
  if (otroValue > 0) {
    kept.push({ label: 'Otro', value: otroValue, color: colors.gray400 });
  }
  return kept;
}

function DonutCenter(props: {
  centerLabel?: string;
  centerValue?: string;
  size: number;
}): ReactElement | null {
  if (!props.centerLabel && !props.centerValue) return null;
  return (
    <View
      position="absolute"
      top={0}
      left={0}
      right={0}
      height={props.size}
      justifyContent="center"
      alignItems="center"
    >
      {props.centerLabel && (
        <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.gray600}>
          {props.centerLabel}
        </Text>
      )}
      {props.centerValue && (
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={fontSizes.lg}
          color={colors.black}
        >
          {props.centerValue}
        </Text>
      )}
    </View>
  );
}

/** One legend entry: swatch, label, and optionally value and share. */
function DonutLegendRow(props: {
  slice: DonutSlice;
  pct: number;
  formatted: string;
  showValues: boolean;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={6}>
      <View
        width={10}
        height={10}
        borderRadius={shapeRadii.mark}
        backgroundColor={props.slice.color}
      />
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.gray600}>
        {props.slice.label}
      </Text>
      {props.showValues && (
        <>
          <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.textMuted}>
            —
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontSize={fontSizes.xs}
            fontWeight={typography.weights.bold}
            color={colors.ink}
          >
            {props.formatted}
          </Text>
          <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.textMuted}>
            ({props.pct}%)
          </Text>
        </>
      )}
    </View>
  );
}

function DonutLegend(props: {
  slices: readonly DonutSlice[];
  total: number;
  showValues: boolean;
  formatValue?: (v: number) => string;
}): ReactElement | null {
  if (props.slices.length === 0) return null;
  return (
    <View gap={6}>
      {props.slices.map((slice, i) => (
        <DonutLegendRow
          key={i}
          slice={slice}
          pct={props.total > 0 ? Math.round((slice.value / props.total) * 100) : 0}
          formatted={props.formatValue?.(slice.value) ?? `${slice.value.toFixed(0)}`}
          showValues={props.showValues}
        />
      ))}
    </View>
  );
}

export function DonutChart(props: DonutChartProps): ReactElement {
  const { size = DEFAULT_SIZE, showValues = true, testID } = props;
  const merged = mergeSmallSlices(props.slices);
  const total = merged.reduce((sum, s) => sum + s.value, 0);

  const pieData = merged.map((s) => ({
    label: s.label,
    value: s.value,
    color: s.color,
  }));

  return (
    <View testID={testID ?? 'donut-chart'} alignItems="center" gap={12}>
      <View width={size} height={size} position="relative">
        {pieData.length > 0 && (
          <PolarChart data={pieData} labelKey="label" valueKey="value" colorKey="color">
            <Pie.Chart innerRadius="50%" />
          </PolarChart>
        )}
        <DonutCenter centerLabel={props.centerLabel} centerValue={props.centerValue} size={size} />
      </View>
      <DonutLegend
        slices={merged}
        total={total}
        showValues={showValues}
        formatValue={props.formatValue}
      />
    </View>
  );
}
