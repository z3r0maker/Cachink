/**
 * `leerCuentas` and `useCobranza` (M-08) over the in-memory repositories: the
 * device's rows — the client, their fiado ticket with its line total, the
 * abono — said as the account the screens read, and the abono write through
 * the real use case, with the error surfaced as the message the toast says.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from '@tamagui/core';
import { hoyLocal } from '@xangarro/caja';
import type { BusinessId, ClientId, IsoDate, UserId } from '@xangarro/domain';
import {
  InMemoryClientPaymentsRepository,
  InMemoryClientsRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
  makeNewClient,
  makeNewSale,
  makeNewTicket,
  makeUser,
} from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { useAppConfigStore } from '../src/app-config/use-app-config';
import { initI18n } from '../src/i18n/index';
import { leerCuentas } from '../src/screens/Cobranza/cobranza-lectura';
import { useCobranza } from '../src/screens/Cobranza/use-cobranza';
import { tamaguiConfig } from '../src/tamagui.config';

initI18n();

vi.mock('../src/screens/AppShell/use-shell-data', () => ({
  useShellData: () => ({
    caja: 'Caja 1',
    negocio: 'Taquería Don Pedro',
    operador: { nombre: 'Ana Robledo', iniciales: 'AR' },
    turnoDesde: '08:15',
  }),
}));

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7ME0' as UserId;
const HOY = hoyLocal() as IsoDate;

let clients: InMemoryClientsRepository;
let tickets: InMemoryTicketsRepository;
let sales: InMemorySalesRepository;
let payments: InMemoryClientPaymentsRepository;
let users: InMemoryUsersRepository;
let clienteId: ClientId;

beforeEach(async () => {
  clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
  tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
  sales = new InMemorySalesRepository(TEST_DEVICE_ID);
  payments = new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
  users = new InMemoryUsersRepository(TEST_DEVICE_ID);
  await users.create(makeUser({ id: USER, nombre: 'Ana Robledo', businessId: BIZ }));
  const cliente = await clients.create(
    makeNewClient({
      nombre: 'Taller de Chuy',
      telefono: '5533 981 204',
      limiteCentavos: 1500_00n,
      plazoDias: 15,
      businessId: BIZ,
    }),
  );
  clienteId = cliente.id;
  const ticket = await tickets.create(
    makeNewTicket({
      folio: 288,
      fecha: HOY,
      hora: '13:52',
      concepto: 'Comida para 6',
      metodo: 'Crédito',
      clienteId: cliente.id,
      estadoPago: 'pendiente',
      businessId: BIZ,
    }),
  );
  await sales.create(
    makeNewSale({ ticketId: ticket.id, fecha: HOY, monto: 460_00n, businessId: BIZ }),
  );
  await payments.create({
    clienteId: cliente.id,
    fecha: HOY,
    montoCentavos: 100_00n,
    metodo: 'Efectivo',
    nota: 'Efectivo parcial',
    businessId: BIZ,
  });
  useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER, hydrated: true });
});

const repos = () => ({ clients, tickets, sales, clientPayments: payments, users });

describe('leerCuentas', () => {
  it('says the device rows as the account the screens read', async () => {
    const cuentas = await leerCuentas(repos(), BIZ, HOY, 'Caja 1');
    expect(cuentas.map((c) => c.nombre)).toEqual(['Taller de Chuy']);
    const c = cuentas[0]!;
    expect(c.telefono).toBe('5533 981 204');
    expect(c.limite).toBe(1500_00n);
    expect(c.plazo).toBe('15 días');
    expect(c.ventas[0]?.folio).toBe('V-0288');
    expect(c.ventas[0]?.capturo).toBe('Caja 1');
    expect(c.ventas[0]?.dia).toBe('hoy');
    expect(c.abonos[0]?.nota).toBe('Efectivo parcial');
    expect(c.abonos[0]?.metodo).toBe('Efectivo');
    expect(c.atrasado).toBe(false);
  });
});

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={repos()}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
  return renderHook(() => useCobranza(), { wrapper });
}

describe('useCobranza', () => {
  it('reads the accounts, then records an abono through the use case', async () => {
    const { result } = montar();
    expect(result.current.state).toBe('cargando');
    await waitFor(() => expect(result.current.state).toBe('happy'));
    expect(result.current.data?.negocio).toBe('Taquería Don Pedro');
    expect(result.current.data?.dueno).toBe('el dueño');
    expect(result.current.data?.cuentas[0]?.ventas[0]?.monto).toBe(460_00n);

    const error = await result.current.registrar({
      clienteId,
      metodo: 'Transferencia',
      monto: 200_00n,
    });
    expect(error).toBeNull();
    await waitFor(() =>
      expect(result.current.data?.cuentas[0]?.abonos.map((a) => a.metodo)).toContain(
        'Transferencia',
      ),
    );
  });

  it('a rejected write comes back as the message the toast says', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const error = await result.current.registrar({
      clienteId,
      metodo: 'Efectivo',
      monto: 0n,
    });
    expect(error).toMatch(/^No se pudo registrar el abono:/);
  });
});
