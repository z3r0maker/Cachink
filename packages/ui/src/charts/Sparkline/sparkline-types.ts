/**
 * Shared types for Sparkline — consumed by both the desktop (.tsx)
 * and mobile (.native.tsx) platform-split implementations.
 */

export interface SparklineProps {
  readonly points: readonly number[];
  readonly width?: number;
  readonly height?: number;
  readonly color?: string;
  readonly fillOpacity?: number;
  readonly showEndDot?: boolean;
  readonly testID?: string;
}
