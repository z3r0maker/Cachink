'use client';

/**
 * Inicio for real (O-39): a linked register greets its operator by the time
 * of day and answers «what now» from its own open turno, «Para hoy» (the
 * recurring expenses already due, low stock, overdue fiado) and its last
 * closes. An unlinked browser keeps the design fixture.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { OperadorEstado } from '../estado';
import { type EstadoMode, ICONS, hoyLocal } from '@xangarro/caja';
import { registerRuntime } from '../runtime/client';
import { comoCuenta } from '../cobranza/vivo';
import type { CuentaPara } from '../runtime/protocol';
import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import { OpMain } from '../ui/parts';
import { InicioScreen } from './screen';
import { type InicioData, comoInicio, type Entorno } from '@xangarro/caja/inicio';

/** No name for the device yet: the caja is «Caja 1», as Cierre and Gastos say. */
const CAJA = 'Caja 1';

interface Vivo {
  readonly state: 'happy' | EstadoMode;
  readonly data: InicioData | null;
}

/** What the queue holds, as the pill and Pendientes count it; zero when the runtime can't say. */
async function pendientesCola(): Promise<number> {
  try {
    return (await registerRuntime().colaPendiente()).length;
  } catch {
    return 0;
  }
}

/** Fiado still owed across the business, for the closed turno's figures. */
function porCobrar(cuentas: readonly CuentaPara[]): Entorno['porCobrar'] {
  const saldos = cuentas.map((c) => BigInt(c.saldoCentavos)).filter((s) => s > 0n);
  return { monto: saldos.reduce((a, b) => a + b, 0n), clientes: saldos.length };
}

/** «Para hoy»'s other two kinds: tracked stock and the accounts. Empty when unreadable. */
async function stockYCuentas(
  device: { businessId: string; deviceId: string },
  turnoId: string,
): Promise<{ stock: Entorno['stock']; cuentas: readonly CuentaPara[] }> {
  const rt = registerRuntime();
  const [inv, cuentas] = await Promise.all([
    rt.inventario(device.businessId, device.deviceId, turnoId).catch(() => null),
    rt.cuentas(device.businessId, device.deviceId).catch(() => []),
  ]);
  return { stock: inv?.existencias ?? [], cuentas };
}

async function leerInicio(cred: Credenciales): Promise<InicioData> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const rt = registerRuntime();
  const [v, negocio, pendientes, otros] = await Promise.all([
    rt.turnoVivo(device.businessId, device.deviceId, sesion.turnoId),
    rt.negocio(device.businessId, device.deviceId).catch(() => null),
    pendientesCola(),
    stockYCuentas(device, sesion.turnoId),
  ]);
  const hoy = hoyLocal();
  return comoInicio(v, {
    nombre: sesion.nombre,
    negocio: negocio?.nombre ?? null,
    caja: CAJA,
    offline: !navigator.onLine,
    pendientes,
    porCobrar: porCobrar(otros.cuentas),
    ahora: new Date(),
    dueno: negocio?.dueno ?? null,
    stock: otros.stock,
    cuentas: otros.cuentas.map((c) => comoCuenta(c, hoy)),
  });
}

export function InicioViva({
  fixture,
  forzado = 'happy',
}: {
  readonly fixture: InicioData;
  readonly forzado?: 'happy' | EstadoMode;
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const [vivo, setVivo] = useState<Vivo>({ state: 'happy', data: null });

  const recargar = (): void => {
    setVivo({ state: 'loading', data: null });
    void leerInicio(cred)
      .then((data) => setVivo({ state: 'happy', data }))
      .catch(() => setVivo({ state: 'error', data: null }));
  };
  useEffect(() => {
    if (linked) recargar();
    // recargar closes over state setters only; cred identity is stable per mount.
  }, [cred, linked]);

  // Unlinked, and the first paint before the effect (so hydration matches).
  if (!linked || (vivo.state === 'happy' && vivo.data === null)) {
    return <InicioScreen state={forzado} data={fixture} />;
  }
  if (vivo.data === null) {
    return (
      <OpMain top={24}>
        <OperadorEstado
          mode={vivo.state === 'error' ? 'error' : 'loading'}
          icon={ICONS.inicio}
          errorTitle="No pudimos cargar tu turno"
          onRetry={recargar}
        />
      </OpMain>
    );
  }
  // Closed, «Para hoy» says it waits for the turno; open, no task is the empty state.
  const vacio = vivo.data.tareas.length === 0 && vivo.data.situacion !== 'turno-cerrado';
  return <InicioScreen state={vacio ? 'empty' : 'happy'} data={vivo.data} />;
}
