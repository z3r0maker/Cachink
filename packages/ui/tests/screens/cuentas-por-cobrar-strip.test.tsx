/**
 * CuentasPorCobrarStrip tests (P1C C16).
 */

import { describe, expect, it } from 'vitest';
import type {
  BusinessId,
  Client,
  ClientId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  Sale,
  SaleId,
} from '@cachink/domain';
import { CuentasPorCobrarStrip } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const businessId = '01JPHK00000000000000000008' as BusinessId;
const deviceId = '01JPHK00000000000000000007' as DeviceId;

function makeClient(id: string, nombre: string): Client {
  return {
    id: id as ClientId,
    nombre,
    telefono: null,
    email: null,
    nota: null,
    businessId,
    deviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
  };
}

function makeSale(id: string, clienteId: ClientId, monto: bigint): Sale {
  return {
    id: id as SaleId,
    fecha: '2026-04-24' as IsoDate,
    concepto: 'Taco',
    categoria: 'Producto',
    monto,
    metodo: 'Crédito',
    clienteId,
    estadoPago: 'pendiente',
    businessId,
    deviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
  };
}

describe('CuentasPorCobrarStrip', () => {
  it('renders an empty state when rows is empty', () => {
    renderWithProviders(<CuentasPorCobrarStrip rows={[]} />);
    expect(screen.getByText('Sin saldos pendientes.')).toBeInTheDocument();
  });

  it('renders one row per cliente with the summed total', () => {
    const cliente = makeClient('01JPHK0000000000000000C001', 'Carla Márquez');
    const ventas = [
      makeSale('01JPHK0000000000000000S001', cliente.id, 10000n),
      makeSale('01JPHK0000000000000000S002', cliente.id, 25000n),
    ];
    renderWithProviders(<CuentasPorCobrarStrip rows={[{ cliente, ventas, total: 35000n }]} />);
    expect(screen.getByTestId(`cxc-row-${cliente.id}`)).toBeInTheDocument();
    expect(screen.getByText('Carla Márquez')).toBeInTheDocument();
    expect(screen.getByText('$350.00')).toBeInTheDocument();
  });

  it('renders multiple clientes when given multiple rows', () => {
    const c1 = makeClient('01JPHK0000000000000000C001', 'Alice');
    const c2 = makeClient('01JPHK0000000000000000C002', 'Bob');
    renderWithProviders(
      <CuentasPorCobrarStrip
        rows={[
          {
            cliente: c1,
            ventas: [makeSale('01JPHK0000000000000000S001', c1.id, 5000n)],
            total: 5000n,
          },
          {
            cliente: c2,
            ventas: [makeSale('01JPHK0000000000000000S002', c2.id, 8000n)],
            total: 8000n,
          },
        ]}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
