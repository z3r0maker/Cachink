/**
 * `leerTurnoVivo`, `useMiTurno` and `useCierreTurno` (Track M, M-09) over
 * the in-memory repositories: the device's rows — the open turno, its
 * Efectivo and fiado tickets with their lines, the gasto, the abono, the
 * turno's inventory movements — said as the web's live read, and the close
 * write through `CerrarCajaUseCase`, with its failures surfaced as the
 * message the screen says.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from '@tamagui/core';
import { hoyLocal } from '@xangarro/caja';
import type { BusinessId, IsoDate, ProductId, UserId } from '@xangarro/domain';
import {
  InMemoryCajaTurnosRepository,
  InMemoryClientPaymentsRepository,
  InMemoryClientsRepository,
  InMemoryExpensesRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryRecurringExpensesRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  TEST_DEVICE_ID,
  makeNewClient,
  makeNewExpense,
  makeNewInventoryMovement,
  makeNewRecurringExpense,
  makeNewSale,
  makeNewTicket,
} from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { useAppConfigStore } from '../src/app-config/use-app-config';
import { initI18n } from '../src/i18n/index';
import { leerTurnoVivo } from '../src/screens/Turno/mi-turno-lectura';
import { useMiTurno } from '../src/screens/Turno/use-mi-turno';
import { useCierreTurno } from '../src/screens/Turno/use-cierre-turno';
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
const PRODUCTO = '01HZ8XQN9GZJXV8AKQ5X0C7PRD' as ProductId;
/** $500 fondo + $160 venta + $100 abono − $62 gasto = $698 esperado. */
const ESPERADO = 698_00n;

let cajaTurnos: InMemoryCajaTurnosRepository;
let tickets: InMemoryTicketsRepository;
let sales: InMemorySalesRepository;
let expenses: InMemoryExpensesRepository;
let payments: InMemoryClientPaymentsRepository;
let clients: InMemoryClientsRepository;
let inventory: InMemoryInventoryMovementsRepository;
let recurring: InMemoryRecurringExpensesRepository;
let turnoId: string;

/** An open turno, one Efectivo venta, one fiado, a gasto, an abono, a merma-less entrada. */
async function sembrar(): Promise<void> {
  const turno = await cajaTurnos.create({
    userId: USER,
    fecha: HOY,
    aperturaAt: `${HOY}T00:05:00.000Z`,
    montoAperturaCentavos: 500_00n,
    efectivoAdicionalCentavos: 0n,
    businessId: BIZ,
  });
  turnoId = turno.id;
  const efectivo = await tickets.create(
    makeNewTicket({
      folio: 412,
      fecha: HOY,
      hora: '14:52',
      concepto: '3 pastor · 1 gringa',
      metodo: 'Efectivo',
      estadoPago: 'pagado',
      cajaTurnoId: turno.id,
      businessId: BIZ,
    }),
  );
  await sales.create(
    makeNewSale({ ticketId: efectivo.id, fecha: HOY, monto: 160_00n, businessId: BIZ }),
  );
  const cliente = await clients.create(makeNewClient({ nombre: 'Doña Mari', businessId: BIZ }));
  const fiado = await tickets.create(
    makeNewTicket({
      folio: 411,
      fecha: HOY,
      hora: '14:04',
      concepto: '1 volcán · 1 consomé',
      metodo: 'Crédito',
      clienteId: cliente.id,
      estadoPago: 'pendiente',
      cajaTurnoId: turno.id,
      businessId: BIZ,
    }),
  );
  await sales.create(
    makeNewSale({ ticketId: fiado.id, fecha: HOY, monto: 90_00n, businessId: BIZ }),
  );
  await payments.create({
    clienteId: cliente.id,
    fecha: HOY,
    montoCentavos: 100_00n,
    metodo: 'Efectivo',
    nota: null,
    businessId: BIZ,
  });
  await expenses.create(
    makeNewExpense({
      fecha: HOY,
      concepto: 'Gas',
      categoria: 'Materia Prima',
      monto: 62_00n,
      proveedor: 'Gas Express',
      cajaTurnoId: turno.id,
      businessId: BIZ,
    }),
  );
  await inventory.create(
    makeNewInventoryMovement({
      productoId: PRODUCTO,
      fecha: HOY,
      tipo: 'entrada',
      motivo: 'Compra a proveedor',
      cantidad: 3,
      businessId: BIZ,
    }),
  );
  await recurring.create(
    makeNewRecurringExpense({
      concepto: 'Gas del local',
      categoria: 'Materia Prima',
      montoCentavos: 350_00n,
      frecuencia: 'semanal',
      diaDeLaSemana: 5,
      proximoDisparo: HOY,
      businessId: BIZ,
    }),
  );
}

beforeEach(async () => {
  cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
  tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
  sales = new InMemorySalesRepository(TEST_DEVICE_ID);
  expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
  payments = new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
  clients = new InMemoryClientsRepository(TEST_DEVICE_ID);
  inventory = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
  recurring = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
  await sembrar();
  useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER, hydrated: true });
});

const repos = () => ({
  cajaTurnos,
  tickets,
  sales,
  expenses,
  clientPayments: payments,
  clients,
  inventoryMovements: inventory,
  recurringExpenses: recurring,
});

describe('leerTurnoVivo', () => {
  it('says the rows as the web live read: figures, detail, recurrentes', async () => {
    const leido = await leerTurnoVivo(repos(), BIZ, USER, TEST_DEVICE_ID);
    expect(leido).not.toBeNull();
    if (leido === null) return;
    const v = leido.vivo;
    expect(leido.turnoId).toBe(turnoId);
    expect(v.cierre.fondoCentavos).toBe('50000');
    expect(v.cierre.ventasEfectivoCentavos).toBe('16000');
    expect(v.cierre.abonosEfectivoCentavos).toBe('10000');
    expect(v.cierre.gastosEfectivoCentavos).toBe('6200');
    expect(v.cierre.esperadoCentavos).toBe(ESPERADO.toString());
    expect(v.cierre.resumen.ventas).toBe(2);
    expect(v.cierre.resumen.fiadoCentavos).toBe('9000');
    expect(v.cierre.resumen.entradas).toBe(1);
    expect(v.porMetodo.Efectivo).toBe('16000');
    expect(v.porMetodo.Fiado).toBe('9000');
    expect(v.fiadoClientes).toEqual(['Doña Mari']);
    const titulos = v.movimientos.map((m) => m.titulo);
    expect(titulos).toHaveLength(4);
    expect(titulos).toEqual(
      expect.arrayContaining(['Venta V-0412', 'Gasto · Gas', 'Venta V-0411']),
    );
    expect(v.recurrentes[0]?.concepto).toBe('Gas del local');
  });

  it('returns null with no open turno: the screens say sin-turno', async () => {
    const cerrado = await cajaTurnos.update(turnoId as never, {
      cierreAt: `${HOY}T20:00:00.000Z`,
    });
    expect(cerrado.cierreAt).not.toBeNull();
    expect(await leerTurnoVivo(repos(), BIZ, USER, TEST_DEVICE_ID)).toBeNull();
  });
});

function montar<T>(hook: () => T): { readonly result: { readonly current: T } } {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={repos()}>{children}</MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
  return renderHook(hook, { wrapper });
}

describe('useMiTurno', () => {
  it('reads the open turno as the tab data, with the session names', async () => {
    const { result } = montar(() => useMiTurno());
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const data = result.current.data;
    expect(data?.operador).toBe('Ana Robledo');
    expect(data?.caja).toBe('Caja 1');
    expect(data?.esperado).toBe(ESPERADO);
    expect(data?.pendientes[0]?.nombre).toBe('Gas del local');
  });

  it('with no open turno, the tab says sin-turno', async () => {
    await cajaTurnos.update(turnoId as never, { cierreAt: `${HOY}T20:00:00.000Z` });
    const { result } = montar(() => useMiTurno());
    await waitFor(() => expect(result.current.state).toBe('sin-turno'));
    expect(result.current.data).toBeNull();
  });
});

describe('useCierreTurno · the close write', () => {
  /** $698 in bills and coins, exactly the esperado. */
  const CUADRA = {
    'billete-500': 1,
    'billete-100': 1,
    'billete-50': 1,
    'billete-20': 2,
    'moneda-5': 1,
    'moneda-2': 1,
    'moneda-1': 1,
  } as const;

  it('happy: closes through the use case with the count and its denominaciones', async () => {
    const { result } = montar(() => useCierreTurno());
    await waitFor(() => expect(result.current.state).toBe('happy'));
    expect(result.current.data?.partes.fondo).toBe(500_00n);
    expect(result.current.data?.dueno).toBe('el dueño');
    expect(result.current.data?.hasta).toMatch(/^\d{2}:\d{2}$/);
    const error = await result.current.cerrar({
      montoCierreCentavos: ESPERADO,
      discrepancyReason: null,
      explicacion: null,
      denominaciones: CUADRA,
    });
    expect(error).toBeNull();
    const cerrado = await cajaTurnos.findById(turnoId as never);
    expect(cerrado?.cierreAt).not.toBeNull();
    expect(cerrado?.montoCierreCentavos).toBe(ESPERADO);
    expect(cerrado?.diferenciaCentavos).toBe(0n);
    expect(cerrado?.denominaciones).toEqual({ ...CUADRA });
  });

  it('a faltante with its reason lands both on the row', async () => {
    const { result } = montar(() => useCierreTurno());
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const error = await result.current.cerrar({
      montoCierreCentavos: 650_00n,
      discrepancyReason: 'error-en-cambio',
      explicacion: 'Se me fue el cambio',
      denominaciones: { 'billete-500': 1, 'billete-100': 1, 'billete-50': 1 },
    });
    expect(error).toBeNull();
    const cerrado = await cajaTurnos.findById(turnoId as never);
    expect(cerrado?.diferenciaCentavos).toBe(-48_00n);
    expect(cerrado?.discrepancyReason).toBe('error-en-cambio');
    expect(cerrado?.explicacion).toBe('Se me fue el cambio');
  });

  it('a difference without a reason is refused by the use case, said on the screen', async () => {
    const { result } = montar(() => useCierreTurno());
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const error = await result.current.cerrar({
      montoCierreCentavos: 600_00n,
      discrepancyReason: null,
      explicacion: null,
      denominaciones: { 'billete-500': 1, 'billete-100': 1 },
    });
    expect(error).toMatch(/^No se pudo cerrar el turno:/);
    const abierto = await cajaTurnos.findById(turnoId as never);
    expect(abierto?.cierreAt).toBeNull();
  });

  it('with no open turno there is nothing to close', async () => {
    await cajaTurnos.update(turnoId as never, { cierreAt: `${HOY}T20:00:00.000Z` });
    const { result } = montar(() => useCierreTurno());
    await waitFor(() => expect(result.current.state).toBe('sin-turno'));
    const error = await result.current.cerrar({
      montoCierreCentavos: 0n,
      discrepancyReason: null,
      explicacion: null,
      denominaciones: {},
    });
    expect(error).toBe('No hay un turno abierto en esta caja.');
  });
});
