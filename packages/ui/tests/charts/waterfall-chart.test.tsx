/**
 * WaterfallChart — unit tests.
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
import { WaterfallChart, computeBarPositions, type WaterfallItem } from '../../src/charts/WaterfallChart/index';

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
  it('renders correct number of bars for 7-item data', () => {
    const { container } = renderChart(sampleData);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(7);
  });

  it('income bars use green fill', () => {
    const { container } = renderChart(sampleData);
    const rects = container.querySelectorAll('rect');
    expect(rects[0]?.getAttribute('fill')).toBe('#00C896');
  });

  it('expense bars use red fill', () => {
    const { container } = renderChart(sampleData);
    const rects = container.querySelectorAll('rect');
    expect(rects[1]?.getAttribute('fill')).toBe('#FF4757');
  });

  it('subtotal bars use blue fill', () => {
    const { container } = renderChart(sampleData);
    const rects = container.querySelectorAll('rect');
    expect(rects[2]?.getAttribute('fill')).toBe('#3B6FFF');
  });

  it('renders labels below bars', () => {
    const { container } = renderChart(sampleData);
    const texts = container.querySelectorAll('text');
    // Each bar has a value text + label text = 14 total
    expect(texts.length).toBe(14);
  });

  it('renders values above bars', () => {
    const { container } = renderChart(sampleData);
    const texts = container.querySelectorAll('text');
    // First text is the value of first bar
    expect(texts[0]?.textContent).toBe('$50K');
  });

  it('empty data renders nothing (no crash)', () => {
    const { container } = renderChart([]);
    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });

  it('all-zero data renders flat bars at baseline', () => {
    const zeroData: WaterfallItem[] = [
      { label: 'A', value: 0, type: 'income' },
      { label: 'B', value: 0, type: 'expense' },
      { label: 'C', value: 0, type: 'subtotal' },
    ];
    const { container } = renderChart(zeroData);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(3);
    for (const rect of rects) {
      const h = Number(rect.getAttribute('height'));
      expect(h).toBeGreaterThanOrEqual(2);
    }
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
    // Income exits at 50000, then expense drops to 30000, etc.
    expect(positions[0]!.exitLevel).toBe(50000);
    expect(positions[1]!.exitLevel).toBe(30000);
    expect(positions[2]!.exitLevel).toBe(30000);
    expect(positions[3]!.exitLevel).toBe(18000);
    expect(positions[4]!.exitLevel).toBe(18000);
    expect(positions[5]!.exitLevel).toBe(12600);
    expect(positions[6]!.exitLevel).toBe(12600);
  });
});
