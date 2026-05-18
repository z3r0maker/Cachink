/**
 * QuickAmounts component tests.
 *
 * Verifies MXN bill pills rendering, Exacto visibility control,
 * onSelect callback values, and scroll indicator presence.
 */

import { describe, expect, it, vi } from 'vitest';
import { QuickAmounts, MXN_BILL_AMOUNTS } from '../../src/components/Numpad/quick-amounts';
import { renderWithProviders, screen, fireEvent } from '../test-utils';

// Mock haptics (no-op in test environment)
vi.mock('../../src/haptics/index', () => ({
  impactLight: vi.fn(),
  impactMedium: vi.fn(),
  notificationSuccess: vi.fn(),
  notificationError: vi.fn(),
}));

function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    onSelect: vi.fn(),
    onExacto: vi.fn(),
    ...overrides,
  };
}

describe('QuickAmounts', () => {
  it('renders all MXN bill pills by default', () => {
    renderWithProviders(<QuickAmounts {...defaultProps()} />);

    for (const amt of MXN_BILL_AMOUNTS) {
      expect(screen.getByTestId(`quick-amount-${amt.label}`)).toBeTruthy();
    }
  });

  it('renders the "Exacto" pill when showExacto is undefined (default true)', () => {
    renderWithProviders(<QuickAmounts {...defaultProps()} />);

    expect(screen.getByTestId('quick-amount-exacto')).toBeTruthy();
  });

  it('hides the "Exacto" pill when showExacto={false}', () => {
    renderWithProviders(<QuickAmounts {...defaultProps({ showExacto: false })} />);

    expect(screen.queryByTestId('quick-amount-exacto')).toBeNull();
  });

  it('calls onSelect with correct centavos value on pill tap', () => {
    const onSelect = vi.fn();
    renderWithProviders(<QuickAmounts {...defaultProps({ onSelect })} />);

    // Tap the $200 pill
    fireEvent.click(screen.getByTestId('quick-amount-$200'));
    expect(onSelect).toHaveBeenCalledWith(20000n);

    // Tap the $1000 pill
    fireEvent.click(screen.getByTestId('quick-amount-$1000'));
    expect(onSelect).toHaveBeenCalledWith(100000n);
  });

  it('calls onExacto when Exacto pill is tapped', () => {
    const onExacto = vi.fn();
    renderWithProviders(<QuickAmounts {...defaultProps({ onExacto })} />);

    fireEvent.click(screen.getByTestId('quick-amount-exacto'));
    expect(onExacto).toHaveBeenCalledTimes(1);
  });

  it('renders the quick-amounts scroll container', () => {
    renderWithProviders(<QuickAmounts {...defaultProps()} />);

    // The scroll container renders with the correct testID
    const scrollView = screen.getByTestId('quick-amounts');
    expect(scrollView).toBeTruthy();
  });
});
