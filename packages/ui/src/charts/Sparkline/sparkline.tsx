/**
 * Sparkline — minimal SVG trend line. No axes, no grid; just the trend +
 * optional fill area. Used inside Indicadores MarginGauge cards.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';
import { colors } from '../../theme';

export interface SparklineProps {
  readonly points: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly color?: string;
  readonly fillOpacity?: number;
  readonly showEndDot?: boolean;
  readonly testID?: string;
}

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 32;
const PADDING = 4;

interface SparklineGeometry {
  readonly polylinePoints: string;
  readonly fillPoints: string;
  readonly lastPoint: { readonly x: number; readonly y: number };
}

function computeSparkline(
  points: readonly number[],
  width: number,
  height: number,
): SparklineGeometry {
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const range = maxVal - minVal || 1;
  const plotW = width - PADDING * 2;
  const plotH = height - PADDING * 2;
  const coords = points.map((v, i) => ({
    x: PADDING + (i / (points.length - 1)) * plotW,
    y: PADDING + ((maxVal - v) / range) * plotH,
  }));
  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const fillPoints = [
    ...coords.map((c) => `${c.x},${c.y}`),
    `${coords[coords.length - 1]!.x},${height - PADDING}`,
    `${coords[0]!.x},${height - PADDING}`,
  ].join(' ');
  return { polylinePoints, fillPoints, lastPoint: coords[coords.length - 1]! };
}

export function Sparkline(props: SparklineProps): ReactElement | null {
  const {
    points,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    color = colors.blue,
    fillOpacity = 0.1,
    showEndDot = true,
    testID,
  } = props;
  if (points.length < 2) return null;
  const { polylinePoints, fillPoints, lastPoint } = computeSparkline(points, width, height);
  return (
    <View testID={testID ?? 'sparkline'}>
      <Svg
        width={width}
        height={height}
        accessibilityRole="image"
        accessibilityLabel={`Tendencia: de ${points[0]} a ${points[points.length - 1]}`}
      >
        <Polygon points={fillPoints} fill={color} opacity={fillOpacity} stroke="none" />
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showEndDot && <Circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={color} />}
      </Svg>
    </View>
  );
}
