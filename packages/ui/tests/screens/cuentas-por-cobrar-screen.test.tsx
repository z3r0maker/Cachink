/**
 * CuentasPorCobrarScreen + KPI tests (Slice 2 C30, M6-T03).
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
import {
  CuentasPorCobrarScreen,
  daysBetween,
  diasPromedioCobranza,
  type CuentaPorCobrarRow,
} from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const businessId = '01JPHK00000000000000000008' as BusinessId;
const deviceId = '01JPHK00000000000000000007' as DeviceId;

function cliente(id: string, nombre: string): Client {
  return {
    id: id as ClientId,
    nombre,
    telefono: null,
    email: null,
    nota: null,
    businessId,
    deviceId,
    createdAt: '2026-04-01T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-01T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
  };
}

function sale(id: string, clienteId: ClientId, fecha: string, monto: bigint): Sale {
  return {
    id: id as SaleId,
    fecha: fecha as IsoDate,
    concepto: 'Crédito',
    categoria: 'Producto',
    monto,
    metodo: 'Crédito',
    clienteId,
    estadoPago: 'pendiente',
    businessId,
    deviceId,
    createdAt: `${fecha}T00:00:00Z` as IsoTimestamp,
    updatedAt: `${fecha}T00:00:00Z` as IsoTimestamp,
    deletedAt: null,
  };
}

describe('daysBetween', () => {
  it('returns 0 when dates are equal', () => {
    expect(daysBetween('2026-04-24', '2026-04-24')).toBe(0);
  });

  it('returns a positive count for chronological order', () => {
    expect(daysBetween('2026-04-01', '2026-04-24')).toBe(23);
  });

  it('never returns negative', () => {
    expect(daysBetween('2026-04-24', '2026-04-01')).toBe(0);
  });
});

describe('diasPromedioCobranza', () => {
  it('returns 0 for empty pending sales', () => {
    expect(diasPromedioCobranza([], '2026-04-24')).toBe(0);
  });

  it('computes the average age of pending sales', () => {
    const c1 = cliente('01JPHK0000000000000000C001', 'A');
    const sales = [
      sale('01JPHK0000000000000000S001', c1.id, '2026-04-10', 10000n),
      sale('01JPHK0000000000000000S002', c1.id, '2026-04-20', 20000n),
    ];
    // ages: 14 + 4 = 18 / 2 = 9
    expect(diasPromedioCobranza(sales, '2026-04-24')).toBe(9);
  });
});

describe('CuentasPorCobrarScreen', () => {
  it('renders the KPI card and the strip', () => {
    const c1 = cliente('01JPHK0000000000000000C001', 'Alice');
    const s1 = sale('01JPHK0000000000000000S001', c1.id, '2026-04-10', 10000n);
    const rows: CuentaPorCobrarRow[] = [{ cliente: c1, ventas: [s1], total: 10000n }];
    renderWithProviders(<CuentasPorCobrarScreen rows={rows} today={'2026-04-24' as IsoDate} />);
    expect(screen.getByTestId('cxc-avg-days')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
