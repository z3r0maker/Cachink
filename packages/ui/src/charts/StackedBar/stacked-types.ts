/**
 * Shared types for StackedBar — consumed by both the desktop (.tsx)
 * and mobile (.native.tsx) platform-split implementations.
 */

export interface BarSegment {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

export interface StackedBarProps {
  readonly segments: readonly BarSegment[];
  readonly height?: number;
  /** Show formatted amounts + percentages in the legend (default true). */
  readonly showValues?: boolean;
  /** Custom value formatter for legend rows (e.g. "$85.5K"). */
  readonly formatValue?: (value: number) => string;
  readonly testID?: string;
}
