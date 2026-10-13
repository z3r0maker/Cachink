// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

/**
 * Avisos for real (O-16, ADR-075): a linked caja starts at loading — never at
 * the fixture — reads the owner's messages with the derived screen state, marks
 * reads without waiting, and writes replies with the queue flushed online only.
 * An unlinked browser keeps the design fixture with the route's forced state.
 */

const avisos = vi.fn();
const avisosLeidos = vi.fn();
const responderAviso = vi.fn();
const desencolar = vi.fn();
const avisarCambio = vi.fn();
let credActual: { device: unknown; sesion: unknown };

vi.mock('../../src/operador/runtime/client', () => ({
  registerRuntime: () => ({ avisos, avisosLeidos, responderAviso }),
}));
vi.mock('../../src/operador/runtime/use-credenciales', () => ({
  useCredenciales: () => credActual,
}));
vi.mock('../../src/operador/shell/cola', () => ({
  desencolar: (...a: unknown[]) => desencolar(...a),
}));
vi.mock('../../src/operador/avisos/sin-leer', () => ({
  avisarCambio: (...a: unknown[]) => avisarCambio(...a),
}));
vi.mock('@xangarro/caja', () => ({
  hoyLocal: () => '2026-09-30',
}));
vi.mock('@xangarro/caja/avisos', () => ({
  DUENO_GENERICO: 'el dueño',
  avisosVivos: (a: unknown) => a,
}));
vi.mock('../../src/operador/avisos/screen', () => ({
  AvisosScreen: (p: {
    readonly state: string;
    readonly data: { avisos: readonly { texto: string }[] };
    readonly tab: string;
    readonly vivo?: {
      marcar: (ids: string[]) => void;
      responder: (id: string, t: string) => Promise<void>;
    };
  }) =>
    createElement(
      'div',
      null,
      createElement('span', { 'data-testid': 'estado' }, p.state),
      ...(p.data.avisos ?? []).map((a, i) => createElement('span', { key: i }, a.texto)),
      p.vivo
        ? createElement('button', {
            'data-testid': 'marcar',
            onClick: () => p.vivo?.marcar(['m-1']),
          })
        : null,
      p.vivo
        ? createElement('button', {
            'data-testid': 'responder',
            onClick: () => void p.vivo?.responder('m-1', 'Listo, ya lo hice'),
          })
        : null,
    ),
}));

const { AvisosViva } = await import('../../src/operador/avisos/viva');

const CRED = {
  device: { businessId: 'biz-1', deviceId: 'dev-1' },
  sesion: { userId: 'op-1' },
};
const FIXTURE = { dueno: 'Pedro', avisos: [{ texto: 'la fixture' }] } as never;

beforeEach(() => {
  vi.clearAllMocks();
  desencolar.mockResolvedValue(undefined);
  avisosLeidos.mockResolvedValue(undefined);
  responderAviso.mockResolvedValue(undefined);
  credActual = CRED;
  avisos.mockResolvedValue({ avisos: [] });
});

afterEach(cleanup);

function montar(forzado: string = 'happy') {
  render(
    createElement(AvisosViva, {
      fixture: FIXTURE,
      forzado: forzado as never,
      tab: 'dueno' as never,
    }),
  );
}

describe('AvisosViva · linked', () => {
  it('starts at loading — never at the fixture — then the read state', async () => {
    montar();
    assert.equal(screen.getByTestId('estado').textContent, 'loading');
    assert.ok(screen.queryByText('la fixture') === null, 'the fixture never shows');

    cleanup();
    avisos.mockResolvedValue({ avisos: [{ texto: 'Apaga la estufa al salir' }] });
    montar();
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'happy'));
    assert.ok(screen.getByText('Apaga la estufa al salir'));
  });

  it('no messages is the empty state; a failed read is error', async () => {
    montar();
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'empty'));

    cleanup();
    avisos.mockRejectedValue(new Error('sin OPFS'));
    montar();
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'error'));
  });

  it('marking reads does not wait, and notifies the unread count', async () => {
    avisos.mockResolvedValue({ avisos: [{ texto: 'x' }] });
    montar();
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'happy'));
    fireEvent.click(screen.getByTestId('marcar'));
    assert.deepEqual(avisosLeidos.mock.calls, [[['m-1']]]);
    await waitFor(() => assert.ok(avisarCambio.mock.calls.length >= 1));
  });

  it('replying writes through the runtime and flushes the queue online', async () => {
    avisos.mockResolvedValue({ avisos: [{ texto: 'x' }] });
    montar();
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'happy'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('responder'));
    });
    assert.deepEqual(responderAviso.mock.calls, [
      [
        {
          businessId: 'biz-1',
          deviceId: 'dev-1',
          userId: 'op-1',
          mensajeId: 'm-1',
          texto: 'Listo, ya lo hice',
        },
      ],
    ]);
    assert.equal(desencolar.mock.calls.length, 1);

    // Offline the reply still lands; the queue waits.
    cleanup();
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    avisos.mockResolvedValue({ avisos: [{ texto: 'x' }] });
    montar();
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'happy'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('responder'));
    });
    assert.equal(responderAviso.mock.calls.length, 2);
    assert.equal(desencolar.mock.calls.length, 1, 'offline: no flush');
  });
});

describe('AvisosViva · unlinked', () => {
  it('the fixture serves with the route’s forced state, no vivo actions', () => {
    credActual = { device: null, sesion: null };
    montar('empty');
    assert.equal(screen.getByTestId('estado').textContent, 'empty');
    assert.ok(screen.getByText('la fixture'));
    assert.ok(screen.queryByTestId('marcar') === null);
    assert.equal(avisos.mock.calls.length, 0);
  });
});
