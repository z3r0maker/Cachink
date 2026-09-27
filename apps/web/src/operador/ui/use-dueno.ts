'use client';

/**
 * The owner as the caja's copy names him: on a linked caja, the first name
 * the bootstrap and every pull keep («el dueño» until known); on an unlinked
 * browser, the design fixture's «Pedro». Starts at the fixture so the
 * server's markup matches, and swaps in the effect (like the live screens).
 */

import { useEffect, useState } from 'react';

import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import { DUENO_GENERICO, nombreDueno } from './dueno';

/** The design fixture's owner. */
export const DUENO_FIXTURE = 'Pedro';

/** Read once per tab: the name only changes with a pull, and a stale one for a while is fine. */
let cache: string | null = null;

export function useDueno(): string {
  const [dueno, setDueno] = useState(DUENO_FIXTURE);
  useEffect(() => {
    const device = readDevice();
    if (device === null) return;
    setDueno(cache ?? DUENO_GENERICO);
    let vivo = true;
    const runtime = registerRuntime();
    void runtime
      .boot()
      .then(() => runtime.negocio(device.businessId, device.deviceId))
      .then((m) => {
        cache = nombreDueno(m?.dueno);
        if (vivo) setDueno(cache);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return dueno;
}
