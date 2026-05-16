/**
 * Shared types for WaterfallChart — consumed by both the desktop (.tsx)
 * and mobile (.native.tsx) platform-split implementations.
 */

export interface WaterfallItem {
  readonly label: string;
  readonly value: number;
  readonly type: 'income' | 'expense' | 'subtotal';
}

export interface WaterfallChartProps {
  readonly data: readonly WaterfallItem[];
  readonly height?: number;
  readonly testID?: string;
}
