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
import { colors, fontSizes } from '../../theme';
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

function barGradient(type: WaterfallItem['type'], value: number) {
  const startColor = barColor(type, value);
  const endColor =
    type === 'income' || (type === 'subtotal' && value >= 0) ? colors.greenSoft : colors.redSoft;
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: startColor },
    { offset: 1, color: endColor },
  ]);
}

function buildBarDataItems(
  data: readonly WaterfallItem[],
  positions: ReturnType<typeof computeBarPositions>,
) {
  return data.map((item, i) => {
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
}

function buildValueLabel(data: readonly WaterfallItem[]) {
  return {
    show: true,
    position: 'top',
    formatter: (p: { dataIndex: number }) => formatChartLabel(data[p.dataIndex]?.value ?? 0),
    color: (p: { dataIndex: number }) => {
      const v = data[p.dataIndex]?.value ?? 0;
      if (v < 0) return colors.red;
      if (v > 0) return colors.green;
      return colors.ink;
    },
    fontWeight: 700,
    fontSize: fontSizes.xs,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
}

function buildWaterfallSeries(
  data: readonly WaterfallItem[],
  positions: ReturnType<typeof computeBarPositions>,
) {
  const baseData = positions.map((p) => Math.min(p.base, p.top));
  const transparentStyle = { color: 'transparent', borderWidth: 0 };
  return [
    {
      name: 'base',
      type: 'bar',
      stack: 'waterfall',
      data: baseData,
      itemStyle: transparentStyle,
      emphasis: { itemStyle: transparentStyle },
    },
    {
      name: 'value',
      type: 'bar',
      stack: 'waterfall',
      data: buildBarDataItems(data, positions),
      label: buildValueLabel(data),
    },
  ];
}

function buildWaterfallTooltip(data: readonly WaterfallItem[], labels: string[]) {
  return {
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
  };
}

/** Build the ECharts option object from WaterfallItem[] data. */
export function buildWaterfallOption(data: readonly WaterfallItem[]): object {
  const positions = computeBarPositions(data);
  const labels = data.map((d) => d.label);
  return {
    tooltip: buildWaterfallTooltip(data, labels),
    grid: { left: 10, right: 10, top: 30, bottom: 30, containLabel: true },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', show: false },
    animationDuration: 600,
    animationEasing: 'cubicOut',
    series: buildWaterfallSeries(data, positions),
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
