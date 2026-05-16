/**
 * Shared types for DivergingBar — consumed by both the desktop (.tsx)
 * and mobile (.native.tsx) platform-split implementations.
 */

export interface DivergingItem {
  readonly label: string;
  readonly value: number;
}

export interface DivergingBarProps {
  readonly items: readonly DivergingItem[];
  readonly height?: number;
  readonly testID?: string;
}
