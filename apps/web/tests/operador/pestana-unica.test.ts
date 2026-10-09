// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { createElement, type ReactNode } from 'react';

/**
 * The one-tab gate (DB3-CAJA-01, DS-08): the tab that owns the register's
 * lock renders the app; a second tab sees «La caja ya está abierta en otra
 * pestaña», may wait in the lock's queue, and learns when the other tab is
 * still there. Without locks, the BroadcastChannel look decides — a warning,
 * not a lock — and the winning tab answers newcomers.
 */

const reclamar = vi.fn();
const hayOtra = vi.fn();
const responder = vi.fn(() => () => undefined);
let device: unknown = null;

vi.mock('../../src/operador/runtime/client', () => ({
  registerRuntime: () => ({ reclamar }),
}));
vi.mock('../../src/operador/runtime/pestana', () => ({
  hayOtraPestana: () => hayOtra(),
  responderPresencia: () => responder(),
}));
vi.mock('../../src/operador/runtime/device-store', () => ({
  readDevice: () => device,
}));
vi.mock('../../src/operador/acceso/acceso.css', () => ({
  heading: 'heading',
  titulo: 'titulo',
  lead: 'lead',
  fallo: 'fallo',
}));
vi.mock('../../src/operador/acceso/marco', () => ({
  Marco: (p: { readonly children: ReactNode }) => createElement('div', null, p.children),
}));
vi.mock('../../src/operador/acceso/boton', () => ({
  Continuar: (p: {
    readonly children: ReactNode;
    readonly onClick: () => void;
    readonly testId?: string;
  }) =>
    createElement(
      'button',
      { 'data-testid': p.testId ?? 'continuar', onClick: p.onClick },
      p.children,
    ),
}));

const { PestanaUnica } = await import('../../src/operador/acceso/pestana-unica');

function montar() {
  return render(createElement(PestanaUnica, null, createElement('p', null, 'la caja misma')));
}

beforeEach(() => {
  vi.clearAllMocks();
  device = { deviceId: 'd' };
  responder.mockReturnValue(() => undefined);
});

afterEach(cleanup);

describe('PestanaUnica', () => {
  it('the tab that wins the lock renders the app, and without locks it answers newcomers', async () => {
    reclamar.mockResolvedValue('propia');
    montar();
    await waitFor(() => assert.ok(screen.getByText('la caja misma')));
    expect(responder).not.toHaveBeenCalled();

    // Without locks the winning tab answers the BroadcastChannel handshake.
    cleanup();
    reclamar.mockResolvedValue('sin-soporte');
    hayOtra.mockResolvedValue(false);
    montar();
    await waitFor(() => assert.ok(screen.getByText('la caja misma')));
    expect(responder).toHaveBeenCalled();
  });

  it('a second tab is told the register is open elsewhere, and may wait', async () => {
    reclamar.mockResolvedValue('ocupada');
    montar();
    await waitFor(() => assert.ok(screen.getByTestId('otra-pestana')));
    assert.ok(screen.getByText('La caja ya está abierta en otra pestaña.'));
    assert.ok(screen.getByRole('button', { name: /Usar esta pestaña/ }));

    reclamar.mockReturnValueOnce(new Promise(() => undefined));
    screen.getByTestId('usar-esta-pestana').click();
    await waitFor(() => assert.ok(screen.getByRole('status')));
    assert.ok(screen.getByText(/Esperando a que se cierre la otra pestaña/));
  });

  it('waiting ends by owning the register, or by learning the other tab is still there', async () => {
    reclamoOcupadaLuego('propia');
    montar();
    await waitFor(() => assert.ok(screen.getByTestId('otra-pestana')));
    screen.getByTestId('usar-esta-pestana').click();
    await waitFor(() => assert.ok(screen.getByText('la caja misma')));

    // The other way: still open.
    cleanup();
    reclamoOcupadaLuego('ocupada');
    montar();
    await waitFor(() => assert.ok(screen.getByTestId('otra-pestana')));
    screen.getByTestId('usar-esta-pestana').click();
    await waitFor(() => assert.ok(screen.getByRole('alert')));
    assert.ok(screen.getByText(/La otra pestaña sigue abierta/));
  });

  it('without locks the BroadcastChannel look decides both ways', async () => {
    reclamar.mockResolvedValue('sin-soporte');
    hayOtra.mockResolvedValue(true);
    montar();
    await waitFor(() => assert.ok(screen.getByTestId('otra-pestana')));

    // «Usar esta pestaña» takes one more look.
    hayOtra.mockResolvedValue(false);
    screen.getByTestId('usar-esta-pestana').click();
    await waitFor(() => assert.ok(screen.getByText('la caja misma')));
  });

  it('a decision that throws opens anyway — the door behind shows its own error', async () => {
    reclamar.mockRejectedValue(new Error('worker muerto'));
    montar();
    await waitFor(() => assert.ok(screen.getByText('la caja misma')));
  });

  it('deciding renders nothing yet', () => {
    reclamar.mockReturnValue(new Promise(() => undefined));
    const { container } = montar();
    assert.equal(container.textContent, '');
  });
});

function reclamoOcupadaLuego(final: 'propia' | 'ocupada'): void {
  reclamar.mockReset();
  reclamar.mockResolvedValueOnce('ocupada');
  reclamar.mockResolvedValue(final);
}
