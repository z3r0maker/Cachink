/**
 * NuevoProductoScreen tests — Phase 18.
 *
 * Verifies:
 *   - Renders all expected fields.
 *   - usoProducto field shown only when conversionEnabled=true.
 *   - Submit button is present.
 */

import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '../test-utils';
import { initI18n } from '../../src/i18n/index';
import { NuevoProductoScreen } from '../../src/screens/Productos/nuevo-producto-screen';

initI18n();

describe('NuevoProductoScreen', () => {
  const noop = vi.fn();

  it('renders core fields', () => {
    renderWithProviders(
      <NuevoProductoScreen onSubmit={noop} onBack={noop} />,
    );
    expect(screen.getByTestId('producto-nombre')).toBeTruthy();
    expect(screen.getByTestId('producto-sku')).toBeTruthy();
    expect(screen.getByTestId('producto-categoria')).toBeTruthy();
    expect(screen.getByTestId('producto-costo')).toBeTruthy();
    expect(screen.getByTestId('producto-precio-venta')).toBeTruthy();
    expect(screen.getByTestId('producto-submit')).toBeTruthy();
  });

  it('hides usoProducto field when conversionEnabled is false', () => {
    renderWithProviders(
      <NuevoProductoScreen onSubmit={noop} onBack={noop} conversionEnabled={false} />,
    );
    expect(screen.queryByTestId('producto-uso')).toBeNull();
  });

  it('shows usoProducto field when conversionEnabled is true', () => {
    renderWithProviders(
      <NuevoProductoScreen onSubmit={noop} onBack={noop} conversionEnabled={true} />,
    );
    expect(screen.getByTestId('producto-uso')).toBeTruthy();
  });

  it('shows precio de venta by default (uso = venta)', () => {
    renderWithProviders(
      <NuevoProductoScreen onSubmit={noop} onBack={noop} />,
    );
    // Default usoProducto is 'venta', so precio should be visible.
    expect(screen.getByTestId('producto-precio-venta')).toBeTruthy();
  });
});
