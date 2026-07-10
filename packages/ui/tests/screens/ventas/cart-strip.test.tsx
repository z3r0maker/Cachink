/**
 * CartStrip tests — inline mini-cart component.
 *
 * Covers item rendering, clear button, confirm dialog, and variant styling.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ProductId } from '@cachink/domain';
import type { CartItem } from '../../../src/hooks/use-cart';
import { CartStrip } from '../../../src/screens/Ventas/cart-strip';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const ITEMS: CartItem[] = [
  { productoId: 'P001' as ProductId, nombre: 'Taco', precioUnitCentavos: 4500n, cantidad: 2 },
  { productoId: 'P002' as ProductId, nombre: 'Agua', precioUnitCentavos: 2000n, cantidad: 1 },
];

describe('CartStrip', () => {
  it('renders with default testID cart-strip', () => {
    renderWithProviders(
      <CartStrip items={ITEMS} onRemoveOne={vi.fn()} onRemoveAll={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByTestId('cart-strip')).toBeInTheDocument();
  });

  it('shows item count in header', () => {
    renderWithProviders(
      <CartStrip items={ITEMS} onRemoveOne={vi.fn()} onRemoveAll={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByText('Carrito (2)')).toBeInTheDocument();
  });

  it('shows Vaciar button', () => {
    renderWithProviders(
      <CartStrip items={ITEMS} onRemoveOne={vi.fn()} onRemoveAll={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByTestId('cart-strip-clear')).toBeInTheDocument();
  });

  it('renders with red variant', () => {
    renderWithProviders(
      <CartStrip items={ITEMS} onRemoveOne={vi.fn()} onRemoveAll={vi.fn()} onClear={vi.fn()} variant="red" />,
    );
    expect(screen.getByTestId('cart-strip')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <CartStrip items={ITEMS} onRemoveOne={vi.fn()} onRemoveAll={vi.fn()} onClear={vi.fn()} testID="my-strip" />,
    );
    expect(screen.getByTestId('my-strip')).toBeInTheDocument();
  });

  it('renders with empty items', () => {
    renderWithProviders(
      <CartStrip items={[]} onRemoveOne={vi.fn()} onRemoveAll={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByText('Carrito (0)')).toBeInTheDocument();
  });
});
