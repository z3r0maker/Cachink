/**
 * Pure computation helpers for waterfall bar positions and layout.
 * Extracted from waterfall-chart.tsx to respect the 200-line limit.
 */

import { formatChartLabel } from '../chart-tokens';
import type { WaterfallItem } from './waterfall-types';

export interface BarPosition {
  /** Lower edge of the bar (smaller value, higher SVG Y). */
  readonly base: number;
  /** Upper edge of the bar (larger value, lower SVG Y). */
  readonly top: number;
  /** Running level AFTER this bar — used for connector lines. */
  readonly exitLevel: number;
}

/**
 * Computes running cumulative positions for the waterfall effect.
 *
 * - **income** — bar rises from runningBase upward; increases running level.
 * - **expense** — bar drops from runningBase downward; decreases running level.
 * - **subtotal** — full bar from 0 to value; resets running level to value.
 */
export function computeBarPositions(data: readonly WaterfallItem[]): BarPosition[] {
  let runningBase = 0;
  return data.map((item) => {
    if (item.type === 'subtotal') {
      runningBase = item.value;
      return { base: 0, top: item.value, exitLevel: item.value };
    }
    if (item.type === 'income') {
      const base = runningBase;
      const top = runningBase + item.value;
      runningBase = top;
      return { base, top, exitLevel: top };
    }
    // expense — drops downward from current running level
    const top = runningBase;
    const base = runningBase - item.value;
    runningBase = base;
    return { base, top, exitLevel: base };
  });
}

export interface RenderedBar {
  readonly item: WaterfallItem;
  readonly x: number;
  readonly yTop: number;
  readonly barH: number;
  readonly connY: number | null;
  readonly barWidth: number;
  readonly height: number;
}

export function computeRenderedBars(
  data: readonly WaterfallItem[],
  positions: BarPosition[],
  barWidth: number,
  height: number,
  toY: (v: number) => number,
  chartPadding: number,
  barGap: number,
  valueHeight: number,
): RenderedBar[] {
  return data.map((item, i) => {
    const pos = positions[i]!;
    const x = chartPadding + i * (barWidth + barGap);
    const yTop = toY(pos.top) + valueHeight;
    const connY = i > 0 ? toY(positions[i - 1]!.exitLevel) + valueHeight : null;
    return {
      item,
      x,
      yTop,
      barH: Math.max(8, toY(pos.base) + valueHeight - yTop),
      connY,
      barWidth,
      height,
    };
  });
}

export function buildWaterfallAriaLabel(data: readonly WaterfallItem[]): string {
  return `Cascada: ${data.map((d) => `${d.label} ${formatChartLabel(d.value)}`).join(', ')}`;
}
