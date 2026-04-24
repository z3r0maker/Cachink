/**
 * InventarioTab tests (Slice 2 C5, M4-T02 inventario, ADR-021).
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
import { InventarioTab } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const businessId = '01JPHK00000000000000000008' as BusinessId;
const fecha = '2026-04-24' as IsoDate;

function producto(overrides: Partial<Product> = {}): Product {
  return {
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
    ...overrides,
  };
}

describe('InventarioTab', () => {
  it('renders empty-state Btn when no productos exist and onCrearProducto is provided', () => {
    renderWithProviders(
      <InventarioTab
        businessId={businessId}
        fecha={fecha}
        productos={[]}
        onSubmit={vi.fn()}
        onCrearProducto={vi.fn()}
      />,
    );
    expect(screen.getByTestId('inventario-crear-producto')).toBeInTheDocument();
  });

  it('renders producto + cantidad + costo fields when productos exist', () => {
    renderWithProviders(
      <InventarioTab
        businessId={businessId}
        fecha={fecha}
        productos={[producto()]}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('inventario-producto')).toBeInTheDocument();
    expect(screen.getByTestId('inventario-cantidad')).toBeInTheDocument();
    expect(screen.getByTestId('inventario-costo')).toBeInTheDocument();
  });

  it('blocks submit when fields are empty', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <InventarioTab
        businessId={businessId}
        fecha={fecha}
        productos={[producto()]}
        onSubmit={onSubmit}
      />,
    );
    const submit = screen.getAllByTestId('inventario-submit')[0]!;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
