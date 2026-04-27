/**
 * ClientesScreen tests (Slice 2 C25, M6-T01).
 */

import { describe, expect, it, vi } from 'vitest';
import type { BusinessId, Client, ClientId, DeviceId, IsoTimestamp } from '@cachink/domain';
import { ClientesScreen, filterClientes, type ClienteWithSaldo } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

function cliente(overrides: Partial<Client> = {}): Client {
  return {
    id: '01JPHK0000000000000000C001' as ClientId,
    nombre: 'Carla Márquez',
    telefono: '55 1234 5678',
    email: null,
    nota: null,
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

function row(c: Client, saldo: bigint): ClienteWithSaldo {
  return { cliente: c, saldoPendiente: saldo };
}

describe('filterClientes', () => {
  const items = [
    row(cliente({ id: '01JPHK0000000000000000C001' as ClientId, nombre: 'Alicia' }), 0n),
    row(
      cliente({
        id: '01JPHK0000000000000000C002' as ClientId,
        nombre: 'Bernardo',
        telefono: '55 9999 0000',
      }),
      0n,
    ),
  ];

  it('returns all rows for an empty query', () => {
    expect(filterClientes(items, '')).toHaveLength(2);
  });

  it('matches by nombre', () => {
    expect(filterClientes(items, 'ali')).toHaveLength(1);
  });

  it('matches by telefono', () => {
    expect(filterClientes(items, '55 9999')).toHaveLength(1);
  });
});

describe('ClientesScreen', () => {
  it('renders empty state when list is empty', () => {
    renderWithProviders(
      <ClientesScreen query="" onChangeQuery={vi.fn()} items={[]} onNuevoCliente={vi.fn()} />,
    );
    expect(screen.getByTestId('empty-clientes')).toBeInTheDocument();
  });

  it('renders a saldo Tag when saldoPendiente > 0', () => {
    const c = cliente();
    renderWithProviders(
      <ClientesScreen
        query=""
        onChangeQuery={vi.fn()}
        items={[row(c, 12500n)]}
        onNuevoCliente={vi.fn()}
      />,
    );
    expect(screen.getByTestId(`cliente-card-${c.id}`).textContent).toContain('$125.00');
  });

  it('fires onNuevoCliente when the header Btn is tapped', () => {
    const onNuevoCliente = vi.fn();
    renderWithProviders(
      <ClientesScreen
        query=""
        onChangeQuery={vi.fn()}
        items={[]}
        onNuevoCliente={onNuevoCliente}
      />,
    );
    const btn = screen.getAllByTestId('clientes-nuevo')[0]!;
    fireEvent.click(btn);
    expect(onNuevoCliente).toHaveBeenCalled();
  });

  // Audit Round 2 K4: per-row swipe wiring.
  it('wraps each row in `<SwipeableRow>` when swipe handlers are supplied', () => {
    const c = cliente({ id: '01JPHK0000000000000000C099' as ClientId });
    renderWithProviders(
      <ClientesScreen
        query=""
        onChangeQuery={vi.fn()}
        items={[row(c, 0n)]}
        onNuevoCliente={vi.fn()}
        onEditCliente={vi.fn()}
        onEliminarCliente={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId(`cliente-swipe-${c.id}`).length).toBeGreaterThan(0);
  });

  it('does NOT wrap rows when swipe handlers are unset', () => {
    const c = cliente({ id: '01JPHK0000000000000000C098' as ClientId });
    renderWithProviders(
      <ClientesScreen
        query=""
        onChangeQuery={vi.fn()}
        items={[row(c, 0n)]}
        onNuevoCliente={vi.fn()}
      />,
    );
    expect(screen.queryByTestId(`cliente-swipe-${c.id}`)).toBeNull();
  });
});
