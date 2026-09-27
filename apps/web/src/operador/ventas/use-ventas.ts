'use client';

/**
 * Operador · Ventas' state (O-32). The fixture path stays exactly as the
 * screen shipped; a linked register reads its own database (the turno's
 * tickets) and cancels through the real use case, PIN and permission
 * included, then lets the queue carry it up.
 */

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { formatMoney } from '@xangarro/domain';

import type { EstadoMode } from '@xangarro/caja';
import { desencolar } from '../shell/cola';
import { registerRuntime } from '../runtime/client';
import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import type { VentaPara } from '../runtime/protocol';
import {
  comoMetodo,
  type Abierta,
  type MetodoVenta,
  type VentasData,
  type VentaTurno,
} from '@xangarro/caja/ventas';

export type FiltroVenta = 'Todos' | MetodoVenta;

/** What sits over the list: the ticket's drawer, or one of its two dialogs. */
export type Capa = 'cajon' | 'cancelar' | 'compartir' | null;

interface Vivo {
  readonly state: 'happy' | EstadoMode;
  readonly data: VentasData;
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
async function leerVentas(cred: Credenciales, base: VentasData): Promise<Vivo> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const r = await registerRuntime().ventas(device.businessId, device.deviceId, sesion.turnoId);
  return {
    state: r.ventas.length === 0 ? 'empty' : 'happy',
    data: { ...base, operador: sesion.nombre, desde: r.desde, ventas: r.ventas.map(comoVenta) },
  };
}

/** Cancel through the use case; the confirmation sentence is ours to build. */
async function cancelarEnVivo(
  cred: Credenciales,
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

/** A linked register loads its Ventas on mount and can be told to reload. */
function useCargaVivas(
  cred: Credenciales,
  base: VentasData,
  setVivo: Dispatch<SetStateAction<Vivo>>,
): () => Promise<void> {
  const linked = cred.device !== null && cred.sesion !== null;
  const recargar = useCallback(async (): Promise<void> => {
    if (linked) setVivo(await leerVentas(cred, base));
  }, [cred, base, linked, setVivo]);
  useEffect(() => {
    if (!linked) return;
    setVivo((v) => ({ ...v, state: 'loading' }));
    leerVentas(cred, base)
      .then(setVivo)
      .catch(() => setVivo((v) => ({ ...v, state: 'error' })));
  }, [cred, base, linked, setVivo]);
  return recargar;
}

/** Which ticket is open, and what covers it; the route may open one on arrival. */
function useCapas(abierta: Abierta | undefined) {
  const [sel, setSel] = useState<string | null>(abierta?.folio ?? null);
  const [capa, setCapa] = useState<Capa>(abierta ? 'cajon' : null);
  const [aviso, setAviso] = useState<string | null>(null);
  const abrir = (folio: string): void => {
    setSel(folio);
    setAviso(null);
    setCapa('cajon');
  };
  return { sel, capa, setCapa, aviso, setAviso, abrir, cerrar: () => setCapa(null) };
}

/** Resolves to the error to show in the dialog, or null once cancelled. */
function useCancelar(p: {
  readonly fila: VentaTurno | undefined;
  readonly linked: boolean;
  readonly cred: Credenciales;
  readonly capas: ReturnType<typeof useCapas>;
  readonly setVivo: Dispatch<SetStateAction<Vivo>>;
  readonly recargar: () => Promise<void>;
}) {
  const { fila, capas } = p;
  return async (motivo: string, nip: string, nota: string): Promise<string | null> => {
    if (!fila) return null;
    const completo = nota.trim() === '' ? motivo : `${motivo}: ${nota.trim()}`;
    if (p.linked && fila.id !== undefined) {
      try {
        capas.setAviso(await cancelarEnVivo(p.cred, fila, nip, completo));
      } catch (e: unknown) {
        return `No se pudo cancelar: ${String(e)}`;
      }
      await p.recargar();
      if (navigator.onLine) void desencolar();
    } else {
      p.setVivo((v) => marcarCancelada(v, fila.folio, completo));
      capas.setAviso(
        `Listo, ${fila.folio} por ${formatMoney(fila.monto)} quedó cancelada. Se sigue viendo en tu turno y en el corte.`,
      );
    }
    capas.setCapa('cajon');
    return null;
  };
}

/** The hook behind the screen: fixture data until the register is linked. */
export function useVentas(data: VentasData, filtroInicial: FiltroVenta, abierta?: Abierta) {
  const [filtro, setFiltro] = useState(filtroInicial);
  const [query, setQuery] = useState('');
  const [vivo, setVivo] = useState<Vivo>({ state: 'happy', data });
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const recargar = useCargaVivas(cred, data, setVivo);
  const capas = useCapas(abierta);
  const fila = vivo.data.ventas.find((x) => x.folio === capas.sel);

  const cancelar = useCancelar({ fila, linked, cred, capas, setVivo, recargar });

  return {
    ...capas,
    state: vivo.state,
    data: vivo.data,
    filtro,
    setFiltro,
    query,
    setQuery,
    fila,
    cancelar,
    cred,
    linked,
    /** Linked registers ask for the operator's NIP when cancelling. */
    conNip: linked,
  };
}
