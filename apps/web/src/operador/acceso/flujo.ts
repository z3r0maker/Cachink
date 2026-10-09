'use client';

import { useEffect, useState } from 'react';

import type { Vinculo } from './activar';
import { registerRuntime } from '../runtime/client';
import { readDevice, writeDevice } from '../runtime/device-store';
import { writeSesion } from '../runtime/session-store';
import type { OperadorPara } from '../runtime/protocol';
import type { Descarga } from './descarga';
import type { ProgresoDescarga } from '@xangarro/caja';

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

/** How often the door reads the snapshot's page while it downloads. */
const LEER_CADA_MS = 400;
/** Runs one link may take: each fetches up to 200 pages (`MAX_SNAPSHOT_PAGES_PER_RUN`). */
const MAX_RUNS = 10;

type AlDescargar = (d: Descarga) => void;

/**
 * The rest of the snapshot, page by page (DS-10): each run pulls what it can
 * while the door polls `progresoSnapshot` for «3 de 7». True once complete;
 * false when a run stopped short — what came down stays, «Reintentar» resumes.
 */
export async function bajarSnapshot(token: string, alDescargar: AlDescargar): Promise<boolean> {
  const runtime = registerRuntime();
  const leer = () => runtime.progresoSnapshot().catch(() => null);
  let ultimo = await leer();
  alDescargar({ fase: 'descargando', progreso: ultimo });
  const t = setInterval(() => {
    void leer().then((p) => {
      if (p === null) return;
      ultimo = p;
      alDescargar({ fase: 'descargando', progreso: p });
    });
  }, LEER_CADA_MS);
  try {
    if (await hastaCompletar(token, leer)) return true;
  } finally {
    clearInterval(t);
  }
  alDescargar({ fase: 'interrumpida', progreso: ultimo });
  return false;
}

/** Runs until the snapshot is complete (true) or a run fails or waits (false). */
async function hastaCompletar(
  token: string,
  leer: () => Promise<ProgresoDescarga | null>,
): Promise<boolean> {
  for (let i = 0; i < MAX_RUNS; i += 1) {
    const r = await registerRuntime()
      .sync(token, { mode: 'completa', manual: true })
      .catch(() => null);
    if (r === null || r.deferred === true) return false;
    if ((r.pull?.error ?? r.push?.error ?? null) !== null) return false;
    if ((await leer()) === null) return true;
  }
  return false;
}

/**
 * Link, keep the credentials, bring the rest of a big business's snapshot
 * (C-23, DS-10), load the picker. False when the download stopped short: the
 * door offers «Reintentar» (`bajarSnapshot` again) before the NIP step.
 */
export async function vincularYPasar(
  r: Vinculo,
  setOperadores: (o: readonly OperadorPara[]) => void,
  alDescargar: AlDescargar,
): Promise<boolean> {
  const runtime = registerRuntime();
  await runtime.boot();
  await runtime.vincular(r.bootstrap, r.businessId);
  writeDevice({
    deviceToken: r.deviceToken,
    deviceId: r.deviceId,
    businessId: r.businessId,
    activatedAt: new Date().toISOString(),
  });
  if (!r.bootstrap.snapshot?.next) {
    setOperadores(await runtime.operadores(r.businessId, r.deviceId));
    return true;
  }
  return reanudarDescarga(r, setOperadores, alDescargar);
}

/** «Reintentar» after an interrupted download: resume it, then load the picker. */
export async function reanudarDescarga(
  r: Vinculo,
  setOperadores: (o: readonly OperadorPara[]) => void,
  alDescargar: AlDescargar,
): Promise<boolean> {
  if (!(await bajarSnapshot(r.deviceToken, alDescargar))) return false;
  setOperadores(await registerRuntime().operadores(r.businessId, r.deviceId));
  return true;
}
