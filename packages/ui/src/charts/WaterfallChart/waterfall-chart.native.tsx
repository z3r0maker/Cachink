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
function ValueLabels(p: {
  data: readonly WaterfallItem[];
  slotWidth: number;
}): ReactElement {
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
function CategoryLabels(p: {
  data: readonly WaterfallItem[];
  slotWidth: number;
}): ReactElement {
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

export function WaterfallChart(props: WaterfallChartProps): ReactElement | null {
  const { data, height = DEFAULT_HEIGHT, testID } = props;
  if (data.length === 0) return null;

  const positions = computeBarPositions(data);

  // Scale function: map data values → pixel Y
  const allValues = positions.flatMap((p) => [p.base, p.top]);
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 0);
  const range = maxVal - minVal || 1;
  const chartH = height - VALUE_HEIGHT - LABEL_HEIGHT;
  const toY = (v: number): number => chartH - ((v - minVal) / range) * chartH;

  const bars = computeRenderedBars(data, positions, BAR_WIDTH, height, toY, PADDING, BAR_GAP, VALUE_HEIGHT);
  const chartWidth = Math.max(320, data.length * (BAR_WIDTH + BAR_GAP) + PADDING * 2);
  const ariaLabel = buildWaterfallAriaLabel(data);
  const zeroY = toY(0) + VALUE_HEIGHT;

  return (
    <View testID={testID ?? 'waterfall-chart'} accessibilityLabel={ariaLabel}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View width={chartWidth}>
          <View width={chartWidth} height={height} position="relative">
            {/* Zero line */}
            <View
              testID="waterfall-zero-line"
              position="absolute"
              top={zeroY}
              left={0}
              right={0}
              height={1}
              backgroundColor={colors.gray200}
            />
            {/* Bars + connectors */}
            {bars.map((bar, i) => (
              <View key={i} testID="waterfall-bar">
                {/* Connector dashed line from previous bar's exit level */}
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
                {/* Colored bar */}
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
            ))}
          </View>
          {/* Value labels */}
          <ValueLabels data={data} slotWidth={BAR_WIDTH + BAR_GAP} />
          {/* Category labels */}
          <CategoryLabels data={data} slotWidth={BAR_WIDTH + BAR_GAP} />
        </View>
      </ScrollView>
    </View>
  );
}
