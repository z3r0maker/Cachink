/**
 * ProductosGateBanner — unit tests.
 */

import { describe, expect, it, vi } from 'vitest';
import { ProductosGateBanner } from '../../src/screens/Ventas/productos-gate-banner';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('ProductosGateBanner', () => {
  it('renders with default testID productos-gate-banner', () => {
    renderWithProviders(<ProductosGateBanner onGoToProductos={vi.fn()} />);
    expect(screen.getByTestId('productos-gate-banner')).toBeInTheDocument();
  });

  it('renders title and CTA button', () => {
    renderWithProviders(<ProductosGateBanner onGoToProductos={vi.fn()} />);
    expect(screen.getByText('Registra tus productos para empezar a vender')).toBeInTheDocument();
    expect(screen.getByText('Ir a Productos')).toBeInTheDocument();
  });

  it('calls onGoToProductos when CTA button is pressed', () => {
    const onGoToProductos = vi.fn();
    renderWithProviders(<ProductosGateBanner onGoToProductos={onGoToProductos} />);
    fireEvent.click(screen.getByTestId('productos-gate-go-to-productos'));
    expect(onGoToProductos).toHaveBeenCalled();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <ProductosGateBanner onGoToProductos={vi.fn()} testID="my-gate" />,
    );
    expect(screen.getByTestId('my-gate')).toBeInTheDocument();
  });
});
