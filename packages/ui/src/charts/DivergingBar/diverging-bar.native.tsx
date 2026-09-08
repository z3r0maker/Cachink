/**
 * DivergingBar (mobile) — pure React Native horizontal bar chart.
 *
 * Horizontal bars that grow left (negative) or right (positive)
 * from a central zero axis. Used in the Flujo de Efectivo screen.
 *
 * Replaced the CartesianChart approach with a stacked-row layout:
 * each row is [category label] [bar] [value label]. This gives
 * clean readable labels on both sides without fighting Victory's
 * axis rendering in tight mobile layouts.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, fontSizes, shapeRadii, typography } from '../../theme';
import { formatChartLabel } from '../chart-tokens';
import type { DivergingItem, DivergingBarProps } from './diverging-types';

export type { DivergingItem, DivergingBarProps } from './diverging-types';

const BAR_HEIGHT = 24;
const ROW_GAP = 8;
const LABEL_WIDTH = 90;
const VALUE_WIDTH = 60;

function buildAriaLabel(items: readonly DivergingItem[]): string {
  const parts = items.map(
    (i) => `${i.label} ${i.value >= 0 ? '+' : ''}${formatChartLabel(i.value)}`,
  );
  return `Flujos: ${parts.join(', ')}`;
}

function BarFill(p: { item: DivergingItem; maxAbsValue: number }): ReactElement {
  const barPercent = p.maxAbsValue === 0 ? 0 : (Math.abs(p.item.value) / p.maxAbsValue) * 100;
  const barWidth = `${Math.max(barPercent, 2).toFixed(1)}%`;
  const barColor = p.item.value >= 0 ? colors.green : colors.red;
  return (
    <View flex={1} height={BAR_HEIGHT} justifyContent="center">
      <View
        height={BAR_HEIGHT}
        width={barWidth}
        backgroundColor={barColor}
        borderRadius={shapeRadii.markLg}
      />
    </View>
  );
}

function BarRow(props: { item: DivergingItem; maxAbsValue: number }): ReactElement {
  const { item, maxAbsValue } = props;
  const isPositive = item.value >= 0;
  return (
    <View flexDirection="row" alignItems="center" gap={ROW_GAP} paddingVertical={4}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.xs}
        color={colors.gray600}
        width={LABEL_WIDTH}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      <BarFill item={item} maxAbsValue={maxAbsValue} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xs}
        color={isPositive ? colors.greenText : colors.redText}
        width={VALUE_WIDTH}
        textAlign="right"
        numberOfLines={1}
      >
        {formatChartLabel(item.value)}
      </Text>
    </View>
  );
}

export function DivergingBar(props: DivergingBarProps): ReactElement | null {
  const { items, testID } = props;
  if (items.length === 0) return null;

  const maxAbsValue = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  const ariaLabel = buildAriaLabel(items);

  return (
    <View
      testID={testID ?? 'diverging-bar'}
      accessibilityRole="image"
      accessibilityLabel={ariaLabel}
      paddingHorizontal={4}
    >
      {items.map((item, i) => (
        <BarRow key={i} item={item} maxAbsValue={maxAbsValue} />
      ))}
    </View>
  );
}
