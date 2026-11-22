'use client';

import { useEffect, useState } from 'react';
import { folioVisto } from '@xangarro/caja/ventas';

import { registerRuntime } from '../runtime/client';
import { readDevice, type DeviceCredentials } from '../runtime/device-store';

/**
 * Cobrar's turno figures on a linked register: how many sales stand (a
 * cancelled one counts nowhere, as in Ventas) and the folio the next sale
 * gets, both from the register's own database. Read when Cobrar opens and
 * again after each sale is registered, never the design's 12 and V-0413.
 */
export const VENTA_REGISTRADA = 'xangarro:venta-registrada';

export interface TurnoDeCaja {
  readonly ventasTurno: number;
  readonly siguienteFolio: string;
}

async function leer(device: DeviceCredentials): Promise<TurnoDeCaja | null> {
  const runtime = registerRuntime();
  await runtime.boot();
  const abierto = await runtime.turnoAbierto(device.businessId, device.deviceId);
  if (abierto === null) return null;
  const t = await runtime.ventas(device.businessId, device.deviceId, abierto.turnoId);
  return {
    ventasTurno: t.ventas.filter((v) => v.cancelada === null).length,
    siguienteFolio: folioVisto(t.siguienteFolio),
  };
}

/** Read once Cobrar mounts, then on every registered sale; null on an unlinked caja. */
export function useTurnoDeCaja(): TurnoDeCaja | null {
  const [turno, setTurno] = useState<TurnoDeCaja | null>(null);
  useEffect(() => {
    // Read here, not taken as a prop: `readDevice` parses a new object on
    // every call, and an effect keyed on it would read again every render.
    const device = readDevice();
    if (device === null) return;
    let vivo = true;
    const releer = (): void => {
      void leer(device)
        .then((t) => {
          if (vivo) setTurno(t);
        })
        .catch((e: unknown) => console.error('turno de caja', e));
    };
    releer();
    addEventListener(VENTA_REGISTRADA, releer);
    return () => {
      vivo = false;
      removeEventListener(VENTA_REGISTRADA, releer);
    };
  }, []);
  return turno;
}
