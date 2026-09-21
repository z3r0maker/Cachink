'use client';

/**
 * Cierre de turno for real (O-36): a linked register reads the expected cash
 * (the O-03 calculator, scoped to the turno) and its figures from its own
 * rows, and closes through `CerrarCajaUseCase` — the reason mapped onto the
 * domain's enum (ADR-083 D6). An unlinked browser keeps the design fixtures.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { registerRuntime } from '../runtime/client';
import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import { desencolar } from '../shell/cola';
import type { CierrePara } from '../runtime/protocol';
import type { EstadoMode } from '../estado';
import { CierreScreen } from './screen';
import type { CerrarVivo } from './use-cierre';
import type { CierreData, CierreScreenProps } from './types';

import { horaLocal } from '../runtime/fechas';

/** The Worker's figures as the screen's data; the count starts at zero. */
function comoCierre(c: CierrePara, sesion: { nombre: string }): CierreData {
  return {
    operador: sesion.nombre,
    caja: 'Caja 1',
    desde: c.desde,
    hasta: horaLocal(),
    dueno: 'Pedro',
    partes: {
      fondo: BigInt(c.fondoCentavos),
      ventasEfectivo: BigInt(c.ventasEfectivoCentavos),
      abonosEfectivo: BigInt(c.abonosEfectivoCentavos),
      gastosEfectivo: BigInt(c.gastosEfectivoCentavos),
    },
    resumen: {
      ventas: c.resumen.ventas,
      cobrado: BigInt(c.resumen.cobradoCentavos),
      canceladas: c.resumen.canceladas,
      cancelado: BigInt(c.resumen.canceladoCentavos),
      fiado: BigInt(c.resumen.fiadoCentavos),
      entradas: c.resumen.entradas,
      mermas: c.resumen.mermas,
    },
    conteo: {},
  };
}

async function leerCierre(cred: Credenciales): Promise<CierreData> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const c = await registerRuntime().cierre(device.businessId, device.deviceId, sesion.turnoId);
  return comoCierre(c, { nombre: sesion.nombre });
}

/** Close through the use case, then let the queue carry it up. */
async function cerrarEnVivo(cred: Credenciales, p: Parameters<CerrarVivo>[0]): Promise<void> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  await registerRuntime().cerrar({
    businessId: device.businessId,
    deviceId: device.deviceId,
    turnoId: sesion.turnoId,
    montoCierreCentavos: p.montoCierreCentavos,
    discrepancyReason: p.discrepancyReason,
    explicacion: p.explicacion,
  });
  if (navigator.onLine) await desencolar();
}

export function CierreViva({
  fixture,
  forzado = 'happy',
}: {
  readonly fixture: CierreScreenProps;
  readonly forzado?: 'happy' | EstadoMode;
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const [vivo, setVivo] = useState<{ state: 'happy' | EstadoMode; data: CierreData }>({
    state: 'happy',
    data: fixture.data,
  });

  useEffect(() => {
    if (!linked) return;
    setVivo((v) => ({ ...v, state: 'loading' }));
    void leerCierre(cred)
      .then((data) => setVivo({ state: 'happy', data }))
      .catch(() => setVivo((v) => ({ ...v, state: 'error' })));
  }, [cred, linked]);

  if (!linked) return <CierreScreen {...fixture} state={forzado} />;
  return (
    <CierreScreen state={vivo.state} data={vivo.data} cerrarVivo={(p) => cerrarEnVivo(cred, p)} />
  );
}
