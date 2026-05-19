/**
 * WaterfallChart (mobile) — pure React Native Views waterfall.
 *
 * Replaces Victory CartesianChart with manually positioned View bars.
 * Each bar starts where the previous ended (proper cascade stepping).
 * Connector lines (dashed) link consecutive bars. A zero line marks
 * the break-even point.
 *
 * Value labels and category labels are rendered below the bar area.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';
import { formatChartLabel, SEMANTIC } from '../chart-tokens';
import {
  computeBarPositions,
  computeRenderedBars,
  buildWaterfallAriaLabel,
} from './waterfall-positions';
import type { WaterfallChartProps, WaterfallItem } from './waterfall-types';

export type { WaterfallItem, WaterfallChartProps } from './waterfall-types';
export type { RenderedBar } from './waterfall-positions';
export { computeBarPositions } from './waterfall-positions';

const DEFAULT_HEIGHT = 240;
const BAR_WIDTH = 36;
const BAR_GAP = 28;
const PADDING = 16;
const VALUE_HEIGHT = 20;
const LABEL_HEIGHT = 20;

function barColor(type: WaterfallItem['type'], rawValue: number): string {
  if (type === 'subtotal') {
    return rawValue < 0 ? SEMANTIC.negative : SEMANTIC.positive;
  }
  return SEMANTIC[type];
}

function valueColor(rawValue: number): string {
  return rawValue >= 0 ? colors.green : colors.red;
}

/** Value labels row rendered below the bar area. */
function ValueLabels(p: { data: readonly WaterfallItem[]; slotWidth: number }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-around" marginTop={4}>
      {p.data.map((item, i) => (
        <Text
          key={`val-${i}`}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={10}
          color={valueColor(item.value)}
          textAlign="center"
          width={p.slotWidth}
          numberOfLines={1}
        >
          {formatChartLabel(item.value)}
        </Text>
      ))}
    </View>
  );
}

/** Category labels row rendered below the value labels. */
function CategoryLabels(p: { data: readonly WaterfallItem[]; slotWidth: number }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-around">
      {p.data.map((item, i) => (
        <Text
          key={`lbl-${i}`}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={9}
          color={colors.gray600}
          textAlign="center"
          width={p.slotWidth}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      ))}
    </View>
  );
}

function computeScale(positions: ReturnType<typeof computeBarPositions>, height: number) {
  const allValues = positions.flatMap((p) => [p.base, p.top]);
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 0);
  const range = maxVal - minVal || 1;
  const chartH = height - VALUE_HEIGHT - LABEL_HEIGHT;
  const toY = (v: number): number => chartH - ((v - minVal) / range) * chartH;
  return { chartH, toY };
}

function WaterfallBarGroup({
  bar,
}: {
  bar: ReturnType<typeof computeRenderedBars>[number];
}): ReactElement {
  return (
    <View testID="waterfall-bar">
      {bar.connY !== null && (
        <View
          testID="waterfall-connector"
          position="absolute"
          top={bar.connY}
          left={bar.x - BAR_GAP}
          width={BAR_GAP}
          height={1}
          borderStyle="dashed"
          borderTopWidth={1}
          borderColor={colors.gray400}
        />
      )}
      <View
        testID="waterfall-bar-fill"
        position="absolute"
        top={bar.yTop}
        left={bar.x}
        width={bar.barWidth}
        height={bar.barH}
        borderRadius={4}
        backgroundColor={barColor(bar.item.type, bar.item.value)}
      />
    </View>
  );
}

function WaterfallBarArea(p: {
  bars: ReturnType<typeof computeRenderedBars>;
  zeroY: number;
  chartWidth: number;
  height: number;
}): ReactElement {
  return (
    <View width={p.chartWidth} height={p.height} position="relative">
      <View
        testID="waterfall-zero-line"
        position="absolute"
        top={p.zeroY}
        left={0}
        right={0}
        height={1}
        backgroundColor={colors.gray200}
      />
      {p.bars.map((bar, i) => (
        <WaterfallBarGroup key={i} bar={bar} />
      ))}
    </View>
  );
}

export function WaterfallChart(props: WaterfallChartProps): ReactElement | null {
  const { data, height = DEFAULT_HEIGHT, testID } = props;
  if (data.length === 0) return null;

  const positions = computeBarPositions(data);
  const { toY } = computeScale(positions, height);
  const bars = computeRenderedBars(
    data,
    positions,
    BAR_WIDTH,
    height,
    toY,
    PADDING,
    BAR_GAP,
    VALUE_HEIGHT,
  );
  const chartWidth = Math.max(320, data.length * (BAR_WIDTH + BAR_GAP) + PADDING * 2);
  const slotWidth = BAR_WIDTH + BAR_GAP;

  return (
    <View testID={testID ?? 'waterfall-chart'} accessibilityLabel={buildWaterfallAriaLabel(data)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View width={chartWidth}>
          <WaterfallBarArea
            bars={bars}
            zeroY={toY(0) + VALUE_HEIGHT}
            chartWidth={chartWidth}
            height={height}
          />
          <ValueLabels data={data} slotWidth={slotWidth} />
          <CategoryLabels data={data} slotWidth={slotWidth} />
        </View>
      </ScrollView>
    </View>
  );
}
