/**
 * MovimientoModal tests (Slice 2 C15, M5-T04).
 */

import { describe, expect, it, vi } from 'vitest';
import type {
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  Product,
  ProductId,
} from '@cachink/domain';
import { MovimientoModal } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const businessId = '01JPHK00000000000000000008' as BusinessId;
const fecha = '2026-04-24' as IsoDate;

const producto: Product = {
  id: '01JPHK0000000000000000R001' as ProductId,
  nombre: 'Tortilla',
  sku: null,
  categoria: 'Producto Terminado',
  costoUnitCentavos: 100n,
  unidad: 'pza',
  umbralStockBajo: 3,
  businessId,
  deviceId: '01JPHK00000000000000000007' as DeviceId,
  createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  deletedAt: null,
};

describe('MovimientoModal', () => {
  it('defaults to entrada and shows costo field', () => {
    renderWithProviders(
      <MovimientoModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        producto={producto}
        businessId={businessId}
        fecha={fecha}
      />,
    );
    expect(screen.getByTestId('movimiento-cantidad')).toBeInTheDocument();
    expect(screen.getByTestId('movimiento-costo')).toBeInTheDocument();
    expect(screen.getByTestId('movimiento-motivo')).toBeInTheDocument();
  });

  it('switches to salida and hides costo field', () => {
    renderWithProviders(
      <MovimientoModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        producto={producto}
        businessId={businessId}
        fecha={fecha}
      />,
    );
    const salida = screen.getAllByTestId('movimiento-tipo-salida')[0]!;
    fireEvent.click(salida);
    expect(screen.queryByTestId('movimiento-costo')).toBeNull();
  });

  it('blocks submit when cantidad is empty', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <MovimientoModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        producto={producto}
        businessId={businessId}
        fecha={fecha}
      />,
    );
    const submit = screen.getAllByTestId('movimiento-submit')[0]!;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('honours initialTipo=salida', () => {
    renderWithProviders(
      <MovimientoModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        producto={producto}
        businessId={businessId}
        fecha={fecha}
        initialTipo="salida"
      />,
    );
    expect(screen.queryByTestId('movimiento-costo')).toBeNull();
  });
});
