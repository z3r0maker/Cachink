/**
 * `useAvisos` (M-09) over in-memory repositories and a faked outbox: the
 * read the screen shows — the owner's aclaración about a corte, the reply
 * that already exists, the caja's own notices from the real queue and the
 * low stock, the owner's name — the write path (one `respuestas_operador`
 * row plus the device-local read mark), and the read that fails.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from '@tamagui/core';
import type { BusinessId, UserId } from '@xangarro/domain';
import {
  InMemoryCajaTurnosRepository,
  InMemoryMensajesOperadorRepository,
  InMemoryProductsRepository,
  InMemoryRespuestasOperadorRepository,
  makeNewProduct,
  TEST_DEVICE_ID,
} from '@xangarro/testing';
import { useAppConfigStore } from '../src/app-config/use-app-config';
import { RepositoryProvider } from '../src/app/repository-provider';
import { initI18n } from '../src/i18n/index';
import { useAvisos, type AvisosVivoUi } from '../src/screens/Avisos/use-avisos';
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
const MENSAJE = '01HZMSGOPERADORAAAAAAAAAAAA1';

let mensajes: InMemoryMensajesOperadorRepository;
let respuestas: InMemoryRespuestasOperadorRepository;
let turnos: InMemoryCajaTurnosRepository;
let products: InMemoryProductsRepository;

/** The repos the hook reads, with this test's own instances in. */
function misRepos() {
  return buildTestRepos({
    mensajesOperador: mensajes,
    respuestasOperador: respuestas,
    cajaTurnos: turnos,
    products,
  });
}

/** The hook inside its providers; waits until the read lands (a live ref). */
async function usar(repos = misRepos()): Promise<{ current: AvisosVivoUi }> {
  const q = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { result } = renderHook(() => useAvisos(), {
    wrapper: ({ children }: { readonly children: ReactNode }): ReactElement => (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <QueryClientProvider client={q}>
          <RepositoryProvider repositories={repos}>{children}</RepositoryProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    ),
  });
  await waitFor(() => expect(result.current.state).not.toBe('cargando'));
  return result as { current: AvisosVivoUi };
}

async function sembrarMensaje(): Promise<void> {
  const turno = await turnos.create({
    userId: USER,
    fecha: '2026-05-13',
    aperturaAt: '2026-05-13T08:15:00.000Z',
    montoAperturaCentavos: 500_00n,
    efectivoAdicionalCentavos: 0n,
    businessId: BIZ,
  });
  await mensajes.create({
    id: MENSAJE,
    operadorId: USER,
    cajaTurnoId: turno.id,
    severidad: 'aclaracion',
    cuerpo: 'Faltaron $60.00 al cerrar.',
    businessId: BIZ,
    deviceId: TEST_DEVICE_ID,
    createdByUserId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  });
}

beforeEach(() => {
  mensajes = new InMemoryMensajesOperadorRepository();
  respuestas = new InMemoryRespuestasOperadorRepository(TEST_DEVICE_ID);
  turnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
  products = new InMemoryProductsRepository(TEST_DEVICE_ID);
  useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER });
  cola.mockReset();
  cola.mockResolvedValue([]);
});

describe('useAvisos · la lectura', () => {
  it('says the aclaración about the corte, and the caja’s queue and stock notices', async () => {
    await sembrarMensaje();
    await products.create(
      makeNewProduct({ nombre: 'Taco de tripa', umbralStockBajo: 15, businessId: BIZ }),
    );
    cola.mockResolvedValue([{ tableName: 'tickets', rowId: 't-1', retrying: false }]);
    const v = await usar();
    expect(v.current.state).toBe('happy');
    const titulos = v.current.data?.avisos.map((a) => a.titulo) ?? [];
    expect(titulos).toContain('Aclara el corte del 13 de mayo');
    expect(titulos).toContain('1 registro sigue sin enviarse');
    expect(titulos).toContain('Se acabó Taco de tripa');
  });

  it('the owner’s name comes from the pull, «el dueño» until then', async () => {
    const repos = misRepos();
    await repos.appConfig.set('duenoNombre', 'Pedro Ramírez');
    const v = await usar(repos);
    expect(v.current.data?.dueno).toBe('Pedro');
  });

  it('an empty caja has nothing to say, and still says it happily', async () => {
    const v = await usar();
    expect(v.current.state).toBe('happy');
    expect(v.current.data?.avisos).toEqual([]);
  });
});

describe('useAvisos · la respuesta y las marcas', () => {
  it('writes one row; the reply shows where the form was', async () => {
    await sembrarMensaje();
    const v = await usar();
    await v.current.vivo.responder(MENSAJE, 'Creo que di cambio de más a un cliente.');
    const guardadas = await respuestas.findByMensaje(MENSAJE as never);
    expect(guardadas.map((r) => r.texto)).toEqual(['Creo que di cambio de más a un cliente.']);
    await waitFor(() =>
      expect(v.current.data?.avisos.find((a) => a.id === MENSAJE)?.respuesta).toBe(
        'Creo que di cambio de más a un cliente.',
      ),
    );
  });

  it('a reply that is only spaces is refused, nothing is written', async () => {
    await sembrarMensaje();
    const v = await usar();
    await expect(v.current.vivo.responder(MENSAJE, '   ')).rejects.toThrow('RESPUESTA_INVALIDA');
    expect(await respuestas.findByMensaje(MENSAJE as never)).toEqual([]);
  });

  it('marking read persists device-local, not as a row', async () => {
    await sembrarMensaje();
    const v = await usar();
    v.current.vivo.marcar([MENSAJE]);
    await waitFor(() =>
      expect(v.current.data?.avisos.find((a) => a.id === MENSAJE)?.leido).toBe(true),
    );
  });
});

describe('useAvisos · la lectura fallida', () => {
  it('a repository that throws says error, never a guess', async () => {
    const romper = mensajes as unknown as { findByOperador: () => Promise<never> };
    romper.findByOperador = () => Promise.reject(new Error('db'));
    const v = await usar();
    expect(v.current.state).toBe('error');
    expect(v.current.data).toBeNull();
  });
});
