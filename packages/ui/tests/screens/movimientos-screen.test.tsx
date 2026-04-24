/**
 * MovimientosScreen tests (Slice 2 C13, M5-T02).
 */

import { describe, expect, it } from 'vitest';
import type {
  BusinessId,
  DeviceId,
  InventoryMovement,
  InventoryMovementId,
  IsoDate,
  IsoTimestamp,
  Product,
  ProductId,
} from '@cachink/domain';
import { MovimientosScreen } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const businessId = '01JPHK00000000000000000008' as BusinessId;
const deviceId = '01JPHK00000000000000000007' as DeviceId;

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
    deviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

function mov(overrides: Partial<InventoryMovement> = {}): InventoryMovement {
  return {
    id: '01JPHK0000000000000000M001' as InventoryMovementId,
    productoId: '01JPHK0000000000000000R001' as ProductId,
    fecha: '2026-04-24' as IsoDate,
    tipo: 'entrada',
    cantidad: 10,
    costoUnitCentavos: 100n,
    motivo: 'Compra a proveedor',
    nota: null,
    businessId,
    deviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

describe('MovimientosScreen', () => {
  it('renders the empty state when movimientos is empty', () => {
    renderWithProviders(<MovimientosScreen movimientos={[]} productosById={new Map()} />);
    expect(screen.getByTestId('empty-movimientos')).toBeInTheDocument();
  });

  it('renders one MovimientoCard per movimiento with resolved producto name', () => {
    const p = producto();
    const m1 = mov({
      id: '01JPHK0000000000000000M001' as InventoryMovementId,
      productoId: p.id,
      tipo: 'entrada',
      cantidad: 10,
    });
    const m2 = mov({
      id: '01JPHK0000000000000000M002' as InventoryMovementId,
      productoId: p.id,
      tipo: 'salida',
      motivo: 'Venta',
      cantidad: 3,
    });
    renderWithProviders(
      <MovimientosScreen movimientos={[m1, m2]} productosById={new Map([[p.id, p]])} />,
    );
    expect(screen.getAllByText('Tortilla')).toHaveLength(2);
  });

  it('shows the producto id when the producto cannot be resolved', () => {
    const m = mov({ productoId: '01JPHK0000000000000000R999' as ProductId });
    renderWithProviders(<MovimientosScreen movimientos={[m]} productosById={new Map()} />);
    expect(screen.getByText('01JPHK0000000000000000R999')).toBeInTheDocument();
  });
});
