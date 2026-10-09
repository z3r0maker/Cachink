// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';

/**
 * The register's send queue as every screen sees it (DB3-CAJA-02/03): one
 * state, so the pill, «Registros por enviar» and Cierre never disagree.
 * Linked, the outbox flusher drives it and `desencolar`/`refrescar` reach
 * the mounted shell; not linked yet, the fixture queue — where a retry
 * succeeds after its beat. `useCola` outside the shell is an error, not a
 * guess.
 */

const flush = vi.fn(async () => undefined);
const reales = { enLinea: true, pendientes: 3, reintentando: 0 };
let device: unknown = null;

vi.mock('../../src/operador/shell/cola-flusher', () => ({
  useFlusher: (linked: boolean) => ({
    flush,
    reales: linked ? reales : undefined,
    enviando: false,
  }),
}));
vi.mock('../../src/operador/runtime/client', () => ({
  registerRuntime: () => ({
    sync: async () => undefined,
  }),
}));
vi.mock('../../src/operador/runtime/device-store', () => ({
  readDevice: () => device,
  writeDevice: vi.fn(),
}));

const { ColaProvider, desencolar, refrescar, useCola } =
  await import('../../src/operador/shell/cola');

beforeEach(() => {
  vi.clearAllMocks();
  device = null;
});

afterEach(cleanup);

describe('ColaProvider · the fixture queue (not linked yet)', () => {
  it('starts with the design file’s count, and a retry empties it after its beat', async () => {
    device = null;
    const Sonda = (): ReactNode => {
      const c = useCola();
      return createElement(
        'p',
        null,
        `${c.connection}:${c.pendientes}:${String(c.enviando)}:${c.reintentando}`,
      );
    };
    render(
      createElement(
        ColaProvider,
        { connection: 'sin-conexion', pendientes: 7 },
        createElement(Sonda),
        createElement(SondaCaptura),
      ),
    );
    await waitFor(() => assert.ok(screen.getByText(/sin-conexion:7:false:0/)));

    act(() => {
      colaMontada?.enviar();
    });
    // While sending: the file's own count, then the beat empties it.
    await waitFor(() => assert.ok(screen.getByText(/sin-conexion:7:true:0/)));
    await waitFor(() => assert.ok(screen.getByText('en-linea:0:false:0')), { timeout: 3000 });
  });
});

describe('ColaProvider · the linked queue', () => {
  it('the flusher drives the state, and desencolar/refrescar reach the mounted shell', async () => {
    device = { deviceToken: 'tok' };
    const Sonda = (): ReactNode => {
      const c = useCola();
      return createElement('p', null, `${c.connection}:${c.pendientes}`);
    };
    render(
      createElement(
        ColaProvider,
        { connection: 'sin-conexion', pendientes: 7 },
        createElement(Sonda),
        createElement(SondaCaptura),
      ),
    );
    await waitFor(() => assert.ok(screen.getByText('en-linea:3')));

    await desencolar();
    assert.deepEqual(flush.mock.calls, [['captura', false]]);
    await refrescar();
    assert.deepEqual(flush.mock.calls, [
      ['captura', false],
      ['completa', false],
    ]);

    // The linked pill’s own button is a manual full flush.
    act(() => {
      colaMontada?.enviar();
    });
    await waitFor(() => assert.deepEqual(flush.mock.lastCall, ['completa', true]));
  });

  it('offline flushers read «sin-conexion»', async () => {
    device = { deviceToken: 'tok' };
    reales.enLinea = false;
    const Sonda = (): ReactNode => {
      const c = useCola();
      return createElement('p', null, c.connection);
    };
    render(
      createElement(
        ColaProvider,
        { connection: 'sin-conexion', pendientes: 7 },
        createElement(Sonda),
        createElement(SondaCaptura),
      ),
    );
    await waitFor(() => assert.ok(screen.getByText('sin-conexion')));
    reales.enLinea = true;
  });
});

describe('desencolar and refrescar without a mounted shell', () => {
  it('desencolar is a no-op; refrescar goes straight to the runtime when a device exists', async () => {
    await desencolar();
    assert.equal(flush.mock.calls.length, 0);

    device = { deviceToken: 'tok' };
    await refrescar(); // the runtime mock resolves
    assert.equal(flush.mock.calls.length, 0);
  });

  it('refrescar without a device resolves quietly', async () => {
    device = null;
    await refrescar();
  });
});

describe('useCola outside the shell', () => {
  it('is an error, not a guess', () => {
    const Sonda = (): ReactNode => {
      useCola();
      return null;
    };
    assert.throws(() => render(createElement(Sonda)), /outside the operator shell/);
  });
});

/** The context of the mounted provider, captured by its probe child. */
let colaMontada: ReturnType<typeof useCola> | null = null;
function SondaCaptura(): null {
  colaMontada = useCola();
  return null;
}
