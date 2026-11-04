/**
 * «Desvincular y borrar» (MvDesvincularBorrar): nothing unsent is destroyed,
 * the token goes before the tables, the «Listo» flag is the last row
 * written, and the app restarts only after a wipe that finished.
 */

import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { InMemoryAppConfigRepository } from '@xangarro/testing';
import type * as DataModule from '@xangarro/data';
import type { XangarroDatabase } from '@xangarro/data';
import type { SyncCounts } from '@xangarro/sync';

const orden: string[] = [];
const wipeLocalData = vi.fn(async () => {
  orden.push('wipe');
  return { tables: 20, compacted: true };
});
vi.mock('@xangarro/data', async (importOriginal) => ({
  ...(await importOriginal<typeof DataModule>()),
  wipeLocalData: (db: unknown) => wipeLocalData(db),
}));

const { wipeDevice, sinEnviar } = await import('../../src/activation/wipe-device');
const { memoryTokenStore } = await import('../../src/activation/activation-config');
const { APP_CONFIG_KEYS } = await import('../../src/app-config/types');

const NADA: SyncCounts = { pending: 0, rejected: 0, retrying: 0, unsent: 0 };

function deps(counts: SyncCounts = NADA) {
  orden.length = 0;
  wipeLocalData.mockClear();
  const tokenStore = memoryTokenStore('tok');
  const clear = tokenStore.clear.bind(tokenStore);
  tokenStore.clear = async () => {
    orden.push('token');
    await clear();
  };
  const appConfig = new InMemoryAppConfigRepository();
  const reiniciar = vi.fn(() => orden.push('reiniciar'));
  return {
    db: {} as XangarroDatabase,
    appConfig,
    tokenStore,
    queryClient: new QueryClient(),
    contar: vi.fn(async () => counts),
    reiniciar,
    esperaReinicioMs: 0,
    now: () => new Date('2026-11-03T18:00:00.000Z'),
  };
}

describe('wipeDevice', () => {
  it('clears the token, wipes, leaves the «Listo» flag, then restarts', async () => {
    const d = deps();
    await expect(wipeDevice(d)).resolves.toEqual({ kind: 'borrado' });
    await vi.waitFor(() => expect(d.reiniciar).toHaveBeenCalled());
    expect(orden).toEqual(['token', 'wipe', 'reiniciar']);
    expect(await d.tokenStore.get()).toBeNull();
    expect(await d.appConfig.get(APP_CONFIG_KEYS.avisoBorrado)).toBe('2026-11-03T18:00:00.000Z');
  });

  it('refuses while anything is unsent, and touches nothing', async () => {
    const d = deps({ ...NADA, unsent: 3, pending: 1 });
    await expect(wipeDevice(d)).resolves.toEqual({ kind: 'pendiente', sinEnviar: 3 });
    expect(orden).toEqual([]);
    expect(await d.tokenStore.get()).toBe('tok');
  });

  it('counts refused rows too: wiping would destroy them', async () => {
    expect(sinEnviar({ ...NADA, rejected: 2 })).toBe(2);
    const d = deps({ ...NADA, rejected: 2 });
    await expect(wipeDevice(d)).resolves.toEqual({ kind: 'pendiente', sinEnviar: 2 });
    expect(wipeLocalData).not.toHaveBeenCalled();
  });

  it('a failed wipe propagates, writes no flag and does not restart', async () => {
    const d = deps();
    wipeLocalData.mockRejectedValueOnce(new Error('disk I/O error'));
    await expect(wipeDevice(d)).rejects.toThrow('disk I/O error');
    expect(await d.appConfig.get(APP_CONFIG_KEYS.avisoBorrado)).toBeNull();
    expect(d.reiniciar).not.toHaveBeenCalled();
  });

  it('lands on the connect screen first, and restarts only once it settled', async () => {
    vi.useFakeTimers();
    try {
      const d = deps();
      const reset = vi.spyOn(d.queryClient, 'resetQueries');
      await wipeDevice({ ...d, esperaReinicioMs: 800 });
      expect(reset).toHaveBeenCalled();
      expect(d.reiniciar).not.toHaveBeenCalled();
      vi.advanceTimersByTime(800);
      expect(d.reiniciar).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('without a restart (web, tests) the connect screen is the end', async () => {
    const d = deps();
    const reset = vi.spyOn(d.queryClient, 'resetQueries');
    await wipeDevice({ ...d, reiniciar: undefined });
    expect(reset).toHaveBeenCalled();
  });

  it('asks the database, not the last known counts, right before wiping', async () => {
    const d = deps();
    await wipeDevice(d);
    expect(d.contar).toHaveBeenCalledTimes(1);
  });
});
