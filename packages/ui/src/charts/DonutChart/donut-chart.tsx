/**
 * DonutChart (desktop) — ECharts pie series with inner radius for donut.
 *
 * Slices below 3% are merged into "Otro" to avoid tiny slivers.
 * Center label overlay uses Tamagui absolute positioning.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { echarts, ReactEChartsCore } from '../echarts-wrapper';
import { colors, typography } from '../../theme';
import type { DonutSlice, DonutChartProps } from './donut-types';

export type { DonutSlice, DonutChartProps } from './donut-types';

const DEFAULT_SIZE = 180;
const MIN_PERCENT_THRESHOLD = 3;

/** Merge slices below threshold into "Otro". */
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

function buildAriaLabel(merged: DonutSlice[], total: number): string {
  const parts = merged.map((s) => {
    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
    return `${s.label} ${pct}%`;
  });
  return `Distribución: ${parts.join(', ')}`;
}

/** Build the ECharts option object. Exported for test assertions. */
export function buildDonutOption(slices: readonly DonutSlice[]): object {
  const merged = mergeSmallSlices(slices);

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {d}%',
    },
    legend: { show: false },
    animationDuration: 600,
    animationEasing: 'cubicOut',
    series: [
      {
        type: 'pie',
        radius: ['50%', '80%'],
        center: ['50%', '50%'],
        data: merged.map((s) => ({
          name: s.label,
          value: s.value,
          itemStyle: {
            color: s.color,
            borderColor: colors.black,
            borderWidth: 2,
          },
        })),
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5 },
      },
    ],
  };
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
      pointerEvents="none"
    >
      {props.centerLabel && (
        <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray600}>
          {props.centerLabel}
        </Text>
      )}
      {props.centerValue && (
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={16}
          color={colors.black}
        >
          {props.centerValue}
        </Text>
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
      {props.slices.map((slice, i) => {
        const pct = props.total > 0 ? Math.round((slice.value / props.total) * 100) : 0;
        const formatted = props.formatValue?.(slice.value) ?? `${slice.value.toFixed(0)}`;
        return (
          <View key={i} flexDirection="row" alignItems="center" gap={6}>
            <View width={10} height={10} borderRadius={2} backgroundColor={slice.color} />
            <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray600}>
              {slice.label}
            </Text>
            {props.showValues && (
              <>
                <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray400}>
                  —
                </Text>
                <Text fontFamily={typography.fontFamily} fontSize={11} fontWeight={typography.weights.bold} color={colors.ink}>
                  {formatted}
                </Text>
                <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray400}>
                  ({pct}%)
                </Text>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function DonutChart(props: DonutChartProps): ReactElement {
  const { size = DEFAULT_SIZE, showValues = true, testID } = props;
  const merged = mergeSmallSlices(props.slices);
  const total = merged.reduce((sum, s) => sum + s.value, 0);
  const option = buildDonutOption(props.slices);
  const ariaLabel = buildAriaLabel(merged, total);

  return (
    <View testID={testID ?? 'donut-chart'} alignItems="center" gap={12}>
      <View width={size} height={size} position="relative" accessibilityLabel={ariaLabel}>
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          theme="cachink"
          style={{ height: size, width: size }}
          notMerge
        />
        <DonutCenter
          centerLabel={props.centerLabel}
          centerValue={props.centerValue}
          size={size}
        />
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
