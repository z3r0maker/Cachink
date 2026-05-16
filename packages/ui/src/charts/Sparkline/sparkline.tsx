/**
 * Sparkline (desktop) — ECharts minimal line chart.
 *
 * No axes, no grid; just the trend + optional fill area.
 * Used inside Indicadores MarginGauge cards.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { echarts, ReactEChartsCore } from '../echarts-wrapper';
import { colors } from '../../theme';
import type { SparklineProps } from './sparkline-types';

export type { SparklineProps } from './sparkline-types';

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 32;

/** Build the ECharts option object. Exported for test assertions. */
export function buildSparklineOption(
  points: readonly number[],
  color: string,
  fillOpacity: number,
): object {
  return {
    grid: { top: 2, right: 2, bottom: 2, left: 2 },
    xAxis: { show: false, type: 'category', data: points.map((_, i) => i) },
    yAxis: { show: false, type: 'value' },
    animation: true,
    animationDuration: 400,
    animationEasing: 'cubicOut',
    series: [
      {
        type: 'line',
        data: [...points],
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: fillOpacity, color },
        lineStyle: { color, width: 2 },
        itemStyle: { color },
      },
    ],
  };
}

export function Sparkline(props: SparklineProps): ReactElement | null {
  const {
    points,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    color = colors.blue,
    fillOpacity = 0.1,
    testID,
  } = props;

  if (points.length < 2) return null;

  const option = buildSparklineOption(points, color, fillOpacity);
  const ariaLabel = `Tendencia: de ${points[0]} a ${points[points.length - 1]}`;

  return (
    <View testID={testID ?? 'sparkline'} accessibilityLabel={ariaLabel}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme="cachink"
        style={{ height, width }}
        notMerge
      />
    </View>
  );
}
