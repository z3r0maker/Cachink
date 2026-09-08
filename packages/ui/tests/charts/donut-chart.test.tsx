/**
 * DonutChart — unit tests.
 *
 * Tests the ECharts option builder function.
 * The actual ECharts rendering is mocked (Canvas unavailable in jsdom).
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
import { DonutChart, type DonutSlice } from '../../src/charts/DonutChart/index';
import { buildDonutOption } from '../../src/charts/DonutChart/donut-chart';

function renderChart(
  slices: readonly DonutSlice[],
  extra?: Partial<Parameters<typeof DonutChart>[0]>,
) {
  return render(
    <TamaguiProvider config={tamaguiConfig}>
      <DonutChart slices={slices} testID="donut" {...extra} />
    </TamaguiProvider>,
  );
}

const fourSlices: DonutSlice[] = [
  { label: 'A', value: 400, color: '#ff0000' },
  { label: 'B', value: 300, color: '#00ff00' },
  { label: 'C', value: 200, color: '#0000ff' },
  { label: 'D', value: 100, color: '#ffff00' },
];

describe('buildDonutOption', () => {
  it('produces a pie series with donut radius', () => {
    const option = buildDonutOption(fourSlices) as {
      series: Array<{ type: string; radius: string[] }>;
    };
    expect(option.series.length).toBe(1);
    expect(option.series[0]!.type).toBe('pie');
    expect(option.series[0]!.radius).toEqual(['50%', '80%']);
  });

  it('produces correct number of data points for 4 slices', () => {
    const option = buildDonutOption(fourSlices) as {
      series: Array<{ data: Array<{ name: string }> }>;
    };
    expect(option.series[0]!.data.length).toBe(4);
  });

  it('merges slices below 3% into Otro', () => {
    const data: DonutSlice[] = [
      { label: 'Big', value: 1000, color: '#ff0000' },
      { label: 'Tiny', value: 10, color: '#00ff00' },
    ];
    const option = buildDonutOption(data) as {
      series: Array<{ data: Array<{ name: string }> }>;
    };
    const names = option.series[0]!.data.map((d) => d.name);
    expect(names).toContain('Big');
    expect(names).toContain('Otro');
    expect(names).not.toContain('Tiny');
  });

  it('all-zero values produce empty data (no division by zero)', () => {
    const data: DonutSlice[] = [
      { label: 'A', value: 0, color: '#ff0000' },
      { label: 'B', value: 0, color: '#00ff00' },
    ];
    const option = buildDonutOption(data) as {
      series: Array<{ data: unknown[] }>;
    };
    expect(option.series[0]!.data.length).toBe(0);
  });

  it('includes tooltip trigger', () => {
    const option = buildDonutOption(fourSlices) as {
      tooltip: { trigger: string };
    };
    expect(option.tooltip.trigger).toBe('item');
  });
});

describe('DonutChart', () => {
  it('renders the ECharts component', () => {
    const { container } = renderChart(fourSlices);
    expect(container.querySelector('[data-testid="echarts-mock"]')).not.toBeNull();
  });

  it('legend renders all labels', () => {
    const { container } = renderChart(fourSlices);
    const text = container.textContent ?? '';
    expect(text).toContain('A');
    expect(text).toContain('B');
    expect(text).toContain('C');
    expect(text).toContain('D');
  });

  it('center label and value render', () => {
    const { container } = renderChart(fourSlices, {
      centerLabel: 'Total',
      centerValue: '$1,000',
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Total');
    expect(text).toContain('$1,000');
  });

  it('legend renders amounts and percentages by default', () => {
    const { container } = renderChart(fourSlices);
    const text = container.textContent ?? '';
    // A=400/1000=40%, B=300/1000=30%, C=200/1000=20%, D=100/1000=10%
    expect(text).toContain('400');
    expect(text).toContain('(40%)');
    expect(text).toContain('300');
    expect(text).toContain('(30%)');
    expect(text).toContain('200');
    expect(text).toContain('(20%)');
    expect(text).toContain('100');
    expect(text).toContain('(10%)');
  });

  it('legend uses custom formatValue when provided', () => {
    const { container } = renderChart(fourSlices, {
      formatValue: (v) => `${(v / 1000).toFixed(1)}K`,
    });
    const text = container.textContent ?? '';
    expect(text).toContain('0.4K');
    expect(text).toContain('0.3K');
  });

  it('legend hides amounts when showValues is false', () => {
    const { container } = renderChart(fourSlices, { showValues: false });
    const text = container.textContent ?? '';
    expect(text).toContain('A');
    expect(text).not.toContain('(40%)');
    expect(text).not.toContain('$400');
  });

  it('legend handles zero total gracefully', () => {
    const zeroSlices: DonutSlice[] = [
      { label: 'X', value: 0, color: '#ff0000' },
      { label: 'Y', value: 0, color: '#00ff00' },
    ];
    const { container } = renderChart(zeroSlices);
    // With zero total, mergeSmallSlices returns empty → no legend at all
    const text = container.textContent ?? '';
    expect(text).not.toContain('NaN');
  });
});
