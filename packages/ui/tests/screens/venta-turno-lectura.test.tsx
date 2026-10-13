/**
 * useVentasTurno (M-08) — the data behind Ventas del turno, read from the
 * phone's in-memory repositories: the open turno's rows with the fiado
 * client said by name, sin-turno and sin-ventas told apart, the ticket a
 * folio opens, and a cancellation refused by the use case saying its words.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import type { BusinessId, DeviceId, UserId } from '@xangarro/domain';
import {
  InMemoryCajaTurnosRepository,
  InMemoryClientsRepository,
  InMemorySalesRepository,
  InMemoryTicketsRepository,
} from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { useVentasTurno, type VentasTurnoVivo } from '../../src/screens/Ventas/use-ventas-turno';
import { renderWithProviders, waitFor } from '../test-utils';

initI18n();

vi.mock('../../src/screens/AppShell/use-shell-data', () => ({
  useShellData: () => ({
    caja: 'Caja 1',
    negocio: 'Taquería Don Pedro',
    operador: { nombre: 'Ana Robledo', iniciales: 'AR' },
    turnoDesde: '08:15',
  }),
}));

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BUS' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const YO = '01HZ8XQN9GZJXV8AKQ5X0C7ME0' as UserId;

interface Repos {
  readonly cajaTurnos: InMemoryCajaTurnosRepository;
  readonly tickets: InMemoryTicketsRepository;
  readonly sales: InMemorySalesRepository;
  readonly clients: InMemoryClientsRepository;
}

/** The route's would-be consumer, writing what the hook resolved into the DOM. */
function Sonda(p: { readonly onVisto: (v: VentasTurnoVivo) => void }): ReactElement {
  const v = useVentasTurno();
  p.onVisto(v);
  return <p data-testid="sonda">{v.state}</p>;
}

/** Renders the hook over `repos` and waits for its first resolved state. */
async function montar(repos: Repos): Promise<() => VentasTurnoVivo> {
  let actual: VentasTurnoVivo | undefined;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAppConfigStore.setState({ currentBusinessId: BIZ, userId: YO, deviceId: DEV, hydrated: true });
  renderWithProviders(
    <QueryClientProvider client={client}>
      <MockRepositoryProvider overrides={repos}>
        <Sonda onVisto={(v) => (actual = v)} />
      </MockRepositoryProvider>
    </QueryClientProvider>,
  );
  await waitFor(() => {
    if (actual === undefined || actual.state === 'loading') throw new Error('aún cargando');
  });
  return () => actual as VentasTurnoVivo;
}

/** One open turno with V-0409: a fiado ticket of two ninety-peso lines. */
async function conTurnoYVentas(): Promise<Repos> {
  const repos: Repos = {
    cajaTurnos: new InMemoryCajaTurnosRepository(DEV),
    tickets: new InMemoryTicketsRepository(DEV),
    sales: new InMemorySalesRepository(DEV),
    clients: new InMemoryClientsRepository(DEV),
  };
  const turno = await repos.cajaTurnos.create({
    userId: YO,
    fecha: '2026-10-06',
    aperturaAt: '2026-10-06T14:15:00.000Z',
    montoAperturaCentavos: 500_00n,
    efectivoAdicionalCentavos: 0n,
    businessId: BIZ,
  });
  const mari = await repos.clients.create({ nombre: 'Doña Mari de la tienda', businessId: BIZ });
  const ticket = await repos.tickets.create({
    folio: 409,
    fecha: '2026-10-06',
    hora: '14:04',
    concepto: '1 volcán · 1 consomé',
    metodo: 'Crédito',
    clienteId: mari.id,
    estadoPago: 'pendiente',
    cajaTurnoId: turno.id,
    businessId: BIZ,
  });
  for (const [concepto, monto] of [
    ['Volcán', 55_00n],
    ['Consomé', 35_00n],
  ] as const) {
    await repos.sales.create({
      ticketId: ticket.id,
      fecha: '2026-10-06',
      concepto,
      categoria: 'Producto',
      monto,
      productoId: 'p-1',
      cantidad: 1,
      businessId: BIZ,
    });
  }
  return repos;
}

describe('useVentasTurno', () => {
  afterEach(() => {
    useAppConfigStore.getState().reset();
  });

  it('reads the turno: the row with its lines summed, Crédito said as Fiado with its client', async () => {
    const leer = await montar(await conTurnoYVentas());
    const v = leer();
    expect(v.state).toBe('happy');
    expect(v.data?.operador).toBe('Ana Robledo');
    expect(v.data?.caja).toBe('Caja 1');
    expect(v.data?.desde).toMatch(/^\d{2}:\d{2}$/);
    const fila = v.data?.ventas[0];
    expect(fila?.folio).toBe('V-0409');
    expect(fila?.monto).toBe(90_00n);
    expect(fila?.metodo).toBe('Fiado');
    expect(fila?.cliente).toBe('Doña Mari de la tienda');
  });

  it('sin-turno when the operator has no open turno', async () => {
    await montar({
      cajaTurnos: new InMemoryCajaTurnosRepository(DEV),
      tickets: new InMemoryTicketsRepository(DEV),
      sales: new InMemorySalesRepository(DEV),
      clients: new InMemoryClientsRepository(DEV),
    });
    const v = await waitFor(() => {
      const estado = leerDeSonda();
      return estado;
    });
    expect(v).toBe('sin-turno');
  });

  it('sin-ventas when the turno has no tickets yet', async () => {
    await montar({
      ...(await conTurnoYVentas()),
      tickets: new InMemoryTicketsRepository(DEV),
      sales: new InMemorySalesRepository(DEV),
    });
    await waitFor(() => {
      expect(document.querySelector('[data-testid="sonda"]')?.textContent).toBe('empty');
    });
  });

  it('loads the ticket the sheet opens, with its priced lines and client', async () => {
    const leer = await montar(await conTurnoYVentas());
    const fila = leer().data?.ventas[0];
    expect(fila?.id).toBeDefined();
    if (!fila) return;
    const carga = await leer().cargarDetalle(fila.folio, fila);
    expect(carga.state).toBe('happy');
    if (carga.state !== 'happy') return;
    expect(carga.venta.folio).toBe('V-0409');
    expect(carga.venta.lineas.length).toBe(2);
    expect(carga.venta.fiado?.cliente).toBe('Doña Mari de la tienda');
    expect(carga.venta.capturo).toBe('Ana Robledo');
  });

  it('a refused cancellation resolves the use case’s own words', async () => {
    const leer = await montar(await conTurnoYVentas());
    const fila = leer().data?.ventas[0];
    if (!fila) throw new Error('sin fila');
    const error = await leer().cancelar(fila, 'Error de captura', '1234');
    expect(error).toMatch(/No se pudo cancelar: .+/);
  });
});

function leerDeSonda(): string {
  const texto = document.querySelector('[data-testid="sonda"]')?.textContent;
  if (texto === null || texto === undefined) throw new Error('la sonda no dice nada');
  return texto;
}
