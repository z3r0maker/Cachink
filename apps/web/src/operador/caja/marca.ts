'use client';

import { useEffect, useState } from 'react';

import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import type { MarcaDelNegocio } from '../runtime/negocio';
import type { Comprobante } from './receipt';

/**
 * A linked caja reads the business from its own database each time a receipt
 * opens, so a leyenda the owner just changed (and a pull brought down) shows
 * at once. An unlinked caja (the design fixture) keeps what it was given.
 */
export function useMarcaDelNegocio(): MarcaDelNegocio | null {
  const [marca, setMarca] = useState<MarcaDelNegocio | null>(null);
  useEffect(() => {
    const device = readDevice();
    if (device === null) return;
    let vivo = true;
    const runtime = registerRuntime();
    void runtime
      .boot()
      .then(() => runtime.negocio(device.businessId, device.deviceId))
      .then((m) => {
        if (vivo) setMarca(m);
      })
      .catch((e: unknown) => console.error('negocio', e));
    return () => {
      vivo = false;
    };
  }, []);
  return marca;
}

/** The comprobante with the business's real name and marks, once read. */
export function conMarca(c: Comprobante, m: MarcaDelNegocio | null): Comprobante {
  if (m === null) return c;
  const { nombre, ...marca } = m;
  return { ...c, negocio: nombre, marca };
}
