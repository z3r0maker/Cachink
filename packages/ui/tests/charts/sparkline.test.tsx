/**
 * Sparkline — unit tests.
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
import { Sparkline } from '../../src/charts/Sparkline/index';

function renderSparkline(points: readonly number[], extra?: Partial<Parameters<typeof Sparkline>[0]>) {
  return render(
    <TamaguiProvider config={tamaguiConfig}>
      <Sparkline points={points} testID="spark" {...extra} />
    </TamaguiProvider>,
  );
}

describe('Sparkline', () => {
  it('renders a polyline with correct number of coordinate pairs', () => {
    const { container } = renderSparkline([10, 20, 30, 40, 50, 60]);
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeNull();
    const pts = polyline!.getAttribute('points')!;
    // 6 points → 6 comma-separated pairs
    expect(pts.split(' ').length).toBe(6);
  });

  it('end dot renders when showEndDot is true', () => {
    const { container } = renderSparkline([10, 20, 30], { showEndDot: true });
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(1);
  });

  it('end dot hidden when showEndDot is false', () => {
    const { container } = renderSparkline([10, 20, 30], { showEndDot: false });
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(0);
  });

  it('single point renders nothing', () => {
    const { container } = renderSparkline([42]);
    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });

  it('empty points renders nothing', () => {
    const { container } = renderSparkline([]);
    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });

  it('all equal values renders flat horizontal line', () => {
    const { container } = renderSparkline([30, 30, 30, 30]);
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeNull();
    const pts = polyline!.getAttribute('points')!;
    // All Y coordinates should be the same (centered)
    const ys = pts.split(' ').map((p) => parseFloat(p.split(',')[1]!));
    const uniqueYs = new Set(ys.map((y) => Math.round(y * 100)));
    expect(uniqueYs.size).toBe(1);
  });

  it('negative values are handled correctly', () => {
    const { container } = renderSparkline([-10, -5, 0, 5, 10]);
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeNull();
    const pts = polyline!.getAttribute('points')!;
    expect(pts.split(' ').length).toBe(5);
  });
});
