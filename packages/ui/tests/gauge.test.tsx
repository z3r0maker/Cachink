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
