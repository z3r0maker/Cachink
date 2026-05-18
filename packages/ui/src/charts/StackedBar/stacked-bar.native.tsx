/**
 * StackedBar (mobile) — pure React Native Views stacked bar.
 *
 * A single horizontal stacked bar showing proportional segments with
 * inline percentage labels on wide segments. Replaces Victory CartesianChart
 * for better readability and zero external charting dependency.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';
import type { BarSegment, StackedBarProps } from './stacked-types';

export type { BarSegment, StackedBarProps } from './stacked-types';

const DEFAULT_HEIGHT = 28;
const INLINE_LABEL_THRESHOLD = 15;

function StackedLegend(props: {
  segments: readonly BarSegment[];
  total: number;
  showValues: boolean;
  formatValue?: (v: number) => string;
}): ReactElement {
  return (
    <View gap={4}>
      {props.segments.map((seg, i) => {
        const pct = props.total > 0 ? Math.round((seg.value / props.total) * 100) : 0;
        const formatted = props.formatValue?.(seg.value) ?? `$${seg.value.toFixed(0)}`;
        return (
          <View key={i} flexDirection="row" alignItems="center" gap={6}>
            <View width={8} height={8} borderRadius={4} backgroundColor={seg.color} />
            <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray600}>
              {seg.label}
            </Text>
            {props.showValues && (
              <>
                <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray400}>
                  —
                </Text>
                <Text fontFamily={typography.fontFamily} fontSize={11} fontWeight={typography.weights.bold} color={colors.ink}>
                  {formatted}
                </Text>
                <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray400}>
                  ({pct}%)
                </Text>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

function BarSegmentView({ seg, pct }: { seg: BarSegment; pct: number }): ReactElement | null {
  if (pct <= 0) return null;
  return (
    <View testID="stacked-bar-segment" width={`${pct.toFixed(1)}%`} backgroundColor={seg.color} height="100%" justifyContent="center" alignItems="center">
      {pct >= INLINE_LABEL_THRESHOLD && (
        <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={10} color={colors.white} textAlign="center">
          {Math.round(pct)}%
        </Text>
      )}
    </View>
  );
}

function BarTrack(props: { segments: readonly BarSegment[]; total: number; height: number }): ReactElement {
  return (
    <View testID="stacked-bar-track" flexDirection="row" height={props.height} borderRadius={4} overflow="hidden" borderColor={colors.black} borderWidth={2}>
      {props.segments.map((seg, i) => {
        const pct = props.total > 0 ? (seg.value / props.total) * 100 : 0;
        return <BarSegmentView key={i} seg={seg} pct={pct} />;
      })}
    </View>
  );
}

function buildAriaLabel(segments: readonly BarSegment[], total: number): string {
  const parts = segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`);
  return `Composición: ${parts.join(', ')}`;
}

export function StackedBar(props: StackedBarProps): ReactElement | null {
  const { segments, height = DEFAULT_HEIGHT, showValues = true, testID } = props;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0 || segments.length === 0) return null;

  const ariaLabel = buildAriaLabel(segments, total);

  return (
    <View
      testID={testID ?? 'stacked-bar'}
      gap={8}
      accessibilityRole="image"
      accessibilityLabel={ariaLabel}
    >
      <BarTrack segments={segments} total={total} height={height} />
      <StackedLegend
        segments={segments}
        total={total}
        showValues={showValues}
        formatValue={props.formatValue}
      />
    </View>
  );
}
