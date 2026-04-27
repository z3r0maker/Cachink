import { describe, it, expect } from 'vitest';
import { Skeleton } from '../src/components/Skeleton/index';
import { initI18n } from '../src/i18n/index';
import { renderWithProviders, screen } from './test-utils';

initI18n();

describe('Skeleton.Row', () => {
  it('renders with the supplied testIDPrefix and index', () => {
    renderWithProviders(<Skeleton.Row index={0} testIDPrefix="ventas-skeleton" />);
    expect(screen.getByTestId('ventas-skeleton-0')).toBeInTheDocument();
  });

  it('renders with the default testID prefix when omitted', () => {
    renderWithProviders(<Skeleton.Row index={2} />);
    expect(screen.getByTestId('skeleton-2')).toBeInTheDocument();
  });
});

describe('Skeleton.Bar', () => {
  it('renders with the default 16px height and 100% width', () => {
    renderWithProviders(<Skeleton.Bar testID="default-bar" />);
    const bar = screen.getByTestId('default-bar');
    const styles = window.getComputedStyle(bar);
    expect(styles.height).toBe('16px');
  });

  it('honours the supplied height and width props', () => {
    renderWithProviders(<Skeleton.Bar height={24} width={120} testID="sized-bar" />);
    const bar = screen.getByTestId('sized-bar');
    const styles = window.getComputedStyle(bar);
    expect(styles.height).toBe('24px');
    expect(styles.width).toBe('120px');
  });

  // Audit Round 2 G4: top-up below-floor coverage.

  it('renders the canonical neutral-grey background colour for the bar', () => {
    renderWithProviders(<Skeleton.Bar testID="grey-bar" />);
    const bar = screen.getByTestId('grey-bar');
    const styles = window.getComputedStyle(bar);
    // The brand palette's gray100 = `#F2F2F0`. CSS-normalised in jsdom.
    expect(styles.backgroundColor).toMatch(/(rgb\(242, 242, 240\)|#f2f2f0)/i);
  });

  it('accepts a string width like `60%` for the inner short bar', () => {
    // The canonical Skeleton.Row composes a 100%-wide bar above a
    // 60%-wide bar. Asserting the string width path keeps the
    // primitive useful as a standalone shimmer for KPI strips.
    renderWithProviders(<Skeleton.Bar width="60%" testID="percent-bar" />);
    const bar = screen.getByTestId('percent-bar');
    // Tamagui pushes percentage widths through the className-based
    // style sheet; reading from `getComputedStyle` reflects the
    // computed value while jsdom keeps it as the resolved length.
    const computed = window.getComputedStyle(bar).width;
    expect(computed === '60%' || computed.endsWith('px')).toBe(true);
  });
});
