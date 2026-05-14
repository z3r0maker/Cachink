/**
 * DivergingBar — unit tests.
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
import { DivergingBar, type DivergingItem } from '../../src/charts/DivergingBar/index';

function renderChart(items: readonly DivergingItem[]) {
  return render(
    <TamaguiProvider config={tamaguiConfig}>
      <DivergingBar items={items} testID="diverging" />
    </TamaguiProvider>,
  );
}

describe('DivergingBar', () => {
  it('positive values render right of center (green fill)', () => {
    const { container } = renderChart([{ label: 'Op', value: 1000 }]);
    const rects = container.querySelectorAll('rect');
    expect(rects[0]?.getAttribute('fill')).toBe('#00C896');
  });

  it('negative values render left of center (red fill)', () => {
    const { container } = renderChart([{ label: 'Inv', value: -500 }]);
    const rects = container.querySelectorAll('rect');
    expect(rects[0]?.getAttribute('fill')).toBe('#FF4757');
  });

  it('mixed positive+negative renders correctly', () => {
    const { container } = renderChart([
      { label: 'Op', value: 2000 },
      { label: 'Inv', value: -1000 },
    ]);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(2);
    expect(rects[0]?.getAttribute('fill')).toBe('#00C896');
    expect(rects[1]?.getAttribute('fill')).toBe('#FF4757');
  });

  it('single item renders one bar', () => {
    const { container } = renderChart([{ label: 'Only', value: 500 }]);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(1);
  });

  it('all zeros renders flat bars at center', () => {
    const { container } = renderChart([
      { label: 'A', value: 0 },
      { label: 'B', value: 0 },
    ]);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(2);
    // Zero-value bars should have minimum width of 2
    for (const rect of rects) {
      expect(Number(rect.getAttribute('width'))).toBeGreaterThanOrEqual(2);
    }
  });

  it('labels render for each item', () => {
    const { container } = renderChart([
      { label: 'Operación', value: 1000 },
      { label: 'Inversión', value: -500 },
    ]);
    const texts = container.querySelectorAll('text');
    // 2 labels + 2 values = 4 text elements
    expect(texts.length).toBe(4);
  });

  it('empty items renders nothing', () => {
    const { container } = renderChart([]);
    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });
});
