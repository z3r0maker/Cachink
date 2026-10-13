// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

/**
 * Cobros (P-08, CfgCobros): each switch saves at once — the three methods
 * through «Guardar negocio» as one validated patch, Fiado as the función.
 * The last method on refuses to go off and says why, on its own card; a
 * failed save rolls the switch back and lands its own message.
 */

const guardarNegocio = vi.fn();
const cambiarFuncion = vi.fn();
const refresh = vi.fn();

vi.mock('@/server/actions/guardar-negocio', () => ({
  guardarNegocio: (...a: unknown[]) => guardarNegocio(...a),
}));
vi.mock('@/server/actions/funciones', () => ({
  cambiarFuncion: (...a: unknown[]) => cambiarFuncion(...a),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const { useCobros } = await import('../src/app/(portal)/negocio/cobros/use-cobros');
import type { Business } from '../src/app/(portal)/negocio/edicion/draft';

const NEGOCIO = {
  id: 'b-1',
  nombre: 'Taquería',
  enabledPaymentMethods: '["Efectivo","Tarjeta"]',
} as unknown as Business;

beforeEach(() => {
  vi.clearAllMocks();
  guardarNegocio.mockResolvedValue({ ok: true });
  cambiarFuncion.mockResolvedValue({ ok: true });
});

afterEach(cleanup);

function montar(fiado = false) {
  return renderHook(({ b }) => useCobros(b, fiado), { initialProps: { b: NEGOCIO } });
}

describe('useCobros', () => {
  it('parses the business’s methods to start', () => {
    const { result } = montar();
    assert.deepEqual(result.current.metodos, ['Efectivo', 'Tarjeta']);
    assert.equal(result.current.fiado, false);
  });

  it('a method on saves the whole patch at once and refreshes', async () => {
    const { result } = montar();
    await act(async () => {
      result.current.toggle('Transferencia', true);
    });
    await waitFor(() => assert.equal(refresh.mock.calls.length, 1));
    const enviado = guardarNegocio.mock.calls[0]?.[0] as { metodosPago: string[] };
    assert.deepEqual(enviado.metodosPago, ['Efectivo', 'Tarjeta', 'Transferencia']);
    assert.deepEqual(result.current.metodos, ['Efectivo', 'Tarjeta', 'Transferencia']);
    assert.equal(result.current.error, null);
    assert.equal(result.current.ultimo, null);
  });

  it('a method off removes it; the last one on refuses and names itself', async () => {
    const { result } = montar();
    await act(async () => {
      result.current.toggle('Tarjeta', false);
    });
    await waitFor(() => assert.equal(guardarNegocio.mock.calls.length, 1));
    assert.deepEqual(result.current.metodos, ['Efectivo']);

    await act(async () => {
      result.current.toggle('Efectivo', false);
    });
    assert.deepEqual(result.current.metodos, ['Efectivo'], 'still on');
    assert.equal(result.current.ultimo, 'Efectivo');
    assert.equal(guardarNegocio.mock.calls.length, 1, 'nothing saved');
  });

  it('a failed save rolls the switch back with the server’s own message', async () => {
    guardarNegocio.mockResolvedValue({
      ok: false,
      message: 'Revisa los datos marcados.',
      errores: { campos: { metodosPago: 'Al menos un método.' } },
    });
    const { result } = montar();
    await act(async () => {
      result.current.toggle('Transferencia', true);
    });
    await waitFor(() => assert.ok(result.current.error !== null));
    assert.equal(result.current.error, 'Al menos un método.');
    assert.deepEqual(result.current.metodos, ['Efectivo', 'Tarjeta'], 'rolled back');
    assert.equal(refresh.mock.calls.length, 0);
  });

  it('Fiado is the función, saved on its own and rolled back on failure', async () => {
    const { result } = montar();
    await act(async () => {
      result.current.guardarFiado(true);
    });
    await waitFor(() => assert.deepEqual(cambiarFuncion.mock.calls, [['ventasCredito', true]]));
    assert.equal(result.current.fiado, true);

    cambiarFuncion.mockResolvedValueOnce({ ok: false, message: 'Tu plan no lo incluye.' });
    await act(async () => {
      result.current.guardarFiado(false);
    });
    await waitFor(() => assert.equal(result.current.error, 'Tu plan no lo incluye.'));
    assert.equal(result.current.fiado, true, 'rolled back');
  });
});
