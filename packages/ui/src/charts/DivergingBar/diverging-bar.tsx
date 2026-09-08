/**
 * DivergingBar (desktop) — ECharts horizontal bar chart.
 *
 * Horizontal bars that grow left (negative) or right (positive)
 * from a central zero axis. Used in the Flujo de Efectivo screen.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { echarts, ReactEChartsCore } from '../echarts-wrapper';
import { colors, fontSizes, shapeRadii } from '../../theme';
import { formatChartLabel, SEMANTIC } from '../chart-tokens';
import type { DivergingItem, DivergingBarProps } from './diverging-types';

export type { DivergingItem, DivergingBarProps } from './diverging-types';

const BAR_HEIGHT_PER_ITEM = 40;

function buildAriaLabel(items: readonly DivergingItem[]): string {
  return `Flujos: ${items.map((i) => `${i.label} ${i.value >= 0 ? '+' : ''}${formatChartLabel(i.value)}`).join(', ')}`;
}

function buildBarGradient(value: number) {
  return value >= 0
    ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: SEMANTIC.positive },
        { offset: 1, color: colors.greenSoft },
      ])
    : new echarts.graphic.LinearGradient(1, 0, 0, 0, [
        { offset: 0, color: SEMANTIC.negative },
        { offset: 1, color: colors.redSoft },
      ]);
}

function buildBarData(items: readonly DivergingItem[]) {
  return items.map((item) => ({
    value: item.value,
    itemStyle: {
      color: buildBarGradient(item.value),
      borderColor: colors.black,
      borderWidth: 2,
      borderRadius: shapeRadii.markLg,
    },
  }));
}

function buildDivergingTooltip() {
  return {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: Array<{ name: string; value: number }>) => {
      const p = params[0];
      return p ? `${p.name}: ${formatChartLabel(p.value)}` : '';
    },
  };
}

function buildDivergingAxes(labels: string[]) {
  const hidden = { show: false };
  return {
    xAxis: {
      type: 'value',
      axisLine: hidden,
      axisTick: hidden,
      axisLabel: hidden,
      splitLine: hidden,
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLine: hidden,
      axisTick: hidden,
      axisLabel: {
        color: colors.gray600,
        fontSize: fontSizes.xs,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 500,
      },
    },
  };
}

function buildDivergingSeries(items: readonly DivergingItem[]) {
  return [
    {
      type: 'bar',
      data: buildBarData(items),
      barWidth: 28,
      label: {
        show: true,
        position: 'right',
        formatter: (p: { value: number }) => formatChartLabel(p.value),
        fontWeight: 700,
        fontSize: fontSizes.xs,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: colors.ink,
      },
    },
  ];
}

/** Build the ECharts option object. Exported for test assertions. */
export function buildDivergingOption(items: readonly DivergingItem[]): object {
  const labels = items.map((i) => i.label);
  return {
    tooltip: buildDivergingTooltip(),
    grid: { left: 100, right: 60, top: 10, bottom: 10, containLabel: false },
    ...buildDivergingAxes(labels),
    animationDuration: 600,
    animationEasing: 'cubicOut',
    series: buildDivergingSeries(items),
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
