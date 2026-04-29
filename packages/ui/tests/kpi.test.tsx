import { describe, it, expect } from 'vitest';
import { Kpi, type KpiTone } from '../src/components/Kpi/index';
import { renderWithProviders, screen } from './test-utils';

describe('Kpi', () => {
  it('renders the label text', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" />);
    expect(screen.getByText('Ventas hoy')).toBeDefined();
  });

  it('renders the value text', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" />);
    expect(screen.getByText('$8,450.00')).toBeDefined();
  });

  it('applies uppercase textTransform to the label (brand §8.2)', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" />);
    const label = screen.getByTestId('kpi-label');
    expect(getComputedStyle(label).textTransform).toBe('uppercase');
  });

  it('applies the gray600 color to the label', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" />);
    const label = screen.getByTestId('kpi-label');
    // gray600 (#5A5A56) → rgb(90, 90, 86).
    expect(getComputedStyle(label).color.toLowerCase()).toContain(
      'rgb(90, 90, 86)',
    );
  });

  it('renders the value at weight 900 with tabular numerals', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" />);
    const value = screen.getByTestId('kpi-value');
    const styles = getComputedStyle(value);
    expect(styles.fontWeight).toBe('900');
    // tabular-nums shows up in the inline style; jsdom serializes
    // `fontVariant: ['tabular-nums']` to a string containing "tabular-nums".
    expect(styles.fontVariant).toContain('tabular-nums');
  });

  it('applies the neutral tone (black value) by default', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" />);
    const value = screen.getByTestId('kpi-value');
    // black (#0D0D0D) → rgb(13, 13, 13).
    expect(getComputedStyle(value).color.toLowerCase()).toContain(
      'rgb(13, 13, 13)',
    );
  });

  it('maps each tone to its brand color', () => {
    const cases: Array<[KpiTone, string]> = [
      ['neutral', 'rgb(13, 13, 13)'], // black #0D0D0D
      ['positive', 'rgb(0, 200, 150)'], // green #00C896
      ['negative', 'rgb(255, 71, 87)'], // red #FF4757
    ];
    for (const [tone, expected] of cases) {
      renderWithProviders(
        <Kpi
          label="x"
          value="1"
          tone={tone}
          testID={`kpi-${tone}`}
        />,
      );
      const root = screen.getAllByTestId(`kpi-${tone}`)[0]!;
      const valueNode = root.querySelector('[data-testid="kpi-value"]');
      expect(valueNode).not.toBeNull();
      expect(getComputedStyle(valueNode!).color.toLowerCase()).toContain(
        expected,
      );
    }
  });

  it('renders the hint when provided', () => {
    renderWithProviders(
      <Kpi label="Ventas hoy" value="$8,450.00" hint="vs. ayer +12%" />,
    );
    expect(screen.getByTestId('kpi-hint')).toBeDefined();
    expect(screen.getByText('vs. ayer +12%')).toBeDefined();
  });

  it('does not render a hint node when omitted', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" />);
    expect(screen.queryByTestId('kpi-hint')).toBeNull();
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(
      <Kpi label="Ventas hoy" value="$8,450.00" testID="ventas-hoy-kpi" />,
    );
    expect(screen.getAllByTestId('ventas-hoy-kpi').length).toBeGreaterThan(0);
  });

  // UI-AUDIT-1 Issue 4 — Kpi gained an `align` prop so the totals
  // Kpis on the NIF financial-statement screens can right-align their
  // value with the right-aligned numeric column inside the body Card
  // above them.
  it('left-aligns its rows by default', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" testID="kpi-default" />);
    const root = screen.getByTestId('kpi-default');
    expect(getComputedStyle(root).alignItems).toBe('flex-start');
  });

  it('right-aligns its rows when align="right" is passed', () => {
    renderWithProviders(
      <Kpi label="Utilidad neta" value="$0.00" align="right" testID="kpi-right" />,
    );
    const root = screen.getByTestId('kpi-right');
    expect(getComputedStyle(root).alignItems).toBe('flex-end');
  });
});
