'use client';

import { useEffect, useState } from 'react';

import type { Vinculo } from './activar';
import { registerRuntime } from '../runtime/client';
import { readDevice, writeDevice } from '../runtime/device-store';
import { writeSesion } from '../runtime/session-store';
import type { OperadorPara } from '../runtime/protocol';

/** The door's calls into the register runtime: re-entry, linking, opening. */

/** A linked register re-enters at the NIP step (or straight in: turno open). */
export function useReentrada(onListo: () => void): {
  readonly operadores: readonly OperadorPara[];
  readonly setOperadores: (o: readonly OperadorPara[]) => void;
  readonly error: string | null;
} {
  const [operadores, setOperadores] = useState<readonly OperadorPara[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const device = readDevice();
    if (device === null) return;
    const runtime = registerRuntime();
    void (async () => {
      try {
        await runtime.boot();
        const sesion = await runtime.turnoAbierto(device.businessId, device.deviceId);
        if (sesion !== null) {
          onListo();
          return;
        }
        setOperadores(await runtime.operadores(device.businessId, device.deviceId));
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [onListo]);
  return { operadores, setOperadores, error };
}

export async function abrirTurno(
  userId: string,
  nombre: string,
  fondoCentavos: bigint,
  onListo: () => void,
  onError: (e: string) => void,
): Promise<void> {
  const device = readDevice();
  if (device === null) return;
  try {
    const { turnoId } = await registerRuntime().abrirCaja(
      device.businessId,
      device.deviceId,
      userId,
      fondoCentavos,
    );
    writeSesion({ userId, nombre, turnoId });
    onListo();
  } catch (e) {
    onError(String(e));
  }
}

/**
 * Link, keep the credentials, load the picker, move to the NIP step. A
 * tenant too big for one page (C-23) pulls the rest of its snapshot before
 * the register opens; a failure there is not fatal — the next sync resumes it.
 */
export async function vincularYPasar(
  r: Vinculo,
  setOperadores: (o: readonly OperadorPara[]) => void,
): Promise<void> {
  const runtime = registerRuntime();
  await runtime.boot();
  await runtime.vincular(r.bootstrap, r.businessId);
  writeDevice({
    deviceToken: r.deviceToken,
    deviceId: r.deviceId,
    businessId: r.businessId,
    activatedAt: new Date().toISOString(),
  });
  if (r.bootstrap.snapshot?.next) {
    await runtime.sync(r.deviceToken, { mode: 'completa', manual: true }).catch(() => null);
  }
  setOperadores(await runtime.operadores(r.businessId, r.deviceId));
}
