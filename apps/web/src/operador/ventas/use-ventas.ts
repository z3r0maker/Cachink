'use client';

/**
 * Operador · Ventas' state (O-32). The fixture path stays exactly as the
 * screen shipped; a linked register reads its own database (the turno's
 * tickets) and cancels through the real use case — PIN and permission
 * included — then lets the queue carry it up.
 */

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { formatMoney } from '@xangarro/domain';

import type { EstadoMode } from '../estado';
import { desencolar } from '../shell/cola';
import { registerRuntime } from '../runtime/client';
import { readDevice, type DeviceCredentials } from '../runtime/device-store';
import { readSesion, type SesionCaja } from '../runtime/session-store';
import type { VentaPara } from '../runtime/protocol';
import type { Motivo } from './cancelar';
import type { MetodoVenta, VentasData, VentaTurno } from './types';

export type FiltroVenta = 'Todos' | MetodoVenta;

interface Vivo {
  readonly state: 'happy' | EstadoMode;
  readonly data: VentasData;
}

type Cred = { readonly device: DeviceCredentials | null; readonly sesion: SesionCaja | null };

/** «Crédito» is the wire's word; the operator's screen says «Fiado». */
function comoMetodo(metodo: string): MetodoVenta {
  return metodo === 'Crédito' ? 'Fiado' : (metodo as MetodoVenta);
}

function comoVenta(v: VentaPara): VentaTurno {
  return {
    id: v.id,
    folio: `V-${String(v.folio).padStart(4, '0')}`,
    concepto: v.concepto,
    monto: BigInt(v.montoCentavos),
    metodo: comoMetodo(v.metodo),
    hora: v.hora,
    ...(v.cliente === null ? {} : { cliente: v.cliente }),
    ...(v.cancelada === null ? {} : { cancelada: { motivo: v.cancelada } }),
  };
}

/** Read the turno's tickets from the register's own database. */
async function leerVentas(cred: Cred): Promise<Vivo> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const r = await registerRuntime().ventas(device.businessId, device.deviceId, sesion.turnoId);
  return {
    state: r.ventas.length === 0 ? 'empty' : 'happy',
    data: {
      operador: sesion.nombre,
      caja: 'Caja 1',
      desde: r.desde,
      ventas: r.ventas.map(comoVenta),
    },
  };
}

/** Cancel through the use case; the toast text is ours to build. */
async function cancelarEnVivo(
  cred: Cred,
  venta: VentaTurno,
  nip: string,
  motivo: string,
): Promise<string> {
  const { device, sesion } = cred;
  if (device === null || sesion === null || venta.id === undefined) throw new Error('sin sesión');
  const r = await registerRuntime().cancelar({
    businessId: device.businessId,
    deviceId: device.deviceId,
    userId: sesion.userId,
    ticketId: venta.id,
    pin: nip,
    motivo,
  });
  const devuelve =
    r.cashToReturnCentavos === null
      ? ''
      : ` Devuelve ${formatMoney(BigInt(r.cashToReturnCentavos))}.`;
  return `${venta.folio} cancelada · ${motivo}.${devuelve}`;
}

/** Cancel through the use case, refresh, flush the queue; the toast tells it. */
async function cancelarYRefrescar(
  cred: Cred,
  venta: VentaTurno,
  nip: string,
  motivo: string,
  setToast: (t: string) => void,
  recargar: () => Promise<void>,
): Promise<void> {
  try {
    setToast(await cancelarEnVivo(cred, venta, nip, motivo));
    await recargar();
    if (navigator.onLine) await desencolar();
  } catch (e: unknown) {
    setToast(`No se pudo cancelar: ${String(e)}`);
  }
}

/** The fixture path's mark: the sale stays, shown as cancelled. */
function marcarCancelada(v: Vivo, folio: string, motivo: string): Vivo {
  return {
    ...v,
    data: {
      ...v.data,
      ventas: v.data.ventas.map((x) => (x.folio === folio ? { ...x, cancelada: { motivo } } : x)),
    },
  };
}

/** The register's credentials, read once per mount — stable identities below. */
function useCredenciales(): Cred {
  const [cred] = useState<Cred>(() => ({ device: readDevice(), sesion: readSesion() }));
  return cred;
}

/** A linked register loads its Ventas on mount and can be told to reload. */
function useCargaVivas(cred: Cred, setVivo: Dispatch<SetStateAction<Vivo>>): () => Promise<void> {
  const linked = cred.device !== null && cred.sesion !== null;
  const recargar = useCallback(async (): Promise<void> => {
    if (linked) setVivo(await leerVentas(cred));
  }, [cred, linked, setVivo]);
  useEffect(() => {
    if (!linked) return;
    setVivo((v) => ({ ...v, state: 'loading' }));
    leerVentas(cred)
      .then(setVivo)
      .catch(() => setVivo((v) => ({ ...v, state: 'error' })));
  }, [cred, linked, setVivo]);
  return recargar;
}

/** The hook behind the screen: fixture data until the register is linked. */
export function useVentas(data: VentasData, filtroInicial: FiltroVenta) {
  const [filtro, setFiltro] = useState(filtroInicial);
  const [query, setQuery] = useState('');
  const [cancelando, setCancelando] = useState<VentaTurno | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [vivo, setVivo] = useState<Vivo>({ state: 'happy', data });
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const recargar = useCargaVivas(cred, setVivo);

  const cancelar = (motivo: Motivo, nip: string, nota: string): void => {
    if (!cancelando) return;
    const completo = nota === '' ? motivo : `${motivo} — ${nota}`;
    const { folio } = cancelando;
    if (linked && cancelando.id !== undefined) {
      void cancelarYRefrescar(cred, cancelando, nip, completo, setToast, recargar);
    } else {
      setVivo((v) => marcarCancelada(v, folio, completo));
      setToast(
        `${folio} por ${formatMoney(cancelando.monto)} · ${completo}. Queda visible en tu turno y en el corte.`,
      );
    }
    setCancelando(null);
  };

  return {
    state: vivo.state,
    data: vivo.data,
    filtro,
    setFiltro,
    query,
    setQuery,
    cancelando,
    setCancelando,
    cancelar,
    toast,
    closeToast: () => setToast(null),
    /** Linked registers ask for the operator's NIP when cancelling. */
    conNip: linked,
  };
}
