/**
 * DivergingBar (desktop) — ECharts horizontal bar chart.
 *
 * Horizontal bars that grow left (negative) or right (positive)
 * from a central zero axis. Used in the Flujo de Efectivo screen.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { echarts, ReactEChartsCore } from '../echarts-wrapper';
import { colors } from '../../theme';
import { formatChartLabel, SEMANTIC } from '../chart-tokens';
import type { DivergingItem, DivergingBarProps } from './diverging-types';

export type { DivergingItem, DivergingBarProps } from './diverging-types';

const BAR_HEIGHT_PER_ITEM = 40;

function buildAriaLabel(items: readonly DivergingItem[]): string {
  return `Flujos: ${items.map((i) => `${i.label} ${i.value >= 0 ? '+' : ''}${formatChartLabel(i.value)}`).join(', ')}`;
}

/** Build the ECharts option object. Exported for test assertions. */
export function buildDivergingOption(items: readonly DivergingItem[]): object {
  const labels = items.map((i) => i.label);
  const barData = items.map((item) => ({
    value: item.value,
    itemStyle: {
      color: item.value >= 0
        ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: SEMANTIC.positive },
            { offset: 1, color: colors.greenSoft },
          ])
        : new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: SEMANTIC.negative },
            { offset: 1, color: colors.redSoft },
          ]),
      borderColor: colors.black,
      borderWidth: 2,
      borderRadius: 4,
    },
  }));

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: Array<{ name: string; value: number }>) => {
        const p = params[0];
        return p ? `${p.name}: ${formatChartLabel(p.value)}` : '';
      },
    },
    grid: { left: 100, right: 60, top: 10, bottom: 10, containLabel: false },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: colors.gray600,
        fontSize: 11,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 500,
      },
    },
    animationDuration: 600,
    animationEasing: 'cubicOut',
    series: [
      {
        type: 'bar',
        data: barData,
        barWidth: 28,
        label: {
          show: true,
          position: 'right',
          formatter: (p: { value: number }) => formatChartLabel(p.value),
          fontWeight: 700,
          fontSize: 11,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: colors.ink,
        },
      },
    ],
  };
}

export function DivergingBar(props: DivergingBarProps): ReactElement | null {
  const { items, testID } = props;
  if (items.length === 0) return null;

  const totalHeight = items.length * BAR_HEIGHT_PER_ITEM + 20;
  const option = buildDivergingOption(items);
  const ariaLabel = buildAriaLabel(items);

  return (
    <View testID={testID ?? 'diverging-bar'} alignItems="center" accessibilityLabel={ariaLabel}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme="cachink"
        style={{ height: totalHeight, width: 280 }}
        notMerge
      />
    </View>
  );
}
