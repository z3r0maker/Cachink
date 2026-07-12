/**
 * VentaCard tests — sale row in the Ventas list.
 *
 * Covers concepto display, monto formatting, metodo tag, hora, client chip.
 */

import { describe, expect, it, vi } from 'vitest';
import type { SaleId } from '@cachink/domain';
import { makeSale } from '@cachink/testing';
import { VentaCard } from '../../src/screens/Ventas/venta-card';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const SALE = makeSale({
  id: '01JPHK000000000000SALE0001' as SaleId,
  concepto: 'Taco al pastor',
  monto: 4500n,
  metodo: 'Efectivo',
  categoria: 'Producto',
  hora: '10:30',
  estadoPago: 'pagado',
});

describe('VentaCard', () => {
  it('renders with default testID based on sale id', () => {
    renderWithProviders(<VentaCard venta={SALE} />);
    expect(screen.getByTestId(`venta-card-${SALE.id}`)).toBeInTheDocument();
  });

  it('displays the concepto', () => {
    renderWithProviders(<VentaCard venta={SALE} />);
    expect(screen.getByText('Taco al pastor')).toBeInTheDocument();
  });

  it('displays the formatted monto', () => {
    renderWithProviders(<VentaCard venta={SALE} />);
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('displays the hora when present', () => {
    renderWithProviders(<VentaCard venta={SALE} />);
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it('displays the categoria tag', () => {
    renderWithProviders(<VentaCard venta={SALE} />);
    expect(screen.getByText('Producto')).toBeInTheDocument();
  });

  it('displays the metodo tag', () => {
    renderWithProviders(<VentaCard venta={SALE} />);
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
  });

  it('shows client name chip when clienteName is provided', () => {
    renderWithProviders(<VentaCard venta={SALE} clienteName="Juan Pérez" />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('does not show client name chip when clienteName is omitted', () => {
    renderWithProviders(<VentaCard venta={SALE} />);
    expect(screen.queryByText('Juan Pérez')).toBeNull();
  });

  it('fires onPress when card is tapped', () => {
    const onPress = vi.fn();
    renderWithProviders(<VentaCard venta={SALE} onPress={onPress} />);
    fireEvent.click(screen.getByTestId(`venta-card-${SALE.id}`));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders with custom testID', () => {
    renderWithProviders(<VentaCard venta={SALE} testID="my-card" />);
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
  });

  it('renders credito metodo as warning tag', () => {
    const creditoSale = makeSale({ ...SALE, metodo: 'Crédito' as any });
    renderWithProviders(<VentaCard venta={creditoSale} />);
    expect(screen.getByText('Crédito')).toBeInTheDocument();
  });
});
