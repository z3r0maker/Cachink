import { describe, it, expect } from 'vitest';
import { SectionTitle } from '../src/components/SectionTitle/index';
import { renderWithProviders, screen } from './test-utils';

describe('SectionTitle', () => {
  it('renders the title text', () => {
    renderWithProviders(<SectionTitle title="Ventas hoy" />);
    expect(screen.getByText('Ventas hoy')).toBeDefined();
  });

  it('applies uppercase textTransform to the title (brand §8.2)', () => {
    renderWithProviders(<SectionTitle title="Ventas hoy" />);
    const title = screen.getByTestId('section-title-text');
    expect(getComputedStyle(title).textTransform).toBe('uppercase');
  });

  it('applies the gray600 label color and 700 weight (brand §8.2)', () => {
    renderWithProviders(<SectionTitle title="Ventas hoy" />);
    const title = screen.getByTestId('section-title-text');
    const styles = getComputedStyle(title);
    // gray600 (#5A5A56) → rgb(90, 90, 86).
    expect(styles.color.toLowerCase()).toContain('rgb(90, 90, 86)');
    // weights.bold === 700 in theme.ts.
    expect(styles.fontWeight).toBe('700');
  });

  it('preserves the original casing in the DOM (visual uppercase is CSS only)', () => {
    renderWithProviders(<SectionTitle title="Cuentas por cobrar" />);
    // The rendered text node still contains the original, proper-cased
    // Spanish so screen readers announce "Cuentas por cobrar", not the
    // visually-uppercased "CUENTAS POR COBRAR".
    expect(screen.getByText('Cuentas por cobrar')).toBeDefined();
    expect(screen.queryByText('CUENTAS POR COBRAR')).toBeNull();
  });

  it('renders the action slot when provided', () => {
    renderWithProviders(
      <SectionTitle
        title="Cuentas por cobrar"
        action={<span data-testid="action-slot">Ver todo</span>}
      />,
    );
    expect(screen.getByTestId('section-title-action')).toBeDefined();
    expect(screen.getByTestId('action-slot')).toBeDefined();
    expect(screen.getByText('Ver todo')).toBeDefined();
  });

  it('does not render an action wrapper when `action` is omitted', () => {
    renderWithProviders(<SectionTitle title="Ventas hoy" />);
    expect(screen.queryByTestId('section-title-action')).toBeNull();
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(<SectionTitle title="Ventas hoy" testID="ventas-hoy-header" />);
    expect(screen.getAllByTestId('ventas-hoy-header').length).toBeGreaterThan(0);
  });
});
