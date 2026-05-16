/**
 * WaterfallChart (desktop) — ECharts stacked bar waterfall.
 *
 * Apache ECharts builds waterfalls via three stacked series:
 * transparent base + positive fill + negative fill.
 * See: https://echarts.apache.org/handbook/en/how-to/chart-types/bar/waterfall/
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { echarts, ReactEChartsCore } from '../echarts-wrapper';
import { SEMANTIC, formatChartLabel } from '../chart-tokens';
import { colors } from '../../theme';
import { computeBarPositions, buildWaterfallAriaLabel } from './waterfall-positions';
import type { WaterfallItem, WaterfallChartProps } from './waterfall-types';

export type { RenderedBar } from './waterfall-positions';
export { computeBarPositions } from './waterfall-positions';
export type { WaterfallItem, WaterfallChartProps } from './waterfall-types';

const DEFAULT_HEIGHT = 240;

function barColor(type: WaterfallItem['type'], value: number): string {
  if (type === 'subtotal') {
    return value < 0 ? SEMANTIC.negative : SEMANTIC.positive;
  }
  return SEMANTIC[type];
}

function barGradient(
  type: WaterfallItem['type'],
  value: number,
) {
  const startColor = barColor(type, value);
  const endColor = type === 'income' || (type === 'subtotal' && value >= 0)
    ? colors.greenSoft
    : colors.redSoft;
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: startColor },
    { offset: 1, color: endColor },
  ]);
}

/** Build the ECharts option object from WaterfallItem[] data. */
export function buildWaterfallOption(data: readonly WaterfallItem[]): object {
  const positions = computeBarPositions(data);
  const labels = data.map((d) => d.label);

  // Three series: invisible base, visible bars, value labels
  const baseData = positions.map((p) => Math.min(p.base, p.top));
  const barData = data.map((item, i) => {
    const pos = positions[i]!;
    return {
      value: Math.abs(pos.top - pos.base),
      itemStyle: {
        color: barGradient(item.type, item.value),
        borderColor: colors.black,
        borderWidth: 2,
        borderRadius: [4, 4, 0, 0],
      },
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: Array<{ name: string; seriesIndex: number; value: number }>) => {
        const item = params.find((p) => p.seriesIndex === 1);
        if (!item) return '';
        const idx = labels.indexOf(item.name);
        const original = idx >= 0 ? data[idx]! : null;
        return original
          ? `${item.name}: ${formatChartLabel(original.value)}`
          : `${item.name}: ${formatChartLabel(item.value)}`;
      },
    },
    grid: { left: 10, right: 10, top: 30, bottom: 30, containLabel: true },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', show: false },
    animationDuration: 600,
    animationEasing: 'cubicOut',
    series: [
      {
        name: 'base',
        type: 'bar',
        stack: 'waterfall',
        data: baseData,
        itemStyle: { color: 'transparent', borderWidth: 0 },
        emphasis: { itemStyle: { color: 'transparent' } },
      },
      {
        name: 'value',
        type: 'bar',
        stack: 'waterfall',
        data: barData,
        label: {
          show: true,
          position: 'top',
          formatter: (p: { dataIndex: number }) =>
            formatChartLabel(data[p.dataIndex]?.value ?? 0),
          color: (p: { dataIndex: number }) => {
            const v = data[p.dataIndex]?.value ?? 0;
            if (v < 0) return colors.red;
            if (v > 0) return colors.green;
            return colors.ink;
          },
          fontWeight: 700,
          fontSize: 11,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
    ],
  };
}

export function WaterfallChart(props: WaterfallChartProps): ReactElement | null {
  const { data, height = DEFAULT_HEIGHT, testID } = props;
  if (data.length === 0) return null;

  const option = buildWaterfallOption(data);
  const ariaLabel = buildWaterfallAriaLabel(data);

  return (
    <View testID={testID ?? 'waterfall-chart'} accessibilityLabel={ariaLabel}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme="cachink"
        style={{ height, width: '100%' }}
        notMerge
      />
    </View>
  );
}
