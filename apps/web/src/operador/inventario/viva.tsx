'use client';

/**
 * Inventario for real (O-24): a linked caja reads its stocked products and
 * this turno's movements from its own database, and records «Llegó mercancía»
 * and mermas through `RegistrarMovimientoInventarioUseCase`. An unlinked
 * browser keeps the design fixture.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { registerRuntime } from '../runtime/client';
import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import { desencolar } from '../shell/cola';
import type { EstadoMode } from '../estado';
import { InventarioScreen } from './screen';
import type { InventarioData, NuevoMovimientoVivo, Pestana } from './types';
import { INVENTARIO_VACIO, comoInventario } from './vivo';

interface Vivo {
  readonly state: 'happy' | EstadoMode;
  readonly data: InventarioData;
}

async function leerInventario(cred: Credenciales): Promise<Vivo> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const r = await registerRuntime().inventario(device.businessId, device.deviceId, sesion.turnoId);
  return {
    state: r.existencias.length === 0 ? 'empty' : 'happy',
    data: comoInventario(r, sesion),
  };
}

/** Record through the use case, then let the queue carry it up. */
async function moverEnVivo(cred: Credenciales, m: NuevoMovimientoVivo): Promise<void> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  await registerRuntime().moverInventario({
    businessId: device.businessId,
    deviceId: device.deviceId,
    userId: sesion.userId,
    productoId: m.existenciaId,
    tipo: m.tipo,
    cantidad: m.cantidad,
    detalle: m.detalle,
  });
  if (navigator.onLine) await desencolar();
}

export function InventarioViva({
  fixture,
  forzado = 'happy',
  tab,
  reponer = null,
}: {
  readonly fixture: InventarioData;
  readonly forzado?: 'happy' | EstadoMode;
  readonly tab: Pestana;
  /** `?reponer=<id>`: open that product's «Llegó mercancía». */
  readonly reponer?: string | null;
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  // The first render matches the server's (unlinked) markup; the effect then
  // swaps to loading with no data, so the fixture never lingers.
  const [vivo, setVivo] = useState<Vivo>({ state: 'happy', data: fixture });

  const recargar = (): void => {
    void leerInventario(cred)
      .then(setVivo)
      .catch(() => setVivo((v) => ({ ...v, state: 'error' })));
  };
  useEffect(() => {
    if (!linked) return;
    setVivo({ state: 'loading', data: INVENTARIO_VACIO });
    recargar();
    // recargar closes over state setters only; cred identity is stable per mount.
  }, [cred, linked]);

  if (!linked) {
    return <InventarioScreen state={forzado} tab={tab} data={fixture} reponer={reponer} />;
  }
  return (
    <InventarioScreen
      state={vivo.state}
      tab={tab}
      data={vivo.data}
      reponer={reponer}
      registrarVivo={(m) => {
        // A failed write reloads too: the optimistic move gives way to the truth.
        void moverEnVivo(cred, m).then(recargar, recargar);
      }}
    />
  );
}
