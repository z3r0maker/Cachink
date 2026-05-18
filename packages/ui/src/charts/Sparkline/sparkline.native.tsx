/**
 * Sparkline (mobile) — Victory Native XL Line + Area mini chart.
 *
 * Minimal trend line with optional area fill. No axes, no grid.
 * Used inside Indicadores MarginGauge cards.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { CartesianChart, Line, Area } from 'victory-native';
import { colors } from '../../theme';
import type { SparklineProps } from './sparkline-types';

export type { SparklineProps } from './sparkline-types';

const DEFAULT_HEIGHT = 40;

export function Sparkline(props: SparklineProps): ReactElement | null {
  const { points, width, height = DEFAULT_HEIGHT, color = colors.blue, fillOpacity = 0.1, testID } = props;
  if (points.length < 2) return null;
  const data = points.map((y, i) => ({ x: i, y }));

  return (
    <View testID={testID ?? 'sparkline'} width={width ?? '100%'} height={height}>
      <CartesianChart data={data} xKey="x" yKeys={['y']} padding={0} axisOptions={{ tickCount: { x: 0, y: 0 } }}>
        {({ points: chartPoints }) => (
          <>
            <Area points={chartPoints.y} y0={0} color={color} opacity={fillOpacity} curveType="natural" animate={{ type: 'timing', duration: 400 }} />
            <Line points={chartPoints.y} color={color} strokeWidth={2} curveType="natural" animate={{ type: 'timing', duration: 400 }} />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
