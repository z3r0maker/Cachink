'use client';

/**
 * The shell bell's count (O-16): on a linked caja, the unread avisos read live
 * (the same list Avisos shows); unlinked, the design's fixture count. Avisos
 * announces its own changes (a mark, a reply) with a window event.
 */

import { useEffect, useState } from 'react';

import { registerRuntime } from '../runtime/client';
import { hoyLocal } from '../runtime/fechas';
import { readDevice } from '../runtime/device-store';
import { readSesion } from '../runtime/session-store';
import { avisosVivos, sinLeer } from './vivo';

export const AVISOS_CAMBIARON = 'xangarro:avisos';

export function avisarCambio(): void {
  dispatchEvent(new Event(AVISOS_CAMBIARON));
}

/** `clave` changes when the queue does (a flush can pull new messages). */
export function useAvisosSinLeer(fixture: number, clave: string): number {
  const [linked] = useState(() => readDevice() !== null && readSesion() !== null);
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const device = readDevice();
    const sesion = readSesion();
    if (device === null || sesion === null) return;
    const leer = (): void => {
      void registerRuntime()
        .avisos(device.businessId, device.deviceId, sesion.userId)
        .then((a) => setN(sinLeer(avisosVivos(a, hoyLocal()).avisos)))
        .catch(() => undefined);
    };
    leer();
    addEventListener(AVISOS_CAMBIARON, leer);
    return () => removeEventListener(AVISOS_CAMBIARON, leer);
  }, [clave]);
  return linked ? (n ?? 0) : fixture;
}
