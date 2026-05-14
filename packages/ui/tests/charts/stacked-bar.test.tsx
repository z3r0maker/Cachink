/**
 * StackedBar — unit tests.
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
import { StackedBar, type BarSegment } from '../../src/charts/StackedBar/index';

function renderChart(segments: readonly BarSegment[]) {
  return render(
    <TamaguiProvider config={tamaguiConfig}>
      <StackedBar segments={segments} testID="bar" />
    </TamaguiProvider>,
  );
}

describe('StackedBar', () => {
  it('renders correct number of segments', () => {
    const segs: BarSegment[] = [
      { label: 'A', value: 50, color: '#ff0000' },
      { label: 'B', value: 30, color: '#00ff00' },
      { label: 'C', value: 20, color: '#0000ff' },
    ];
    const { container } = renderChart(segs);
    const rects = container.querySelectorAll('rect');
    // 3 data rects + 1 border rect = 4
    expect(rects.length).toBe(4);
  });

  it('proportional widths sum to container width', () => {
    const segs: BarSegment[] = [
      { label: 'A', value: 60, color: '#ff0000' },
      { label: 'B', value: 40, color: '#00ff00' },
    ];
    const { container } = renderChart(segs);
    const rects = Array.from(container.querySelectorAll('rect'));
    // First two rects are data, last is border
    const dataRects = rects.slice(0, 2);
    const totalWidth = dataRects.reduce((sum, r) => sum + Number(r.getAttribute('width')), 0);
    expect(totalWidth).toBeCloseTo(280, 0);
  });

  it('single segment renders full bar', () => {
    const { container } = renderChart([{ label: 'Only', value: 100, color: '#ff0000' }]);
    const rects = container.querySelectorAll('rect');
    // 1 data + 1 border = 2
    expect(rects.length).toBe(2);
    expect(Number(rects[0]!.getAttribute('width'))).toBeCloseTo(280, 0);
  });

  it('empty segments renders nothing', () => {
    const { container } = renderChart([]);
    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });

  it('very small segment gets minimum 2% width', () => {
    const segs: BarSegment[] = [
      { label: 'Big', value: 99, color: '#ff0000' },
      { label: 'Tiny', value: 1, color: '#00ff00' },
    ];
    const { container } = renderChart(segs);
    const rects = Array.from(container.querySelectorAll('rect'));
    const tinyWidth = Number(rects[1]!.getAttribute('width'));
    // Minimum is 2% of total space → should be visible (> ~5px)
    expect(tinyWidth).toBeGreaterThan(5);
  });

  it('legend renders all labels', () => {
    const segs: BarSegment[] = [
      { label: 'Efectivo', value: 50, color: '#ff0000' },
      { label: 'Inventarios', value: 50, color: '#00ff00' },
    ];
    const { container } = renderChart(segs);
    const text = container.textContent ?? '';
    expect(text).toContain('Efectivo');
    expect(text).toContain('Inventarios');
  });

  it('zero total renders nothing gracefully', () => {
    const segs: BarSegment[] = [
      { label: 'A', value: 0, color: '#ff0000' },
      { label: 'B', value: 0, color: '#00ff00' },
    ];
    const { container } = renderChart(segs);
    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });
});
