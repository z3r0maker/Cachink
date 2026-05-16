/**
 * Shared types for DonutChart — consumed by both the desktop (.tsx)
 * and mobile (.native.tsx) platform-split implementations.
 */

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
  /** Show formatted amounts + percentages in the legend (default true). */
  readonly showValues?: boolean;
  /** Custom value formatter for legend rows (e.g. "$85.5K"). */
  readonly formatValue?: (value: number) => string;
  readonly testID?: string;
}
