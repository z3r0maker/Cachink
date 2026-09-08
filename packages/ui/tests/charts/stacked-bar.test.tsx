/**
 * StackedBar — unit tests.
 *
 * Tests the ECharts option builder function.
 */

import { describe, expect, it, vi } from 'vitest';
import React from 'react';

vi.mock('echarts-for-react/esm/core', () => ({
  __esModule: true,
  default: function MockECharts(_props: Record<string, unknown>) {
    return React.createElement('div', { 'data-testid': 'echarts-mock' });
  },
}));
vi.mock('echarts/core', () => ({
  __esModule: true,
  use: vi.fn(),
  registerTheme: vi.fn(),
  graphic: {
    LinearGradient: class {
      constructor(..._args: unknown[]) {}
    },
  },
  default: { use: vi.fn(), registerTheme: vi.fn(), graphic: {} },
}));
vi.mock('echarts/charts', () => ({ BarChart: {}, LineChart: {}, PieChart: {} }));
vi.mock('echarts/components', () => ({
  GridComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
  DatasetComponent: {},
}));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: {} }));

import { render } from '@testing-library/react';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';
import { StackedBar, type BarSegment } from '../../src/charts/StackedBar/index';
import { buildStackedOption } from '../../src/charts/StackedBar/stacked-bar';

function renderChart(segments: readonly BarSegment[]) {
  return render(
    <TamaguiProvider config={tamaguiConfig}>
      <StackedBar segments={segments} testID="bar" />
    </TamaguiProvider>,
  );
}

const threeSegments: BarSegment[] = [
  { label: 'A', value: 50, color: '#ff0000' },
  { label: 'B', value: 30, color: '#00ff00' },
  { label: 'C', value: 20, color: '#0000ff' },
];

describe('buildStackedOption', () => {
  it('produces one series per segment', () => {
    const option = buildStackedOption(threeSegments) as {
      series: Array<{ type: string }>;
    };
    expect(option.series.length).toBe(3);
    for (const s of option.series) {
      expect(s.type).toBe('bar');
    }
  });

  it('all series share the same stack key', () => {
    const option = buildStackedOption(threeSegments) as {
      series: Array<{ stack: string }>;
    };
    const stacks = new Set(option.series.map((s) => s.stack));
    expect(stacks.size).toBe(1);
    expect(stacks.has('total')).toBe(true);
  });

  it('series names match segment labels', () => {
    const option = buildStackedOption(threeSegments) as {
      series: Array<{ name: string }>;
    };
    expect(option.series.map((s) => s.name)).toEqual(['A', 'B', 'C']);
  });

  it('series data values match segment values', () => {
    const option = buildStackedOption(threeSegments) as {
      series: Array<{ data: number[] }>;
    };
    expect(option.series[0]!.data).toEqual([50]);
    expect(option.series[1]!.data).toEqual([30]);
    expect(option.series[2]!.data).toEqual([20]);
  });

  it('segment colors are applied to itemStyle', () => {
    const option = buildStackedOption(threeSegments) as {
      series: Array<{ itemStyle: { color: string } }>;
    };
    expect(option.series[0]!.itemStyle.color).toBe('#ff0000');
    expect(option.series[1]!.itemStyle.color).toBe('#00ff00');
    expect(option.series[2]!.itemStyle.color).toBe('#0000ff');
  });

  it('includes animation config', () => {
    const option = buildStackedOption(threeSegments) as {
      animationDuration: number;
    };
    expect(option.animationDuration).toBe(600);
  });
});

describe('StackedBar', () => {
  it('renders the ECharts component', () => {
    const { container } = renderChart(threeSegments);
    expect(container.querySelector('[data-testid="echarts-mock"]')).not.toBeNull();
  });

  it('legend renders all labels', () => {
    const { container } = renderChart(threeSegments);
    const text = container.textContent ?? '';
    expect(text).toContain('A');
    expect(text).toContain('B');
    expect(text).toContain('C');
  });

  it('empty segments renders nothing', () => {
    const { container } = renderChart([]);
    expect(container.querySelector('[data-testid="echarts-mock"]')).toBeNull();
  });

  it('zero total renders nothing gracefully', () => {
    const segs: BarSegment[] = [
      { label: 'A', value: 0, color: '#ff0000' },
      { label: 'B', value: 0, color: '#00ff00' },
    ];
    const { container } = renderChart(segs);
    expect(container.querySelector('[data-testid="echarts-mock"]')).toBeNull();
  });

  it('legend renders amounts and percentages by default', () => {
    const { container } = renderChart(threeSegments);
    const text = container.textContent ?? '';
    // A=50/100=50%, B=30/100=30%, C=20/100=20%
    expect(text).toContain('50');
    expect(text).toContain('(50%)');
    expect(text).toContain('30');
    expect(text).toContain('(30%)');
    expect(text).toContain('20');
    expect(text).toContain('(20%)');
  });

  it('segments with 0 value are omitted from bar in option', () => {
    const segs: BarSegment[] = [
      { label: 'A', value: 100, color: '#ff0000' },
      { label: 'B', value: 0, color: '#00ff00' },
      { label: 'C', value: 50, color: '#0000ff' },
    ];
    const option = buildStackedOption(segs) as {
      series: Array<{ data: number[] }>;
    };
    // The option still has 3 series (one per segment), but B's value is 0
    expect(option.series[1]!.data).toEqual([0]);
  });
});
