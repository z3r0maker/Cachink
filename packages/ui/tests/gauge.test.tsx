import { describe, it, expect } from 'vitest';
import { Gauge, type GaugeTone } from '../src/components/Gauge/index';
import { renderWithProviders, screen } from './test-utils';

/**
 * Tamagui compiles percentage widths into atomic CSS classes (rather than
 * inline styles), so we read the resolved value via `getComputedStyle`. The
 * helper parses the numeric percentage and ignores Tamagui's formatting
 * differences ("50%" vs "50.00%" depending on the runtime).
 */
function fillPercent(fillNode: HTMLElement | null): number {
  expect(fillNode).not.toBeNull();
  const w = getComputedStyle(fillNode!).width;
  const match = /^(-?\d+(?:\.\d+)?)%$/.exec(w);
  expect(match, `expected ${w} to be a percentage string`).not.toBeNull();
  return Number.parseFloat(match![1]!);
}

function getFill(testID: string): HTMLElement | null {
  return screen
    .getAllByTestId(testID)[0]!
    .querySelector('[data-testid="gauge-fill"]') as HTMLElement | null;
}

describe('Gauge', () => {
  it('renders the label and default-formatted value', () => {
    renderWithProviders(<Gauge label="Margen bruto" value={62} />);
    expect(screen.getByText('Margen bruto')).toBeDefined();
    // Default formatter when max defaults to 100 → "62%".
    expect(screen.getByText('62%')).toBeDefined();
  });

  it('renders no header at all when label is omitted and showValue is false', () => {
    renderWithProviders(<Gauge value={50} showValue={false} />);
    expect(screen.queryByTestId('gauge-label')).toBeNull();
    expect(screen.queryByTestId('gauge-value')).toBeNull();
  });

  it('renders the fill width as the value/max percentage', () => {
    renderWithProviders(<Gauge value={25} max={50} testID="g25" />);
    expect(fillPercent(getFill('g25'))).toBe(50);
  });

  it('clamps a value above max to max (100% fill)', () => {
    renderWithProviders(<Gauge value={150} max={100} testID="g150" />);
    expect(fillPercent(getFill('g150'))).toBe(100);
    // Default formatter shows the clamped value, not the raw 150.
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('clamps a negative value to 0 (0% fill)', () => {
    renderWithProviders(<Gauge value={-30} max={100} testID="gneg" />);
    expect(fillPercent(getFill('gneg'))).toBe(0);
  });

  it('renders 0% fill (no division-by-zero) when max is 0', () => {
    renderWithProviders(<Gauge value={5} max={0} testID="gmax0" />);
    expect(fillPercent(getFill('gmax0'))).toBe(0);
    // max=0 falls into the non-100 branch → "0/0".
    expect(screen.getByText('0/0')).toBeDefined();
  });

  it('uses the "value/max" default formatter when max ≠ 100', () => {
    renderWithProviders(<Gauge label="x" value={4} max={12} />);
    expect(screen.getByText('4/12')).toBeDefined();
  });

  it('honors a custom valueFormatter override', () => {
    renderWithProviders(
      <Gauge
        label="Liquidez"
        value={1.3}
        max={2}
        valueFormatter={(v) => `${v.toFixed(1)}×`}
      />,
    );
    expect(screen.getByText('1.3×')).toBeDefined();
  });

  it('hides the value when showValue is false but keeps the label', () => {
    renderWithProviders(
      <Gauge label="Margen bruto" value={62} showValue={false} />,
    );
    expect(screen.getByTestId('gauge-label')).toBeDefined();
    expect(screen.queryByTestId('gauge-value')).toBeNull();
  });

  it('maps each tone to its fill color', () => {
    const cases: Array<[GaugeTone, string]> = [
      ['neutral', 'rgb(255, 214, 10)'], // yellow
      ['positive', 'rgb(0, 200, 150)'], // green
      ['warning', 'rgb(255, 184, 0)'], // warning
      ['negative', 'rgb(255, 71, 87)'], // red
    ];
    for (const [tone, expected] of cases) {
      renderWithProviders(
        <Gauge value={50} tone={tone} testID={`g-${tone}`} />,
      );
      const fill = screen
        .getAllByTestId(`g-${tone}`)[0]!
        .querySelector('[data-testid="gauge-fill"]');
      expect(getComputedStyle(fill as HTMLElement).backgroundColor.toLowerCase()).toContain(
        expected,
      );
    }
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(<Gauge value={50} testID="margen-bruto-gauge" />);
    expect(screen.getAllByTestId('margen-bruto-gauge').length).toBeGreaterThan(
      0,
    );
  });
});

describe('Gauge center-origin mode', () => {
  it('renders center divider when origin is center', () => {
    renderWithProviders(
      <Gauge value={-67} origin="center" testID="g-center" />,
    );
    expect(screen.queryByTestId('gauge-center-divider')).not.toBeNull();
  });

  it('does not render center divider in start mode', () => {
    renderWithProviders(<Gauge value={50} testID="g-start" />);
    expect(screen.queryByTestId('gauge-center-divider')).toBeNull();
  });

  it('negative value displays the actual number, not clamped to 0', () => {
    renderWithProviders(
      <Gauge value={-67} origin="center" testID="g-neg" />,
    );
    // Default formatter: -67%
    expect(screen.getByText('-67%')).toBeDefined();
  });

  it('positive value in center mode displays the actual positive number', () => {
    renderWithProviders(
      <Gauge value={42} origin="center" testID="g-pos-center" />,
    );
    expect(screen.getByText('42%')).toBeDefined();
  });

  it('clamps center-origin value to [-max, max]', () => {
    renderWithProviders(
      <Gauge value={-200} max={100} origin="center" testID="g-clamp-neg" />,
    );
    expect(screen.getByText('-100%')).toBeDefined();
  });

  it('uses negative tone for the fill', () => {
    renderWithProviders(
      <Gauge value={-50} origin="center" tone="negative" testID="g-neg-tone" />,
    );
    const fill = screen
      .getAllByTestId('g-neg-tone')[0]!
      .querySelector('[data-testid="gauge-fill"]');
    expect(fill).not.toBeNull();
  });
});

describe('Gauge center-origin with zones', () => {
  const zones = [
    { from: 0, to: 10, color: '#FFE8EA' },
    { from: 10, to: 20, color: '#FFF8E1' },
    { from: 20, to: 100, color: '#D6FFF4' },
  ] as const;

  it('center-origin negative value fills left from center', () => {
    renderWithProviders(
      <Gauge value={-50} max={100} origin="center" testID="g-center-neg" />,
    );
    const fill = getFill('g-center-neg');
    expect(fill).not.toBeNull();
    // Fill width should be 25% (50/100 * 50%)
    expect(fillPercent(fill)).toBe(25);
  });

  it('center-origin renders zones on positive half', () => {
    renderWithProviders(
      <Gauge value={50} max={100} origin="center" zones={zones} testID="g-center-zones" />,
    );
    const zoneEls = screen.getAllByTestId('gauge-zone');
    expect(zoneEls.length).toBe(3);
  });

  it('center-origin zones do not render when zones is undefined', () => {
    renderWithProviders(
      <Gauge value={50} max={100} origin="center" testID="g-center-no-zones" />,
    );
    expect(screen.queryAllByTestId('gauge-zone').length).toBe(0);
  });
});

describe('Gauge zones', () => {
  const zones = [
    { from: 0, to: 10, color: '#FFE8EA' },
    { from: 10, to: 20, color: '#FFF8E1' },
    { from: 20, to: 100, color: '#D6FFF4' },
  ] as const;

  it('renders zone segments when zones prop is provided', () => {
    renderWithProviders(
      <Gauge value={50} zones={zones} testID="g-zones" />,
    );
    const zoneEls = screen.getAllByTestId('gauge-zone');
    expect(zoneEls.length).toBe(3);
  });

  it('does not render zone segments when zones is undefined', () => {
    renderWithProviders(<Gauge value={50} testID="g-no-zones" />);
    expect(screen.queryAllByTestId('gauge-zone').length).toBe(0);
  });

  it('does not render zone segments when zones array is empty', () => {
    renderWithProviders(<Gauge value={50} zones={[]} testID="g-empty-zones" />);
    expect(screen.queryAllByTestId('gauge-zone').length).toBe(0);
  });

  it('fill bar renders on top of zones (positioned absolute)', () => {
    renderWithProviders(
      <Gauge value={50} zones={zones} testID="g-zones-fill" />,
    );
    const fill = screen
      .getAllByTestId('g-zones-fill')[0]!
      .querySelector('[data-testid="gauge-fill"]');
    expect(fill).not.toBeNull();
  });
});
