// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

/**
 * Operador · Ventas' state (O-32): a linked register reads its own database
 * — the turno's tickets, money as bigint, empty when the turno sold nothing —
 * and cancels through the real use case with the PIN, building the
 * confirmation sentence (the refund when there is one), reloading, and
 * flushing the queue online; the fixture path marks the row cancelled and
 * says so in its own words. The route may open one ticket's drawer on
 * arrival.
 */

const ventas = vi.fn();
const cancelar = vi.fn();
const desencolar = vi.fn();
let credActual: { device: unknown; sesion: unknown };

vi.mock('../../src/operador/runtime/client', () => ({
  registerRuntime: () => ({ ventas, cancelar }),
}));
vi.mock('../../src/operador/runtime/use-credenciales', () => ({
  useCredenciales: () => credActual,
}));
vi.mock('../../src/operador/shell/cola', () => ({
  desencolar: (...a: unknown[]) => desencolar(...a),
}));

const { useVentas } = await import('../../src/operador/ventas/use-ventas');
import type { VentasData } from '@xangarro/caja/ventas';

const BASE = {
  negocio: 'Taquería Don Pedro',
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  desde: '08:15',
  ventas: [],
} as unknown as VentasData;

const CRED = {
  device: { businessId: 'biz-1', deviceId: 'dev-1' },
  sesion: { userId: 'op-1', turnoId: 't-1', nombre: 'Ana Robledo' },
};

const VENTA = {
  id: 'tk-1',
  folio: 41,
  concepto: '3 pastor · 1 gringa',
  montoCentavos: 16000,
  metodo: 'Efectivo',
  hora: '14:52',
  cliente: null,
  cancelada: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  desencolar.mockResolvedValue(undefined);
  credActual = CRED;
  ventas.mockResolvedValue({ desde: '08:15', ventas: [] });
  cancelar.mockResolvedValue({ cashToReturnCentavos: null });
});

afterEach(cleanup);

function montar(abierta?: unknown) {
  return renderHook(() => useVentas(BASE, 'Todos', abierta as never));
}

describe('useVentas · linked', () => {
  it('reads the turno’s tickets; empty when none; a read that fails is error', async () => {
    const { result } = montar();
    await waitFor(() => assert.equal(result.current.state, 'empty'));

    ventas.mockResolvedValue({ desde: '08:15', ventas: [VENTA] });
    const conDatos = montar();
    await waitFor(() => assert.equal(conDatos.result.current.state, 'happy'));
    const v = conDatos.result.current.data.ventas[0];
    assert.equal(v?.folio, 'V-0041');
    assert.equal(v?.monto, 16000n);

    ventas.mockRejectedValue(new Error('sin OPFS'));
    const roto = montar();
    await waitFor(() => assert.equal(roto.result.current.state, 'error'));
  });

  it('a route-opened ticket starts with its drawer open', async () => {
    const { result } = montar({ folio: 'V-0041', state: 'happy' });
    assert.equal(result.current.sel, 'V-0041');
    assert.equal(result.current.capa, 'cajon');
  });

  it('abrir selects, clears the aviso, opens the drawer; cerrar closes it', async () => {
    ventas.mockResolvedValue({ desde: '08:15', ventas: [VENTA] });
    const { result } = montar();
    await waitFor(() => assert.equal(result.current.state, 'happy'));
    act(() => {
      result.current.abrir('V-0041');
    });
    assert.equal(result.current.sel, 'V-0041');
    assert.equal(result.current.capa, 'cajon');
    assert.equal(result.current.fila?.folio, 'V-0041');

    act(() => {
      result.current.cerrar();
    });
    assert.equal(result.current.capa, null);
  });

  it('cancelling through the use case: the sentence, the reload, the queue online', async () => {
    cancelar.mockResolvedValue({ cashToReturnCentavos: 16000n });
    ventas.mockResolvedValue({ desde: '08:15', ventas: [VENTA] });
    const { result } = montar();
    await waitFor(() => assert.equal(result.current.state, 'happy'));
    act(() => {
      result.current.abrir('V-0041');
    });
    act(() => {
      result.current.setCapa('cancelar');
    });

    let error: string | null = 'inicial';
    await act(async () => {
      error = await result.current.cancelar('se cobró dos veces', '2580', '');
    });
    assert.equal(error, null);
    assert.deepEqual(cancelar.mock.calls[0]?.[0], {
      businessId: 'biz-1',
      deviceId: 'dev-1',
      userId: 'op-1',
      ticketId: 'tk-1',
      pin: '2580',
      motivo: 'se cobró dos veces',
    });
    assert.equal(result.current.aviso, 'V-0041 cancelada · se cobró dos veces. Devuelve $160.00.');
    assert.equal(desencolar.mock.calls.length, 1);
    assert.equal(result.current.capa, 'cajon');
  });

  it('a nota is appended to the motivo; the use case’s failure is the dialog’s error', async () => {
    ventas.mockResolvedValue({ desde: '08:15', ventas: [VENTA] });
    const { result } = montar();
    await waitFor(() => assert.equal(result.current.state, 'happy'));
    act(() => {
      result.current.abrir('V-0041');
    });

    let error: string | null = null;
    await act(async () => {
      error = await result.current.cancelar('otro', '2580', 'el cliente insistió');
    });
    assert.equal(cancelar.mock.calls[0]?.[0]?.motivo, 'otro: el cliente insistió');

    cancelar.mockRejectedValue(new Error('NIP incorrecto'));
    await act(async () => {
      error = await result.current.cancelar('otro', '9999', '');
    });
    assert.match(error ?? '', /NIP incorrecto/);
    assert.equal(result.current.capa, 'cajon', 'back to the drawer, the error carried');
  });

  it('offline, the queue is left for the next flush', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    ventas.mockResolvedValue({ desde: '08:15', ventas: [VENTA] });
    const { result } = montar();
    await waitFor(() => assert.equal(result.current.state, 'happy'));
    act(() => {
      result.current.abrir('V-0041');
    });
    await act(async () => {
      await result.current.cancelar('x', '2580', '');
    });
    assert.equal(desencolar.mock.calls.length, 0);
  });
});

describe('useVentas · unlinked (the fixture path)', () => {
  it('the fixture serves as shipped, no NIP asked, and cancelling marks the row', async () => {
    credActual = { device: null, sesion: null };
    const conVenta = {
      ...BASE,
      ventas: [
        {
          id: 'x',
          folio: 'V-0041',
          concepto: 'Tacos',
          monto: 16000n,
          metodo: 'Efectivo',
          hora: '14:52',
        },
      ],
    } as unknown as VentasData;
    const { result } = renderHook(() => useVentas(conVenta, 'Todos'));
    assert.equal(result.current.state, 'happy');
    assert.equal(result.current.conNip, false);
    assert.equal(ventas.mock.calls.length, 0);

    act(() => {
      result.current.abrir('V-0041');
    });
    let error: string | null = 'inicial';
    await act(async () => {
      error = await result.current.cancelar('se cobró dos veces', '', 'nota');
    });
    assert.equal(error, null);
    assert.match(result.current.aviso ?? '', /V-0041 por \$160\.00 quedó cancelada/);
    assert.deepEqual(result.current.data.ventas[0]?.cancelada, {
      motivo: 'se cobró dos veces: nota',
    });
    assert.equal(cancelar.mock.calls.length, 0);
  });
});
