/**
 * StackedBar (desktop) — ECharts horizontal stacked bar chart.
 *
 * A single horizontal stacked bar showing proportional segments.
 * Used in the Balance General Activo card to visualize asset composition.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { echarts, ReactEChartsCore } from '../echarts-wrapper';
import { colors, typography } from '../../theme';
import type { BarSegment, StackedBarProps } from './stacked-types';

export type { BarSegment, StackedBarProps } from './stacked-types';

const DEFAULT_HEIGHT = 28;

function StackedLegend(props: {
  segments: readonly BarSegment[];
  total: number;
  showValues: boolean;
  formatValue?: (v: number) => string;
}): ReactElement {
  return (
    <View gap={4}>
      {props.segments.map((seg, i) => {
        const pct = props.total > 0 ? Math.round((seg.value / props.total) * 100) : 0;
        const formatted = props.formatValue?.(seg.value) ?? `${seg.value.toFixed(0)}`;
        return (
          <View key={i} flexDirection="row" alignItems="center" gap={6}>
            <View width={8} height={8} borderRadius={4} backgroundColor={seg.color} />
            <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray600}>
              {seg.label}
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

function buildAriaLabel(segments: readonly BarSegment[], total: number): string {
  const parts = segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`);
  return `Composición: ${parts.join(', ')}`;
}

/** Build the ECharts option object. Exported for test assertions. */
export function buildStackedOption(segments: readonly BarSegment[]): object {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: {
      type: 'value',
      show: false,
      max: 'dataMax',
    },
    yAxis: {
      type: 'category',
      data: [''],
      show: false,
    },
    animationDuration: 600,
    animationEasing: 'cubicOut',
    series: segments.map((seg) => ({
      name: seg.label,
      type: 'bar',
      stack: 'total',
      data: [seg.value],
      barWidth: '100%',
      itemStyle: {
        color: seg.color,
        borderColor: colors.black,
        borderWidth: 2,
      },
      emphasis: { focus: 'series' },
    })),
  };
}

export function StackedBar(props: StackedBarProps): ReactElement | null {
  const { segments, height = DEFAULT_HEIGHT, showValues = true, testID } = props;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0 || segments.length === 0) return null;

  const option = buildStackedOption(segments);
  const ariaLabel = buildAriaLabel(segments, total);

  return (
    <View testID={testID ?? 'stacked-bar'} gap={8}>
      <View accessibilityLabel={ariaLabel}>
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          theme="cachink"
          style={{ height: height + 4, width: 280 }}
          notMerge
        />
      </View>
      <StackedLegend
        segments={segments}
        total={total}
        showValues={showValues}
        formatValue={props.formatValue}
      />
    </View>
  );
}
