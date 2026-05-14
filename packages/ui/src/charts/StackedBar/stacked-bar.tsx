/**
 * StackedBar — a single horizontal stacked bar showing proportional segments.
 * Used in the Balance General Activo card to visualize asset composition.
 *
 * Neobrutalist: 2px black border, hard fills.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import Svg, { Rect } from 'react-native-svg';
import { colors, typography } from '../../theme';

export interface BarSegment {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

export interface StackedBarProps {
  readonly segments: readonly BarSegment[];
  readonly height?: number;
  readonly testID?: string;
}

const DEFAULT_HEIGHT = 28;
const BAR_WIDTH = 280;
const MIN_SEGMENT_PCT = 2;

function StackedLegend({ segments }: { segments: readonly BarSegment[] }): ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap={8}>
      {segments.map((seg, i) => (
        <View key={i} flexDirection="row" alignItems="center" gap={4}>
          <View width={8} height={8} borderRadius={4} backgroundColor={seg.color} />
          <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray600}>
            {seg.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function BorderRect({ height }: { height: number }): ReactElement {
  return (
    <Rect
      x={0}
      y={0}
      width={BAR_WIDTH}
      height={height}
      fill="none"
      stroke={colors.black}
      strokeWidth={2}
      rx={8}
    />
  );
}

function buildStackedAriaLabel(segments: readonly BarSegment[], total: number): string {
  const parts = segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`);
  return `Composición: ${parts.join(', ')}`;
}

export function StackedBar(props: StackedBarProps): ReactElement | null {
  const { segments, height = DEFAULT_HEIGHT, testID } = props;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0 || segments.length === 0) return null;
  const rawPcts = segments.map((s) => (s.value / total) * 100);
  const adjustedPcts = rawPcts.map((p) => Math.max(p, MIN_SEGMENT_PCT));
  const adjustedSum = adjustedPcts.reduce((a, b) => a + b, 0);
  const normalizedPcts = adjustedPcts.map((p) => (p / adjustedSum) * 100);
  let xOffset = 0;
  const barRects = segments.map((seg, i) => {
    const w = (normalizedPcts[i]! / 100) * BAR_WIDTH;
    const x = xOffset;
    xOffset += w;
    return { seg, x, w, rx: i === 0 ? 8 : i === segments.length - 1 ? 8 : 0 };
  });
  const ariaLabel = buildStackedAriaLabel(segments, total);
  return (
    <View testID={testID ?? 'stacked-bar'} gap={8}>
      <Svg
        width={BAR_WIDTH}
        height={height}
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        {barRects.map(({ seg, x, w, rx }, i) => (
          <Rect key={i} x={x} y={0} width={w} height={height} fill={seg.color} rx={rx} />
        ))}
        <BorderRect height={height} />
      </Svg>
      <StackedLegend segments={segments} />
    </View>
  );
}
