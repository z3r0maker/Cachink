/**
 * `usePorEnviar` (M-09) over in-memory repositories and a faked outbox: the
 * queue as the operator captured it (a ticket with its lines is one venta),
 * the phase from the bridge the pill reads (todo enviado, espera), the
 * owner's name for «el portal de Pedro», and the read that fails.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from '@tamagui/core';
import type { BusinessId, UserId } from '@xangarro/domain';
import {
  InMemorySalesRepository,
  InMemoryTicketsRepository,
  makeNewSale,
  makeNewTicket,
  TEST_DEVICE_ID,
} from '@xangarro/testing';
import { useAppConfigStore } from '../src/app-config/use-app-config';
import { RepositoryProvider } from '../src/app/repository-provider';
import { initI18n } from '../src/i18n/index';
import { usePorEnviar, type PorEnviarVivo } from '../src/screens/Pendientes/use-por-enviar';
import { tamaguiConfig } from '../src/tamagui.config';
import { buildTestRepos } from './build-test-repos';

initI18n();

interface Entrada {
  readonly tableName: string;
  readonly rowId: string;
  readonly retrying: boolean;
}

/** The outbox as the test wants it (`unsentRows` is the device's own read). */
const cola = vi.fn(async (): Promise<readonly Entrada[]> => []);

vi.mock('@xangarro/sync', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  unsentRows: () => cola(),
}));

vi.mock('../src/database/index', () => ({ useDatabase: () => ({}) }));

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7ME0' as UserId;

let tickets: InMemoryTicketsRepository;
let sales: InMemorySalesRepository;

function misRepos() {
  return buildTestRepos({ tickets, sales });
}

/** The hook inside its providers; waits until the read lands (a live ref). */
async function usar(repos = misRepos()): Promise<{ current: PorEnviarVivo }> {
  const q = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { result } = renderHook(() => usePorEnviar(), {
    wrapper: ({ children }: { readonly children: ReactNode }): ReactElement => (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <QueryClientProvider client={q}>
          <RepositoryProvider repositories={repos}>{children}</RepositoryProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    ),
  });
  await waitFor(() => expect(result.current.state).not.toBe('cargando'));
  return result as { current: PorEnviarVivo };
}

beforeEach(() => {
  tickets = new InMemoryTicketsRepository(TEST_DEVICE_ID);
  sales = new InMemorySalesRepository(TEST_DEVICE_ID);
  useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER });
  cola.mockReset();
  cola.mockResolvedValue([]);
});

describe('usePorEnviar · la cola', () => {
  it('a ticket with its lines is one venta, with its total and its time', async () => {
    const t = await tickets.create(
      makeNewTicket({ businessId: BIZ, folio: 412, hora: '14:52', metodo: 'Efectivo' }),
    );
    await sales.create(
      makeNewSale({
        businessId: BIZ,
        ticketId: t.id,
        concepto: 'pastor',
        cantidad: 3,
        monto: 100_00n,
      }),
    );
    await sales.create(
      makeNewSale({
        businessId: BIZ,
        ticketId: t.id,
        concepto: 'gringa',
        cantidad: 1,
        monto: 60_00n,
      }),
    );
    cola.mockResolvedValue([
      { tableName: 'tickets', rowId: t.id, retrying: false },
      { tableName: 'sales', rowId: 's-1', retrying: false },
    ]);
    const v = await usar();
    expect(v.current.state).toBe('happy');
    expect(v.current.fase).toBe('espera');
    expect(v.current.cola).toHaveLength(1);
    expect(v.current.cola[0]).toMatchObject({
      titulo: 'Venta V-0412',
      detalle: '3 pastor · 1 gringa · efectivo',
      monto: 160_00n,
      hora: '14:52',
    });
  });

  it('an empty queue at rest says todo enviado, and names the portal by its owner', async () => {
    const repos = misRepos();
    await repos.appConfig.set('duenoNombre', 'Pedro Ramírez');
    const v = await usar(repos);
    expect(v.current.fase).toBe('enviado');
    expect(v.current.cola).toEqual([]);
    expect(v.current.rechazados).toEqual([]);
    expect(v.current.dueno).toBe('Pedro');
    expect(v.current.ultima).toBeNull();
  });

  it('a read that fails says error, never a guess', async () => {
    const romper = tickets as unknown as { findById: () => Promise<never> };
    romper.findById = () => Promise.reject(new Error('db'));
    cola.mockResolvedValue([{ tableName: 'tickets', rowId: 't-x', retrying: false }]);
    const v = await usar();
    expect(v.current.state).toBe('error');
    expect(v.current.cola).toEqual([]);
  });
});
