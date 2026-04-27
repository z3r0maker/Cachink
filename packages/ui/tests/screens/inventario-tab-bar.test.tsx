/**
 * InventarioTabBar tests (Round 3 F4 coverage restore).
 *
 * The tab bar drives the Stock / Movimientos toggle inside the
 * /inventario route. Pre-Round 3 it was uncovered (7.54% functions).
 */

import { describe, expect, it, vi } from 'vitest';
import { InventarioTabBar } from '../../src/screens/Inventario/inventario-tab-bar';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('InventarioTabBar', () => {
  it('renders both Stock and Movimientos tabs', () => {
    renderWithProviders(<InventarioTabBar active="stock" onChange={vi.fn()} />);
    expect(screen.getByTestId('inventario-tab-stock')).toBeInTheDocument();
    expect(screen.getByTestId('inventario-tab-movimientos')).toBeInTheDocument();
  });

  it('uses the wrapper testID when provided', () => {
    renderWithProviders(
      <InventarioTabBar active="stock" onChange={vi.fn()} testID="custom-tab-bar" />,
    );
    expect(screen.getByTestId('custom-tab-bar')).toBeInTheDocument();
  });

  it('falls back to the default wrapper testID when omitted', () => {
    renderWithProviders(<InventarioTabBar active="stock" onChange={vi.fn()} />);
    expect(screen.getByTestId('inventario-tab-bar')).toBeInTheDocument();
  });

  it('fires onChange("movimientos") when the Movimientos tab is tapped', () => {
    const onChange = vi.fn();
    renderWithProviders(<InventarioTabBar active="stock" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('inventario-tab-movimientos'));
    expect(onChange).toHaveBeenCalledWith('movimientos');
  });

  it('fires onChange("stock") when the Stock tab is tapped from movimientos', () => {
    const onChange = vi.fn();
    renderWithProviders(<InventarioTabBar active="movimientos" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('inventario-tab-stock'));
    expect(onChange).toHaveBeenCalledWith('stock');
  });

  // Behavioural contract change (audit M-1 PR 5.5): the bar now uses
  // `<SegmentedToggle>` which suppresses taps on the already-active
  // chip — the previous inline `<TabButton>` re-fired onChange on
  // every tap. The new contract is cleaner: parents don't have to
  // `if (next === current) return` to be idempotent. The active chip
  // also stays disabled (`aria-disabled="true"`) so screen readers
  // announce the state change correctly.
  it('does NOT fire onChange when the already-active tab is tapped', () => {
    const onChange = vi.fn();
    renderWithProviders(<InventarioTabBar active="stock" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('inventario-tab-stock'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
