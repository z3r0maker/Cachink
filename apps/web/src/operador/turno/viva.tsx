'use client';

/**
 * Mi turno for real (O-39): a linked register reads its open turno from its
 * own database (the same rows and calculator as Cierre) and the recurring
 * expenses already due. An unlinked browser keeps the design fixture.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { OperadorEstado, type EstadoMode } from '../estado';
import { ICONS } from '../shell/nav';
import { registerRuntime } from '../runtime/client';
import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import { OpMain } from '../ui/parts';
import { TurnoScreen } from './screen';
import type { TurnoData } from './types';
import { comoTurno } from './vivo';

/** No name for the device yet: the caja is «Caja 1», as Cierre and Gastos say. */
const CAJA = 'Caja 1';

interface Vivo {
  readonly state: 'happy' | EstadoMode;
  readonly data: TurnoData | null;
}

async function leerTurno(cred: Credenciales): Promise<TurnoData> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const v = await registerRuntime().turnoVivo(device.businessId, device.deviceId, sesion.turnoId);
  return comoTurno(v, sesion.nombre, CAJA);
}

export function TurnoViva({
  fixture,
  forzado = 'happy',
}: {
  readonly fixture: TurnoData;
  readonly forzado?: 'happy' | EstadoMode;
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const [vivo, setVivo] = useState<Vivo>({ state: 'happy', data: null });

  const recargar = (): void => {
    setVivo({ state: 'loading', data: null });
    void leerTurno(cred)
      .then((data) => setVivo({ state: 'happy', data }))
      .catch(() => setVivo({ state: 'error', data: null }));
  };
  useEffect(() => {
    if (linked) recargar();
    // recargar closes over state setters only; cred identity is stable per mount.
  }, [cred, linked]);

  // Unlinked, and the first paint before the effect (so hydration matches).
  if (!linked || (vivo.state === 'happy' && vivo.data === null)) {
    return <TurnoScreen state={forzado} data={fixture} />;
  }
  if (vivo.data === null) {
    return (
      <OpMain top={24}>
        <OperadorEstado
          mode={vivo.state === 'error' ? 'error' : 'loading'}
          icon={ICONS.turno}
          errorTitle="No pudimos cargar tu turno"
          onRetry={recargar}
        />
      </OpMain>
    );
  }
  const vacio = vivo.data.movimientos.length === 0;
  return <TurnoScreen state={vacio ? 'empty' : 'happy'} data={vivo.data} />;
}
