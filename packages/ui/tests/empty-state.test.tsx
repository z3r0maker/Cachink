import { describe, it, expect } from 'vitest';
import { EmptyState } from '../src/components/EmptyState/index';
import { renderWithProviders, screen } from './test-utils';

describe('EmptyState', () => {
  it('renders the title text', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" />);
    expect(screen.getByText('Sin ventas todavía')).toBeDefined();
  });

  it('applies the black heading color and 900 weight to the title (brand §8.2)', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" />);
    const title = screen.getByText('Sin ventas todavía');
    const styles = getComputedStyle(title);
    // black (#0D0D0D) → rgb(13, 13, 13).
    expect(styles.color.toLowerCase()).toContain('rgb(13, 13, 13)');
    // weights.black === 900 in theme.ts.
    expect(styles.fontWeight).toBe('900');
  });

  it('renders the emoji when provided (legacy back-compat)', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" emoji="📭" />);
    expect(screen.getByTestId('empty-state-emoji')).toBeDefined();
    expect(screen.getByText('📭')).toBeDefined();
  });

  it('does not render an emoji node when `emoji` is omitted', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" />);
    expect(screen.queryByTestId('empty-state-emoji')).toBeNull();
  });

  it('renders the canonical Icon-in-yellow-square illustration when icon is provided', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" icon="receipt" />);
    expect(screen.getByTestId('empty-state-icon-box')).toBeDefined();
    // The Icon underneath uses the receipt glyph testID.
    expect(screen.getAllByTestId('icon-receipt').length).toBeGreaterThan(0);
  });

  it('icon wins over emoji when both are passed (deprecation path)', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" icon="receipt" emoji="📭" />);
    expect(screen.getByTestId('empty-state-icon-box')).toBeDefined();
    expect(screen.queryByTestId('empty-state-emoji')).toBeNull();
  });

  it('does not render an icon-box when icon is omitted', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" />);
    expect(screen.queryByTestId('empty-state-icon-box')).toBeNull();
  });

  it('renders the description in muted gray when provided', () => {
    renderWithProviders(
      <EmptyState title="Sin ventas todavía" description="Registra tu primera venta del día." />,
    );
    const description = screen.getByText('Registra tu primera venta del día.');
    // gray400 (#9E9E9A) → rgb(158, 158, 154).
    expect(getComputedStyle(description).color.toLowerCase()).toContain('rgb(158, 158, 154)');
  });

  it('does not render a description node when `description` is omitted', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" />);
    expect(screen.queryByTestId('empty-state-description')).toBeNull();
  });

  it('renders the action slot when provided', () => {
    renderWithProviders(
      <EmptyState
        title="Sin ventas todavía"
        action={<span data-testid="cta-slot">+ Nueva Venta</span>}
      />,
    );
    expect(screen.getByTestId('cta-slot')).toBeDefined();
    expect(screen.getByText('+ Nueva Venta')).toBeDefined();
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(<EmptyState title="Sin ventas todavía" testID="ventas-vacio" />);
    expect(screen.getAllByTestId('ventas-vacio').length).toBeGreaterThan(0);
  });
});
