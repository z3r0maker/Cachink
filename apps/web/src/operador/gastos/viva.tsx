'use client';

/**
 * Gastos for real (O-35): a linked register reads the open turno's expenses
 * from its own database and records new ones through the use case — scoped to
 * the turno so the expected cash sees them. An unlinked browser keeps the
 * design fixtures. Receipt photos wait for the storage bucket (ADR-083 D3).
 * `?recurrente=<id>` opens the drawer filled from a due recurring gasto;
 * saving it pays it (plan 11 §3.3).
 */

import { useEffect, useState, type ReactNode } from 'react';

import { registerRuntime } from '../runtime/client';
import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import { desencolar } from '../shell/cola';
import type { GastoPara } from '../runtime/protocol';
import type { EstadoMode } from '../estado';
import { GastosScreen } from './screen';
import { OPERADOR_BASE } from '../shell/nav';
import type { NuevoGasto, PrefillGasto } from './registrar';
import { CATEGORIAS, type CategoriaGasto, type GastoTurno, type GastosData } from './types';

interface Vivo {
  readonly state: 'happy' | EstadoMode;
  readonly data: GastosData;
}

/** The receipt flag stays false until the bucket lands (ADR-083 D3). */
function comoGasto(g: GastoPara): GastoTurno {
  return {
    id: g.id,
    concepto: g.concepto,
    detalle: 'Sin comprobante',
    monto: BigInt(g.montoCentavos),
    categoria: g.categoria as CategoriaGasto,
    hora: g.hora,
    comprobante: false,
  };
}

async function leerGastos(cred: Credenciales): Promise<Vivo> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const r = await registerRuntime().gastos(device.businessId, device.deviceId, sesion.turnoId);
  return {
    state: r.gastos.length === 0 ? 'empty' : 'happy',
    data: {
      operador: sesion.nombre,
      caja: 'Caja 1',
      desde: r.desde,
      gastos: r.gastos.map(comoGasto),
    },
  };
}

/** Record through the use case, then let the queue carry it up. */
async function gastarEnVivo(cred: Credenciales, n: NuevoGasto): Promise<void> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const input = {
    businessId: device.businessId,
    deviceId: device.deviceId,
    userId: sesion.userId,
    turnoId: sesion.turnoId,
    concepto: n.concepto,
    categoria: n.categoria,
    montoCentavos: n.monto,
    proveedor: n.proveedor,
  };
  // Paying a due recurring gasto also advances its schedule (one use case).
  if (n.recurrenteId === undefined) await registerRuntime().gastar(input);
  else await registerRuntime().pagarRecurrente({ ...input, recurrenteId: n.recurrenteId });
  if (navigator.onLine) await desencolar();
}

/** The due recurring gasto `?recurrente=` names, as the drawer fills itself; null when not due. */
async function leerPrefill(cred: Credenciales, id: string): Promise<PrefillGasto | null> {
  const { device } = cred;
  if (device === null) return null;
  const r = await registerRuntime().gastoRecurrente(device.businessId, device.deviceId, id);
  if (r === null) return null;
  return {
    recurrenteId: r.id,
    concepto: r.concepto,
    monto: BigInt(r.montoCentavos),
    categoria: (CATEGORIAS as readonly string[]).includes(r.categoria)
      ? (r.categoria as CategoriaGasto)
      : 'Otros',
    proveedor: r.proveedor,
  };
}

/** Linked: read the recurring gasto to pay once, then drop the query so a reload is plain. */
function usePrefill(cred: Credenciales, linked: boolean, id: string | null) {
  const [prefill, setPrefill] = useState<PrefillGasto | null>(null);
  useEffect(() => {
    if (!linked || id === null) return;
    void leerPrefill(cred, id)
      .then(setPrefill)
      .catch(() => undefined)
      .finally(() => window.history.replaceState(null, '', `${OPERADOR_BASE}/gastos`));
  }, [cred, linked, id]);
  return prefill;
}

export function GastosViva({
  fixture,
  forzado = 'happy',
  recurrente = null,
}: {
  readonly fixture: GastosData;
  readonly forzado?: 'happy' | EstadoMode;
  /** A due recurring gasto to pay (Mi turno and Inicio's «Registrar»). */
  readonly recurrente?: string | null;
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const prefill = usePrefill(cred, linked, recurrente);
  const [vivo, setVivo] = useState<Vivo>({ state: 'happy', data: fixture });

  const recargar = (): void => {
    void leerGastos(cred)
      .then(setVivo)
      .catch(() => setVivo((v) => ({ ...v, state: 'error' })));
  };
  useEffect(() => {
    if (!linked) return;
    setVivo((v) => ({ ...v, state: 'loading' }));
    recargar();
    // recargar closes over state setters only; cred identity is stable per mount.
  }, [cred, linked]);

  if (!linked) return <GastosScreen state={forzado} data={fixture} />;
  return (
    <GastosScreen
      state={vivo.state}
      data={vivo.data}
      prefill={prefill}
      registrarVivo={(n) => {
        void gastarEnVivo(cred, n)
          .then(recargar)
          .catch(() => undefined);
      }}
    />
  );
}
