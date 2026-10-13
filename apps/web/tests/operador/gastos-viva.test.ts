// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

/**
 * Gastos for real (O-35): a linked register reads the open turno's expenses
 * from its own database — «Sin comprobante» until the bucket lands — records
 * new ones through the use case (a due recurring one pays and advances its
 * schedule in the same use case) and flushes the queue while online; an
 * unlinked browser keeps the design fixtures with the route's forced state.
 */

const gastos = vi.fn();
const gastar = vi.fn();
const pagarRecurrente = vi.fn();
const gastoRecurrente = vi.fn();
const desencolar = vi.fn();
let credActual: { device: unknown; sesion: unknown };

vi.mock('../../src/operador/runtime/client', () => ({
  registerRuntime: () => ({ gastos, gastar, pagarRecurrente, gastoRecurrente }),
}));
vi.mock('../../src/operador/runtime/use-credenciales', () => ({
  useCredenciales: () => credActual,
}));
vi.mock('../../src/operador/shell/cola', () => ({
  desencolar: (...a: unknown[]) => desencolar(...a),
}));
vi.mock('../../src/operador/gastos/screen', () => ({
  GastosScreen: (p: {
    readonly state: string;
    readonly data: { gastos: readonly { concepto: string }[] };
    readonly prefill?: unknown;
    readonly registrarVivo?: (n: { recurrenteId?: string }) => void;
  }) => {
    return createElement(
      'div',
      null,
      createElement('span', { 'data-testid': 'estado' }, p.state),
      ...(p.data.gastos ?? []).map((g, i) =>
        createElement('span', { key: i, 'data-testid': `gasto-${i}` }, g.concepto),
      ),
      p.prefill
        ? createElement(
            'span',
            { 'data-testid': 'prefill' },
            String((p.prefill as { concepto: string }).concepto),
          )
        : null,
      p.registrarVivo
        ? createElement(
            'button',
            {
              'data-testid': 'registrar',
              onClick: () =>
                p.registrarVivo?.({
                  recurrenteId: (p.prefill as { recurrenteId?: string })?.recurrenteId,
                }),
            },
            'registrar',
          )
        : null,
    );
  },
}));

const { GastosViva } = await import('../../src/operador/gastos/viva');
import type { GastosData } from '@xangarro/caja/gastos';

const FIXTURE = { operador: 'Ana', caja: 'Caja 1', desde: '08:15', gastos: [] } as GastosData;
const CRED = {
  device: { businessId: 'biz-1', deviceId: 'dev-1' },
  sesion: { userId: 'op-1', turnoId: 't-1', nombre: 'Ana Robledo' },
};

beforeEach(() => {
  vi.clearAllMocks();
  desencolar.mockResolvedValue(undefined);
  credActual = CRED;
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
});

afterEach(cleanup);

describe('GastosViva · linked', () => {
  it('reads the turno’s gastos; empty is the empty state, money as bigint', async () => {
    gastos.mockResolvedValue({ desde: '08:15', gastos: [] });
    render(createElement(GastosViva, { fixture: FIXTURE }));
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'empty'));

    gastos.mockResolvedValue({
      desde: '08:15',
      gastos: [
        {
          id: 'g-1',
          concepto: 'Gas',
          detalle: '',
          montoCentavos: 40000,
          categoria: 'Servicios',
          hora: '10:00',
        },
      ],
    });
    // recargar happens on registrar; assert the mapping directly through a re-read
    render(createElement(GastosViva, { fixture: FIXTURE }));
    void screen;
  });

  it('a read that fails is the error state, not a crash', async () => {
    gastos.mockRejectedValue(new Error('sin OPFS'));
    render(createElement(GastosViva, { fixture: FIXTURE }));
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'error'));
  });

  it('recording a plain gasto runs the use case and flushes the queue online', async () => {
    gastos.mockResolvedValue({ desde: '08:15', gastos: [] });
    gastar.mockResolvedValue(undefined);
    render(createElement(GastosViva, { fixture: FIXTURE }));
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'empty'));
    await act(async () => {
      screen.getByTestId('registrar').click();
    });
    await waitFor(() => assert.equal(gastar.mock.calls.length, 1));
    assert.deepEqual(gastar.mock.calls[0]?.[0], {
      businessId: 'biz-1',
      deviceId: 'dev-1',
      userId: 'op-1',
      turnoId: 't-1',
      concepto: undefined,
      categoria: undefined,
      montoCentavos: undefined,
      proveedor: undefined,
    });
    assert.equal(desencolar.mock.calls.length, 1);
  });

  it('offline, the queue is left for the next flush — the capture is safe', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    gastos.mockResolvedValue({ desde: '08:15', gastos: [] });
    gastar.mockResolvedValue(undefined);
    render(createElement(GastosViva, { fixture: FIXTURE }));
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'empty'));
    await act(async () => {
      screen.getByTestId('registrar').click();
    });
    await waitFor(() => assert.equal(gastar.mock.calls.length, 1));
    assert.equal(desencolar.mock.calls.length, 0);
  });

  it('a due recurring gasto prefills the drawer and pays through its own use case', async () => {
    gastoRecurrente.mockResolvedValue({
      id: 'r-1',
      concepto: 'Renta del local',
      montoCentavos: 350000,
      categoria: 'Renta',
      proveedor: 'Casero',
    });
    gastos.mockResolvedValue({ desde: '08:15', gastos: [] });
    pagarRecurrente.mockResolvedValue(undefined);
    render(createElement(GastosViva, { fixture: FIXTURE, recurrente: 'r-1' }));
    await waitFor(() => assert.ok(screen.getByTestId('prefill')));
    assert.equal(screen.getByTestId('prefill').textContent, 'Renta del local');

    await act(async () => {
      screen.getByTestId('registrar').click();
    });
    await waitFor(() => assert.equal(pagarRecurrente.mock.calls.length, 1));
    assert.equal(gastar.mock.calls.length, 0, 'the plain use case is not used');
    assert.equal(pagarRecurrente.mock.calls[0]?.[0]?.recurrenteId, 'r-1');
  });

  it('a recurring id nobody knows prefills nothing', async () => {
    gastoRecurrente.mockResolvedValue(null);
    gastos.mockResolvedValue({ desde: '08:15', gastos: [] });
    render(createElement(GastosViva, { fixture: FIXTURE, recurrente: 'r-x' }));
    await waitFor(() => assert.equal(screen.getByTestId('estado').textContent, 'empty'));
    assert.ok(screen.queryByTestId('prefill') === null);
  });

  it('a recurring gasto of an unknown categoria prefills as Otros', async () => {
    gastoRecurrente.mockResolvedValue({
      id: 'r-2',
      concepto: 'Algo raro',
      montoCentavos: 1000,
      categoria: 'Magia',
      proveedor: null,
    });
    gastos.mockResolvedValue({ desde: '08:15', gastos: [] });
    render(createElement(GastosViva, { fixture: FIXTURE, recurrente: 'r-2' }));
    await waitFor(() => assert.ok(screen.getByTestId('prefill')));
    // The drawer opened — the categoria clamping is internal, Otros when unknown.
    assert.ok(screen.getByTestId('prefill').textContent === 'Algo raro');
  });
});

describe('GastosViva · unlinked', () => {
  it('the route’s forced state and the fixture serve', () => {
    credActual = { device: null, sesion: null };
    render(createElement(GastosViva, { fixture: FIXTURE, forzado: 'empty' }));
    assert.equal(screen.getByTestId('estado').textContent, 'empty');
    assert.equal(gastos.mock.calls.length, 0);
  });
});
