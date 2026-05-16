/**
 * WaterfallChart — unit tests.
 *
 * Tests the ECharts option builder function and the shared position math.
 * The actual ECharts rendering is mocked (Canvas unavailable in jsdom).
 */

import { describe, expect, it, vi } from 'vitest';
import React from 'react';

// Mock ECharts renderer to a simple div
vi.mock('echarts-for-react/lib/core', () => ({
  __esModule: true,
  default: function MockECharts(props: Record<string, unknown>) {
    return React.createElement('div', { 'data-testid': 'echarts-mock', 'data-option': JSON.stringify(props.option) });
  },
}));

vi.mock('echarts/core', () => {
  const graphic = {
    LinearGradient: class {
      constructor(public x: number, public y: number, public x2: number, public y2: number, public stops: unknown[]) {}
    },
  };
  return {
    __esModule: true,
    use: vi.fn(),
    registerTheme: vi.fn(),
    graphic,
    default: { use: vi.fn(), registerTheme: vi.fn(), graphic },
  };
});
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
import {
  WaterfallChart,
  computeBarPositions,
  type WaterfallItem,
} from '../../src/charts/WaterfallChart/index';
import { computeRenderedBars } from '../../src/charts/WaterfallChart/waterfall-positions';
import { buildWaterfallOption } from '../../src/charts/WaterfallChart/waterfall-chart';

function renderChart(data: readonly WaterfallItem[]) {
  return render(
    <TamaguiProvider config={tamaguiConfig}>
      <WaterfallChart data={data} testID="waterfall" />
    </TamaguiProvider>,
  );
}

const sampleData: WaterfallItem[] = [
  { label: 'Ingresos', value: 50000, type: 'income' },
  { label: 'Costo', value: 20000, type: 'expense' },
  { label: 'Ut. Bruta', value: 30000, type: 'subtotal' },
  { label: 'Gastos Op.', value: 12000, type: 'expense' },
  { label: 'Ut. Op.', value: 18000, type: 'subtotal' },
  { label: 'ISR', value: 5400, type: 'expense' },
  { label: 'Ut. Neta', value: 12600, type: 'subtotal' },
];

describe('WaterfallChart', () => {
  it('empty data renders nothing (no crash)', () => {
    const { container } = renderChart([]);
    expect(container.querySelector('[data-testid="echarts-mock"]')).toBeNull();
  });

  it('renders the ECharts component for non-empty data', () => {
    const { container } = renderChart(sampleData);
    expect(container.querySelector('[data-testid="echarts-mock"]')).not.toBeNull();
  });
});

describe('buildWaterfallOption', () => {
  it('produces two series: transparent base + visible bars', () => {
    const option = buildWaterfallOption(sampleData) as { series: Array<{ name: string }> };
    expect(option.series.length).toBe(2);
    expect(option.series[0]!.name).toBe('base');
    expect(option.series[1]!.name).toBe('value');
  });

  it('base series has transparent color', () => {
    const option = buildWaterfallOption(sampleData) as {
      series: Array<{ itemStyle: { color: string } }>;
    };
    expect(option.series[0]!.itemStyle.color).toBe('transparent');
  });

  it('value series has correct number of data points', () => {
    const option = buildWaterfallOption(sampleData) as {
      series: Array<{ data: unknown[] }>;
    };
    expect(option.series[1]!.data.length).toBe(7);
  });

  it('x-axis labels match input data labels', () => {
    const option = buildWaterfallOption(sampleData) as {
      xAxis: { data: string[] };
    };
    expect(option.xAxis.data).toEqual([
      'Ingresos', 'Costo', 'Ut. Bruta', 'Gastos Op.', 'Ut. Op.', 'ISR', 'Ut. Neta',
    ]);
  });

  it('includes animation config', () => {
    const option = buildWaterfallOption(sampleData) as {
      animationDuration: number;
      animationEasing: string;
    };
    expect(option.animationDuration).toBe(600);
    expect(option.animationEasing).toBe('cubicOut');
  });

  it('includes tooltip config', () => {
    const option = buildWaterfallOption(sampleData) as {
      tooltip: { trigger: string };
    };
    expect(option.tooltip.trigger).toBe('axis');
  });
});

describe('computeBarPositions', () => {
  it('income raises the running level', () => {
    const data: WaterfallItem[] = [
      { label: 'Ingresos', value: 15, type: 'income' },
    ];
    const [pos] = computeBarPositions(data);
    expect(pos).toEqual({ base: 0, top: 15, exitLevel: 15 });
  });

  it('expense lowers the running level from subtotal', () => {
    const data: WaterfallItem[] = [
      { label: 'Income', value: 100, type: 'income' },
      { label: 'Cost', value: 40, type: 'expense' },
    ];
    const positions = computeBarPositions(data);
    expect(positions[1]).toEqual({ base: 60, top: 100, exitLevel: 60 });
  });

  it('subtotal bar always starts at 0', () => {
    const data: WaterfallItem[] = [
      { label: 'Income', value: 100, type: 'income' },
      { label: 'Cost', value: 40, type: 'expense' },
      { label: 'Gross', value: 60, type: 'subtotal' },
    ];
    const positions = computeBarPositions(data);
    expect(positions[2]).toEqual({ base: 0, top: 60, exitLevel: 60 });
  });

  it('full Estado de Resultados cascade produces correct positions', () => {
    const data: WaterfallItem[] = [
      { label: 'Ingresos', value: 15, type: 'income' },
      { label: 'Costo', value: 10, type: 'expense' },
      { label: 'Ut. Bruta', value: 5, type: 'subtotal' },
      { label: 'Gastos Op.', value: 0, type: 'expense' },
      { label: 'Ut. Op.', value: 5, type: 'subtotal' },
      { label: 'ISR', value: 1.5, type: 'expense' },
      { label: 'Ut. Neta', value: 3.5, type: 'subtotal' },
    ];
    const positions = computeBarPositions(data);
    expect(positions).toEqual([
      { base: 0, top: 15, exitLevel: 15 },
      { base: 5, top: 15, exitLevel: 5 },
      { base: 0, top: 5, exitLevel: 5 },
      { base: 5, top: 5, exitLevel: 5 },
      { base: 0, top: 5, exitLevel: 5 },
      { base: 3.5, top: 5, exitLevel: 3.5 },
      { base: 0, top: 3.5, exitLevel: 3.5 },
    ]);
  });

  it('exit levels form a monotonic cascade (income → expenses → net)', () => {
    const positions = computeBarPositions(sampleData);
    expect(positions[0]!.exitLevel).toBe(50000);
    expect(positions[1]!.exitLevel).toBe(30000);
    expect(positions[2]!.exitLevel).toBe(30000);
    expect(positions[3]!.exitLevel).toBe(18000);
    expect(positions[4]!.exitLevel).toBe(18000);
    expect(positions[5]!.exitLevel).toBe(12600);
    expect(positions[6]!.exitLevel).toBe(12600);
  });

  it('zero-value items produce non-zero bar heights (min 8px)', () => {
    const data: WaterfallItem[] = [
      { label: 'Income', value: 100, type: 'income' },
      { label: 'Zero', value: 0, type: 'expense' },
      { label: 'Total', value: 100, type: 'subtotal' },
    ];
    const positions = computeBarPositions(data);
    const toY = (v: number): number => 200 - (v / 100) * 200;
    const bars = computeRenderedBars(data, positions, 36, 240, toY, 16, 28, 20);
    // Zero-value bar should get minimum height of 8
    expect(bars[1]!.barH).toBeGreaterThanOrEqual(8);
  });
});
