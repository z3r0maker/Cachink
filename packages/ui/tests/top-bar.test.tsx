import { describe, it, expect } from 'vitest';
import { TopBar } from '../src/components/TopBar/index';
import { renderWithProviders, screen } from './test-utils';

describe('TopBar', () => {
  it('renders the title text', () => {
    renderWithProviders(<TopBar title="Ventas" />);
    expect(screen.getByText('Ventas')).toBeDefined();
    expect(screen.getByTestId('top-bar-title')).toBeDefined();
  });

  it('does not render a title node when omitted', () => {
    renderWithProviders(<TopBar />);
    expect(screen.queryByTestId('top-bar-title')).toBeNull();
  });

  it('renders the subtitle text when provided', () => {
    renderWithProviders(
      <TopBar title="Estados Financieros" subtitle="abril 2026" />,
    );
    expect(screen.getByText('abril 2026')).toBeDefined();
    expect(screen.getByTestId('top-bar-subtitle')).toBeDefined();
  });

  it('does not render a subtitle node when omitted', () => {
    renderWithProviders(<TopBar title="Ventas" />);
    expect(screen.queryByTestId('top-bar-subtitle')).toBeNull();
  });

  it('renders content placed in the left slot', () => {
    renderWithProviders(
      <TopBar
        title="Ventas"
        left={<span data-testid="left-content">Operativo</span>}
      />,
    );
    expect(screen.getByTestId('left-content')).toBeDefined();
  });

  it('renders content placed in the right slot', () => {
    renderWithProviders(
      <TopBar
        title="Ventas"
        right={<span data-testid="right-content">⚙</span>}
      />,
    );
    expect(screen.getByTestId('right-content')).toBeDefined();
  });

  it('renders both slot containers even when slots are empty', () => {
    renderWithProviders(<TopBar title="Ventas" />);
    // The slots themselves always exist (preserve symmetry / centered title)
    // but they're empty when no content is supplied.
    expect(screen.getByTestId('top-bar-left')).toBeDefined();
    expect(screen.getByTestId('top-bar-right')).toBeDefined();
  });

  it('applies the weight 900 / tight tracking heading voice to the title', () => {
    renderWithProviders(<TopBar title="Ventas" />);
    const title = screen.getByTestId('top-bar-title');
    const styles = getComputedStyle(title);
    expect(styles.fontWeight).toBe('900');
  });

  it('applies the gray600 muted color to the subtitle', () => {
    renderWithProviders(<TopBar title="Estados" subtitle="abril 2026" />);
    const subtitle = screen.getByTestId('top-bar-subtitle');
    // gray600 (#5A5A56) → rgb(90, 90, 86).
    expect(getComputedStyle(subtitle).color.toLowerCase()).toContain(
      'rgb(90, 90, 86)',
    );
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(<TopBar title="Ventas" testID="ventas-header" />);
    expect(screen.getAllByTestId('ventas-header').length).toBeGreaterThan(0);
  });
});
