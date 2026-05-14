/**
 * DonutChart — unit tests.
 */

import { describe, expect, it, vi } from 'vitest';
import React from 'react';

vi.mock('react-native-svg', () => {
  function make(tag: string) {
    return function Mock(props: Record<string, unknown>) {
      const { children, ...rest } = props;
      return React.createElement(tag, rest, children as never);
    };
  }
  return {
    __esModule: true,
    default: make('svg'),
    Svg: make('svg'),
    G: make('g'),
    Rect: make('rect'),
    Circle: make('circle'),
    Line: make('line'),
    Text: make('text'),
    Polyline: make('polyline'),
    Polygon: make('polygon'),
    Path: make('path'),
  };
});

import { render } from '@testing-library/react';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';
import { DonutChart, type DonutSlice } from '../../src/charts/DonutChart/index';

function renderChart(slices: readonly DonutSlice[], extra?: Partial<Parameters<typeof DonutChart>[0]>) {
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

describe('DonutChart', () => {
  it('renders correct number of arcs for 4-slice data', () => {
    const { container } = renderChart(fourSlices);
    // 1 background circle + 4 data circles + 1 border circle = 6
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(6);
  });

  it('renders proportional arcs — 4 data circles for 4 valid slices', () => {
    const { container } = renderChart(fourSlices);
    const circles = container.querySelectorAll('circle');
    // background(1) + data(4) + border(1) = 6
    expect(circles.length).toBe(6);
    // Data circles have a unique stroke color (not gray100 / black)
    const dataCircles = Array.from(circles).filter((c) => {
      const stroke = c.getAttribute('stroke');
      return stroke !== null && stroke !== '#F2F2F0' && stroke !== '#0D0D0D';
    });
    expect(dataCircles.length).toBe(4);
  });

  it('slices below 3% are merged into Otro', () => {
    const data: DonutSlice[] = [
      { label: 'Big', value: 1000, color: '#ff0000' },
      { label: 'Tiny', value: 10, color: '#00ff00' },
    ];
    const { container } = renderChart(data);
    // background + 2 arcs (Big + Otro) + border = 4
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(4);
  });

  it('single slice renders full circle', () => {
    const { container } = renderChart([{ label: 'All', value: 100, color: '#ff0000' }]);
    // background + 1 data + border = 3
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
  });

  it('empty slices array renders no crash', () => {
    const { container } = renderChart([]);
    // Only background + border = 2
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
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

  it('all-zero values renders empty ring gracefully', () => {
    const data: DonutSlice[] = [
      { label: 'A', value: 0, color: '#ff0000' },
      { label: 'B', value: 0, color: '#00ff00' },
    ];
    const { container } = renderChart(data);
    // 0-total → mergeSmallSlices returns [] → only background + border
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });
});
