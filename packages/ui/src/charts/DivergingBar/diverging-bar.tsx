/**
 * DivergingBar — horizontal bars that grow left (negative) or right (positive)
 * from a central zero axis. Used in the Flujo de Efectivo screen.
 *
 * Neobrutalist: 2px black borders, hard fills.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';
import { formatChartLabel, SEMANTIC } from '../chart-tokens';

export interface DivergingItem {
  readonly label: string;
  readonly value: number;
}

export interface DivergingBarProps {
  readonly items: readonly DivergingItem[];
  readonly height?: number;
  readonly testID?: string;
}

const BAR_HEIGHT = 28;
const BAR_GAP = 12;
const LABEL_WIDTH = 70;
const VALUE_WIDTH = 60;
const CHART_WIDTH = 280;

interface DivergingBarRowProps {
  readonly item: DivergingItem;
  readonly index: number;
  readonly centerX: number;
  readonly halfWidth: number;
  readonly maxAbs: number;
}

function DivergingBarRow(props: DivergingBarRowProps): ReactElement {
  const { item, index, centerX, halfWidth, maxAbs } = props;
  const y = index * (BAR_HEIGHT + BAR_GAP);
  const barWidth = (Math.abs(item.value) / maxAbs) * halfWidth;
  const isPositive = item.value >= 0;
  const barX = isPositive ? centerX : centerX - barWidth;
  const fillColor = isPositive ? SEMANTIC.positive : SEMANTIC.negative;
  return (
    <G>
      <SvgText
        x={4}
        y={y + BAR_HEIGHT / 2 + 4}
        fontSize={11}
        fontWeight="500"
        fill={colors.gray600}
      >
        {item.label.length > 10 ? `${item.label.slice(0, 9)}…` : item.label}
      </SvgText>
      <Rect
        x={barX}
        y={y}
        width={Math.max(barWidth, 2)}
        height={BAR_HEIGHT}
        fill={fillColor}
        stroke={colors.black}
        strokeWidth={2}
        rx={4}
      />
      <SvgText
        x={CHART_WIDTH - VALUE_WIDTH + 4}
        y={y + BAR_HEIGHT / 2 + 4}
        fontSize={11}
        fontWeight="700"
        fill={colors.ink}
      >
        {formatChartLabel(item.value)}
      </SvgText>
    </G>
  );
}

export function DivergingBar(props: DivergingBarProps): ReactElement | null {
  const { items, testID } = props;
  if (items.length === 0) return null;
  const maxAbs = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  const centerX = LABEL_WIDTH + (CHART_WIDTH - LABEL_WIDTH - VALUE_WIDTH) / 2;
  const halfWidth = (CHART_WIDTH - LABEL_WIDTH - VALUE_WIDTH) / 2;
  const totalHeight = items.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP;
  const ariaLabel = `Flujos: ${items.map((i) => `${i.label} ${i.value >= 0 ? '+' : ''}${formatChartLabel(i.value)}`).join(', ')}`;
  return (
    <View testID={testID ?? 'diverging-bar'} alignItems="center">
      <Svg
        width={CHART_WIDTH}
        height={totalHeight}
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        <Line
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={totalHeight}
          stroke={colors.gray200}
          strokeWidth={1}
        />
        {items.map((item, i) => (
          <DivergingBarRow
            key={i}
            item={item}
            index={i}
            centerX={centerX}
            halfWidth={halfWidth}
            maxAbs={maxAbs}
          />
        ))}
      </Svg>
    </View>
  );
}
