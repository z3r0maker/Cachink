// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { expect } from 'vitest';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * The door's calls into the register runtime (O-12): re-entry lands straight
 * in when the turno is open, or lists the operators; a linked register opens
 * the turno, keeps the session, and only then says it is ready; and the
 * big-tenant snapshot pull after linking fails soft — the next sync resumes
 * it, the door still moves to the NIP step.
 */

const boot = vi.fn(async () => undefined);
const turnoAbierto = vi.fn();
const operadores = vi.fn();
const abrirCaja = vi.fn();
const vincular = vi.fn();
const sync = vi.fn();
const writeSesion = vi.fn();
const writeDevice = vi.fn();
let deviceActual: unknown = null;

vi.mock('../../src/operador/runtime/client', () => ({
  registerRuntime: () => ({
    // The door polls the snapshot's download (DS-10); null progress reads as «no word yet».
    progresoSnapshot: () => Promise.resolve(null),
    counts: () => Promise.resolve({ pending: 0, rejected: 0, retrying: 0 }),
    boot,
    turnoAbierto,
    operadores,
    abrirCaja,
    vincular,
    sync,
  }),
}));
vi.mock('../../src/operador/runtime/device-store', () => ({
  readDevice: () => deviceActual,
  writeDevice: (c: unknown) => writeDevice(c),
}));
vi.mock('../../src/operador/runtime/session-store', () => ({ writeSesion }));

const { useReentrada, abrirTurno, vincularYPasar } =
  await import('../../src/operador/acceso/flujo');

const DEVICE = { deviceToken: 'tok', deviceId: 'dev-1', businessId: 'biz-1' };
const LISTA = [{ id: 'op-1', nombre: 'Ana Robledo' }];

beforeEach(() => {
  vi.clearAllMocks();
  boot.mockReset().mockResolvedValue(undefined);
  sync.mockReset().mockResolvedValue(undefined);
  deviceActual = DEVICE;
});

afterEach(() => {
  deviceActual = null;
});

const { renderHook, act, waitFor } = await import('@testing-library/react');

describe('useReentrada', () => {
  it('a turno already open lands straight in', async () => {
    turnoAbierto.mockResolvedValue({ userId: 'op-1' });
    const onListo = vi.fn();
    renderHook(() => useReentrada(onListo));
    await waitFor(() => expect(onListo).toHaveBeenCalledTimes(1));
    assert.equal(operadores.mock.calls.length, 0, 'the picker never loads');
  });

  it('a closed turno lists the operators to pick from', async () => {
    turnoAbierto.mockResolvedValue(null);
    operadores.mockResolvedValue(LISTA);
    const { result } = renderHook(() => useReentrada(vi.fn()));
    await waitFor(() => assert.ok(result.current.operadores.length === 1));
    assert.equal(result.current.error, null);
  });

  it('a boot that fails says so, in place', async () => {
    boot.mockRejectedValueOnce(new Error('sin OPFS'));
    const { result } = renderHook(() => useReentrada(vi.fn()));
    await waitFor(() => assert.ok(result.current.error !== null));
  });

  it('no device linked: nothing happens', async () => {
    deviceActual = null;
    const onListo = vi.fn();
    renderHook(() => useReentrada(onListo));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    assert.equal(onListo.mock.calls.length, 0);
    assert.equal(boot.mock.calls.length, 0);
  });
});

describe('abrirTurno', () => {
  it('opens the caja, keeps the session, and says it is ready', async () => {
    abrirCaja.mockResolvedValue({ turnoId: 't-9' });
    const onListo = vi.fn();
    await abrirTurno('op-1', 'Ana Robledo', 500_00n, onListo, vi.fn());
    assert.deepEqual(abrirCaja.mock.calls, [['biz-1', 'dev-1', 'op-1', 500_00n]]);
    assert.deepEqual(writeSesion.mock.calls, [
      [{ userId: 'op-1', nombre: 'Ana Robledo', turnoId: 't-9' }],
    ]);
    assert.equal(onListo.mock.calls.length, 1);
  });

  it('a failure reports it; nothing is kept', async () => {
    abrirCaja.mockRejectedValue(new Error('fondo negativo'));
    const onError = vi.fn();
    const onListo = vi.fn();
    await abrirTurno('op-1', 'Ana', -1n, onListo, onError);
    assert.equal(onError.mock.calls.length, 1);
    assert.equal(writeSesion.mock.calls.length, 0);
    assert.equal(onListo.mock.calls.length, 0);
  });

  it('no device: silence, not an error', async () => {
    deviceActual = null;
    const onListo = vi.fn();
    await abrirTurno('op-1', 'Ana', 1n, onListo, vi.fn());
    assert.equal(abrirCaja.mock.calls.length, 0);
  });
});

describe('vincularYPasar', () => {
  const vinculo = (
    next: string | null,
  ): {
    deviceToken: string;
    deviceId: string;
    businessId: string;
    bootstrap: { snapshot: { next: string } | null };
  } =>
    ({
      deviceToken: 'tok',
      deviceId: 'dev-2',
      businessId: 'biz-1',
      bootstrap: { snapshot: next ? { next } : null },
    }) as unknown as Vinculo;

  it('links, keeps the credentials, and loads the picker', async () => {
    operadores.mockResolvedValue(LISTA);
    const setOperadores = vi.fn();
    await vincularYPasar(vinculo(null), setOperadores);
    assert.equal(vincular.mock.calls.length, 1);
    assert.equal(writeDevice.mock.calls[0]?.[0]?.deviceId, 'dev-2');
    assert.equal(sync.mock.calls.length, 0, 'no snapshot to pull');
    assert.deepEqual(setOperadores.mock.calls, [[LISTA]]);
  });

  it('a big tenant pulls the rest of its snapshot; a failure there is soft', async () => {
    operadores.mockResolvedValue(LISTA);
    const setOperadores = vi.fn();
    sync.mockRejectedValueOnce(new Error('red'));
    // DS-10: the door reports the download's progress as it waits for it.
    const alDescargar = vi.fn();
    const paso = await vincularYPasar(vinculo('token-2'), setOperadores, alDescargar);
    assert.equal(sync.mock.calls.length, 1);
    // DS-10: an interrupted download no longer falls through to the picker —
    // the door stays and offers «Reintentar»; what came down stays.
    assert.equal(paso, false);
    assert.deepEqual(setOperadores.mock.calls, [], 'the door waits for the retry');
  });
});
