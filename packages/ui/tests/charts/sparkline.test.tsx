/**
 * Sparkline — unit tests.
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
import { Sparkline } from '../../src/charts/Sparkline/index';
import { buildSparklineOption } from '../../src/charts/Sparkline/sparkline';

describe('buildSparklineOption', () => {
  it('produces a single line series', () => {
    const option = buildSparklineOption([10, 20, 30], '#3B6FFF', 0.1) as {
      series: Array<{ type: string }>;
    };
    expect(option.series.length).toBe(1);
    expect(option.series[0]!.type).toBe('line');
  });

  it('data matches input points', () => {
    const points = [10, 20, 30, 40];
    const option = buildSparklineOption(points, '#3B6FFF', 0.1) as {
      series: Array<{ data: number[] }>;
    };
    expect(option.series[0]!.data).toEqual(points);
  });

  it('smooth curve is enabled', () => {
    const option = buildSparklineOption([10, 20], '#3B6FFF', 0.1) as {
      series: Array<{ smooth: boolean }>;
    };
    expect(option.series[0]!.smooth).toBe(true);
  });

  it('symbol is hidden', () => {
    const option = buildSparklineOption([10, 20], '#3B6FFF', 0.1) as {
      series: Array<{ showSymbol: boolean }>;
    };
    expect(option.series[0]!.showSymbol).toBe(false);
  });

  it('area style uses provided opacity', () => {
    const option = buildSparklineOption([10, 20], '#3B6FFF', 0.3) as {
      series: Array<{ areaStyle: { opacity: number } }>;
    };
    expect(option.series[0]!.areaStyle.opacity).toBe(0.3);
  });

  it('axes are hidden', () => {
    const option = buildSparklineOption([10, 20], '#3B6FFF', 0.1) as {
      xAxis: { show: boolean };
      yAxis: { show: boolean };
    };
    expect(option.xAxis.show).toBe(false);
    expect(option.yAxis.show).toBe(false);
  });
});

describe('Sparkline', () => {
  it('renders the ECharts component for valid data', () => {
    const { container } = render(
      <TamaguiProvider config={tamaguiConfig}>
        <Sparkline points={[10, 20, 30]} testID="spark" />
      </TamaguiProvider>,
    );
    expect(container.querySelector('[data-testid="echarts-mock"]')).not.toBeNull();
  });

  it('single point renders nothing', () => {
    const { container } = render(
      <TamaguiProvider config={tamaguiConfig}>
        <Sparkline points={[42]} testID="spark" />
      </TamaguiProvider>,
    );
    expect(container.querySelector('[data-testid="echarts-mock"]')).toBeNull();
  });

  it('empty points renders nothing', () => {
    const { container } = render(
      <TamaguiProvider config={tamaguiConfig}>
        <Sparkline points={[]} testID="spark" />
      </TamaguiProvider>,
    );
    expect(container.querySelector('[data-testid="echarts-mock"]')).toBeNull();
  });
});
