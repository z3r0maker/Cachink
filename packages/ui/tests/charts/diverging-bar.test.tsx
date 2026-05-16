/**
 * DivergingBar — unit tests.
 *
 * Tests the ECharts option builder function.
 */

import { describe, expect, it, vi } from 'vitest';
import React from 'react';

vi.mock('echarts-for-react/lib/core', () => ({
  __esModule: true,
  default: function MockECharts(props: Record<string, unknown>) {
    return React.createElement('div', { 'data-testid': 'echarts-mock' });
  },
}));
vi.mock('echarts/core', () => ({
  __esModule: true,
  use: vi.fn(),
  registerTheme: vi.fn(),
  graphic: {
    LinearGradient: class {
      constructor(public x: number, public y: number, public x2: number, public y2: number, public stops: unknown[]) {}
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
import { DivergingBar, type DivergingItem } from '../../src/charts/DivergingBar/index';
import { buildDivergingOption } from '../../src/charts/DivergingBar/diverging-bar';

function renderChart(items: readonly DivergingItem[]) {
  return render(
    <TamaguiProvider config={tamaguiConfig}>
      <DivergingBar items={items} testID="diverging" />
    </TamaguiProvider>,
  );
}

describe('buildDivergingOption', () => {
  it('produces a single bar series', () => {
    const option = buildDivergingOption([
      { label: 'Op', value: 1000 },
    ]) as { series: Array<{ type: string }> };
    expect(option.series.length).toBe(1);
    expect(option.series[0]!.type).toBe('bar');
  });

  it('y-axis labels match input labels', () => {
    const option = buildDivergingOption([
      { label: 'Operación', value: 2000 },
      { label: 'Inversión', value: -1000 },
    ]) as { yAxis: { data: string[] } };
    expect(option.yAxis.data).toEqual(['Operación', 'Inversión']);
  });

  it('data values match input values', () => {
    const items = [
      { label: 'Op', value: 2000 },
      { label: 'Inv', value: -1000 },
    ];
    const option = buildDivergingOption(items) as {
      series: Array<{ data: Array<{ value: number }> }>;
    };
    expect(option.series[0]!.data[0]!.value).toBe(2000);
    expect(option.series[0]!.data[1]!.value).toBe(-1000);
  });

  it('includes animation config', () => {
    const option = buildDivergingOption([
      { label: 'A', value: 100 },
    ]) as { animationDuration: number };
    expect(option.animationDuration).toBe(600);
  });

  it('includes tooltip', () => {
    const option = buildDivergingOption([
      { label: 'A', value: 100 },
    ]) as { tooltip: { trigger: string } };
    expect(option.tooltip.trigger).toBe('axis');
  });
});

describe('DivergingBar', () => {
  it('renders the ECharts component', () => {
    const { container } = renderChart([{ label: 'Op', value: 1000 }]);
    expect(container.querySelector('[data-testid="echarts-mock"]')).not.toBeNull();
  });

  it('empty items renders nothing', () => {
    const { container } = renderChart([]);
    expect(container.querySelector('[data-testid="echarts-mock"]')).toBeNull();
  });
});
