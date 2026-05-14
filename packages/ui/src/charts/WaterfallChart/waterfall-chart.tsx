/**
 * WaterfallChart — vertical SVG waterfall rendering the Estado de Resultados
 * cascade: Ingresos → (−Costo) → Utilidad Bruta → ... → Utilidad Neta.
 *
 * Neobrutalist style: 2px black borders, hard fills, no gradients.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { SEMANTIC, formatChartLabel } from '../chart-tokens';
import { colors } from '../../theme';

export interface WaterfallItem {
  readonly label: string;
  readonly value: number;
  readonly type: 'income' | 'expense' | 'subtotal';
}

export interface WaterfallChartProps {
  readonly data: readonly WaterfallItem[];
  readonly height?: number;
  readonly testID?: string;
}

const BAR_GAP = 8;
const LABEL_HEIGHT = 18;
const VALUE_HEIGHT = 16;
const MIN_BAR_WIDTH = 36;
const CHART_PADDING = 16;
const DEFAULT_HEIGHT = 220;

function barColor(type: WaterfallItem['type']): string {
  return SEMANTIC[type];
}

interface BarPosition {
  /** Lower edge of the bar (smaller value, higher SVG Y). */
  readonly base: number;
  /** Upper edge of the bar (larger value, lower SVG Y). */
  readonly top: number;
  /** Running level AFTER this bar — used for connector lines. */
  readonly exitLevel: number;
}

/**
 * Computes running cumulative positions for the waterfall effect.
 *
 * - **income** — bar rises from runningBase upward; increases running level.
 * - **expense** — bar drops from runningBase downward; decreases running level.
 * - **subtotal** — full bar from 0 to value; resets running level to value.
 */
export function computeBarPositions(data: readonly WaterfallItem[]): BarPosition[] {
  let runningBase = 0;
  return data.map((item) => {
    if (item.type === 'subtotal') {
      runningBase = item.value;
      return { base: 0, top: item.value, exitLevel: item.value };
    }
    if (item.type === 'income') {
      const base = runningBase;
      const top = runningBase + item.value;
      runningBase = top;
      return { base, top, exitLevel: top };
    }
    // expense — drops downward from current running level
    const top = runningBase;
    const base = runningBase - item.value;
    runningBase = base;
    return { base, top, exitLevel: base };
  });
}

interface RenderedBar {
  readonly item: WaterfallItem;
  readonly x: number;
  readonly yTop: number;
  readonly barH: number;
  readonly connY: number | null;
  readonly barWidth: number;
  readonly height: number;
}

function WaterfallConnectorLine({ x, connY }: { x: number; connY: number }): ReactElement {
  return (
    <Line x1={x - BAR_GAP} y1={connY} x2={x} y2={connY} stroke={colors.gray200} strokeWidth={1} />
  );
}

function WaterfallBarGroup(props: RenderedBar): ReactElement {
  const { item, x, yTop, barH, connY, barWidth, height } = props;
  return (
    <G>
      {connY !== null && <WaterfallConnectorLine x={x} connY={connY} />}
      <Rect
        x={x}
        y={yTop}
        width={barWidth}
        height={barH}
        fill={barColor(item.type)}
        stroke={colors.black}
        strokeWidth={2}
        rx={4}
      />
      <SvgText
        x={x + barWidth / 2}
        y={yTop - 4}
        fontSize={10}
        fontWeight="700"
        fill={colors.ink}
        textAnchor="middle"
      >
        {formatChartLabel(item.value)}
      </SvgText>
      <SvgText
        x={x + barWidth / 2}
        y={height - 2}
        fontSize={9}
        fontWeight="500"
        fill={colors.gray600}
        textAnchor="middle"
      >
        {item.label.length > 8 ? `${item.label.slice(0, 7)}…` : item.label}
      </SvgText>
    </G>
  );
}

function computeRenderedBars(
  data: readonly WaterfallItem[],
  positions: BarPosition[],
  barWidth: number,
  height: number,
  toY: (v: number) => number,
): RenderedBar[] {
  return data.map((item, i) => {
    const pos = positions[i]!;
    const x = CHART_PADDING + i * (barWidth + BAR_GAP);
    const yTop = toY(pos.top) + VALUE_HEIGHT;
    const connY = i > 0 ? toY(positions[i - 1]!.exitLevel) + VALUE_HEIGHT : null;
    return {
      item,
      x,
      yTop,
      barH: Math.max(2, toY(pos.base) + VALUE_HEIGHT - yTop),
      connY,
      barWidth,
      height,
    };
  });
}

function buildWaterfallAriaLabel(data: readonly WaterfallItem[]): string {
  return `Cascada: ${data.map((d) => `${d.label} ${formatChartLabel(d.value)}`).join(', ')}`;
}

export function WaterfallChart(props: WaterfallChartProps): ReactElement | null {
  const { data, height = DEFAULT_HEIGHT, testID } = props;
  if (data.length === 0) return null;
  const chartHeight = height - LABEL_HEIGHT - VALUE_HEIGHT - 8;
  const barWidth = Math.max(MIN_BAR_WIDTH, (280 - BAR_GAP * (data.length - 1)) / data.length);
  const totalWidth = data.length * barWidth + (data.length - 1) * BAR_GAP + CHART_PADDING * 2;
  const positions = computeBarPositions(data);
  const allValues = positions.flatMap((p) => [p.base, p.top]);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;
  const toY = (v: number): number => ((maxVal - v) / range) * chartHeight;
  const bars = computeRenderedBars(data, positions, barWidth, height, toY);
  const ariaLabel = buildWaterfallAriaLabel(data);
  return (
    <View testID={testID ?? 'waterfall-chart'} alignItems="center">
      <Svg
        width={totalWidth}
        height={height}
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        {bars.map((bar, i) => (
          <WaterfallBarGroup key={i} {...bar} />
        ))}
      </Svg>
    </View>
  );
}
