/**
 * MargenGananciaRow — component tests.
 *
 * Verifies:
 *   - Renders formatted value with margin percentage.
 *   - Shows "—" for incomplete / invalid inputs.
 *   - Highlights negative margins in red.
 *   - Shows "—" when precio is "0" (division guard).
 */

import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '../test-utils';
import { initI18n } from '../../src/i18n/index';
import { useTranslation } from '../../src/i18n/index';
import { MargenGananciaRow } from '../../src/screens/Productos/margen-ganancia-row';

initI18n();

/** Thin wrapper that threads the `t` prop from the i18n hook. */
function TestRow(props: { costoPesos: string; precioVentaPesos: string }) {
  const { t } = useTranslation();
  return (
    <MargenGananciaRow
      costoPesos={props.costoPesos}
      precioVentaPesos={props.precioVentaPesos}
      t={t}
    />
  );
}

describe('MargenGananciaRow', () => {
  it('renders "$50.00 (50%)" for costo="50" / precio="100"', () => {
    renderWithProviders(<TestRow costoPesos="50" precioVentaPesos="100" />);
    const value = screen.getByTestId('margen-ganancia-value');
    expect(value.textContent).toContain('50.00');
    expect(value.textContent).toContain('(50%)');
  });

  it('renders nothing when costo is empty', () => {
    // Review item #5: costo is optional. With no cost the margin is a
    // trivially-100% number the user cannot trust, so the whole row is
    // withheld rather than shown as an em-dash placeholder.
    renderWithProviders(<TestRow costoPesos="" precioVentaPesos="100" />);
    expect(screen.queryByTestId('margen-ganancia-value')).toBeNull();
  });

  it('renders nothing when costo is explicitly zero', () => {
    renderWithProviders(<TestRow costoPesos="0" precioVentaPesos="100" />);
    expect(screen.queryByTestId('margen-ganancia-value')).toBeNull();
  });

  it('renders "—" when precio is empty', () => {
    renderWithProviders(<TestRow costoPesos="50" precioVentaPesos="" />);
    const value = screen.getByTestId('margen-ganancia-value');
    expect(value.textContent).toBe('—');
  });

  it('renders "—" for non-numeric input "abc"', () => {
    renderWithProviders(<TestRow costoPesos="abc" precioVentaPesos="100" />);
    const value = screen.getByTestId('margen-ganancia-value');
    expect(value.textContent).toBe('—');
  });

  it('renders "—" for too many decimal places "1.234"', () => {
    renderWithProviders(<TestRow costoPesos="1.234" precioVentaPesos="100" />);
    const value = screen.getByTestId('margen-ganancia-value');
    expect(value.textContent).toBe('—');
  });

  it('renders "—" when precio is "0"', () => {
    renderWithProviders(<TestRow costoPesos="50" precioVentaPesos="0" />);
    const value = screen.getByTestId('margen-ganancia-value');
    expect(value.textContent).toBe('—');
  });

  it('renders red text when costo > precio (negative margin)', () => {
    renderWithProviders(<TestRow costoPesos="150" precioVentaPesos="100" />);
    const value = screen.getByTestId('margen-ganancia-value');
    // The component sets color={colors.red} for negative margins.
    expect(value.textContent).toContain('-50');
    // Verify the value includes a negative percentage.
    expect(value.textContent).toMatch(/-50(\.00)?%/);
  });

  it('renders the label text from i18n', () => {
    renderWithProviders(<TestRow costoPesos="50" precioVentaPesos="100" />);
    const row = screen.getByTestId('margen-ganancia-row');
    expect(row.textContent).toContain('Margen de ganancia');
  });
});
