/**
 * DonutChart — SVG ring chart showing proportional slices with a center label.
 * Slices < 3% of total are merged into "Otro" to avoid tiny slivers.
 *
 * Uses strokeDasharray/strokeDashoffset arcs — no external path library.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../../theme';

export interface DonutSlice {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

export interface DonutChartProps {
  readonly slices: readonly DonutSlice[];
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly centerLabel?: string;
  readonly centerValue?: string;
  readonly testID?: string;
}

const DEFAULT_SIZE = 180;
const DEFAULT_STROKE = 28;
const MIN_PERCENT_THRESHOLD = 3;

/** Merge slices below threshold into "Otro". */
function mergeSmallSlices(slices: readonly DonutSlice[]): DonutSlice[] {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return [];

  const kept: DonutSlice[] = [];
  let otroValue = 0;

  for (const s of slices) {
    const pct = (s.value / total) * 100;
    if (pct < MIN_PERCENT_THRESHOLD) {
      otroValue += s.value;
    } else {
      kept.push(s);
    }
  }

  if (otroValue > 0) {
    kept.push({ label: 'Otro', value: otroValue, color: colors.gray400 });
  }

  return kept;
}

interface SliceArc {
  readonly slice: DonutSlice;
  readonly dashLength: number;
  readonly offset: number;
}

function computeSliceArcs(merged: DonutSlice[], total: number, circumference: number): SliceArc[] {
  let cumulative = 0;
  return merged.map((slice) => {
    const dashLength = (slice.value / total) * circumference;
    const offset = -cumulative + circumference * 0.25;
    cumulative += dashLength;
    return { slice, dashLength, offset };
  });
}

function DonutCenter({
  centerLabel,
  centerValue,
  size,
}: {
  centerLabel?: string;
  centerValue?: string;
  size: number;
}): ReactElement | null {
  if (!centerLabel && !centerValue) return null;
  return (
    <View
      position="absolute"
      top={0}
      left={0}
      right={0}
      height={size}
      justifyContent="center"
      alignItems="center"
    >
      {centerLabel && (
        <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray600}>
          {centerLabel}
        </Text>
      )}
      {centerValue && (
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={16}
          color={colors.black}
        >
          {centerValue}
        </Text>
      )}
    </View>
  );
}

function DonutLegend({ slices }: { slices: readonly DonutSlice[] }): ReactElement | null {
  if (slices.length === 0) return null;
  return (
    <View flexDirection="row" flexWrap="wrap" gap={8} justifyContent="center">
      {slices.map((slice, i) => (
        <View key={i} flexDirection="row" alignItems="center" gap={4}>
          <View width={10} height={10} borderRadius={2} backgroundColor={slice.color} />
          <Text fontFamily={typography.fontFamily} fontSize={11} color={colors.gray600}>
            {slice.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface DonutArcsProps {
  readonly arcs: readonly SliceArc[];
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly strokeWidth: number;
  readonly circumference: number;
}

function DonutArcs(props: DonutArcsProps): ReactElement {
  const { arcs, cx, cy, radius, strokeWidth, circumference } = props;
  return (
    <>
      {arcs.map((arc, i) => (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={arc.slice.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="butt"
        />
      ))}
    </>
  );
}

function buildAriaLabel(merged: DonutSlice[], total: number): string {
  const parts = merged.map((s) => {
    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
    return `${s.label} ${pct}%`;
  });
  return `Distribución: ${parts.join(', ')}`;
}

export function DonutChart(props: DonutChartProps): ReactElement {
  const { size = DEFAULT_SIZE, strokeWidth = DEFAULT_STROKE, testID } = props;
  const merged = mergeSmallSlices(props.slices);
  const total = merged.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  const arcs = total > 0 ? computeSliceArcs(merged, total, circumference) : [];
  const ariaLabel = buildAriaLabel(merged, total);
  return (
    <View testID={testID ?? 'donut-chart'} alignItems="center" gap={12}>
      <Svg width={size} height={size} accessibilityRole="image" accessibilityLabel={ariaLabel}>
        <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={colors.gray100} strokeWidth={strokeWidth} />
        <DonutArcs arcs={arcs} cx={cx} cy={cy} radius={radius} strokeWidth={strokeWidth} circumference={circumference} />
        <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={colors.black} strokeWidth={2} />
      </Svg>
      <DonutCenter centerLabel={props.centerLabel} centerValue={props.centerValue} size={size} />
      <DonutLegend slices={merged} />
    </View>
  );
}
