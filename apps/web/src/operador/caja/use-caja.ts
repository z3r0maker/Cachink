'use client';

import { useRef, useState } from 'react';

import { matches, hoyLocal, horaLocal } from '@xangarro/caja';
import {
  contar,
  total,
  type CajaData,
  type Categoria,
  type CobroPaso,
  type LineaTicket,
} from '@xangarro/caja/caja';

/** The four ways a sale is paid (ADR-108: no QR/CoDi). */
export type MetodoCobro = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Fiado';
import { useSaleToast, type VentaHecha } from './use-sale-toast';
import { desencolar } from '../shell/cola';
import { add, bumpLinea, reemplazar, sembrarTicket, useTicketEnCurso } from './ticket-store';
import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import { readSesion } from '../runtime/session-store';

export type Filtro = 'Todos' | Categoria;

/** The catalogue filter: a search resets the category to «Todos», as in the design. */
function useCatalogo(catalogo: CajaData['catalogo']) {
  const [filtro, setFiltro] = useState<Filtro>('Todos');
  const [query, setQuery] = useState('');
  const productos = catalogo
    .filter((p) => filtro === 'Todos' || p.categoria === filtro)
    .filter((p) => matches(query, p.nombre));
  const buscar = (text: string) => {
    setQuery(text);
    setFiltro('Todos');
  };
  return { productos, filtro, setFiltro, query, buscar };
}

/**
 * Everything the register holds on this device while a sale is built: the
 * ticket, the catalogue filter, the checkout step and the corner card.
 */
export function useCaja(data: CajaData, pasoInicial: CobroPaso) {
  // The ticket lives in the store (O-13): it survives the lock and switching
  // operators. The fixture's seed fills the store once per mount — after a
  // sale the empty ticket is the new one, not the demo's come back.
  useState(() => sembrarTicket(data.ticket));
  const lines = useTicketEnCurso();
  const [paso, setPaso] = useState<CobroPaso>(pasoInicial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const toast = useSaleToast();
  const count = contar(lines);
  const vendida = useRef<readonly LineaTicket[] | null>(null);
  const { metodo, setMetodo, cobrar, venderRef } = useCobrar(count, setPaso, setSheetOpen);
  function vender(v: Omit<VentaHecha, 'lines' | 'total'>): void {
    if (vendida.current === lines) return;
    vendida.current = lines;
    toast.show({ ...v, lines, total: total(lines) });
    reemplazar([]);
    setPaso('catalogo');
    setSheetOpen(false);
    void registrarSiVinculado(lines, v);
  }
  venderRef.current = vender;
  return {
    ...useCatalogo(data.catalogo),
    lines,
    setLines: reemplazar,
    count,
    total: total(lines),
    add,
    bump: bumpLinea,
    paso,
    setPaso,
    cobrar,
    sheetOpen,
    setSheetOpen,
    toast,
    /** The sale is recorded; the ticket starts over. A button smash fires
     *  this several times with the same render's `lines` — one ticket, one
     *  sale; a new ticket is always a different array. Linked (O-06), the
     *  sale also lands in the register's own database through the atomic
     *  ticket use case, offline-safe and flushed by the queue when online. */
    vender,
    metodo,
    setMetodo,
    deshacer: () => deshacer(toast),
  };
}

/** «Deshacer»: the just-sold lines come back as the ticket in progress. */
function deshacer(toast: ReturnType<typeof useSaleToast>): void {
  if (toast.venta) reemplazar(toast.venta.lines);
  toast.dismiss();
}

/** The method picked in the ticket, and what «Cobrar» does with it: cash and
 *  fiado take a step in the ticket itself (ADR-107); card and transfer are
 *  done at once. */
function useCobrar(
  count: number,
  setPaso: (p: CobroPaso) => void,
  setSheetOpen: (v: boolean) => void,
) {
  const [metodo, setMetodo] = useState<MetodoCobro>('Efectivo');
  const venderRef = useRef<(v: Omit<VentaHecha, 'lines' | 'total'>) => void>(() => undefined);
  const cobrar = (): void => {
    if (count === 0) return;
    if (metodo === 'Efectivo' || metodo === 'Fiado') {
      setPaso(metodo === 'Efectivo' ? 'efectivo' : 'credito');
      setSheetOpen(true);
      return;
    }
    venderRef.current({ metodo, cambio: null, nota: `Pago recibido por ${metodo.toLowerCase()}.` });
  };
  return { metodo, setMetodo, cobrar, venderRef };
}

export type Caja = ReturnType<typeof useCaja>;

/**
 * The linked register's capture (O-06): the ticket goes to the Worker's
 * database — `RegistrarTicketUseCase`, folio and all — before anything leaves
 * the device. Offline it simply queues; the cola flushes on reconnect.
 */
async function registrarSiVinculado(
  lines: readonly LineaTicket[],
  v: Omit<VentaHecha, 'lines' | 'total'>,
): Promise<void> {
  const device = readDevice();
  const sesion = readSesion();
  if (device === null || sesion === null || lines.length === 0) return;
  try {
    await registerRuntime().registrar(
      {
        ticket: {
          fecha: hoyLocal() as never,
          hora: horaLocal(),
          concepto: lines[0]?.nombre ?? 'Venta',
          metodo: (v.metodo === 'Fiado' ? 'Crédito' : v.metodo) as never,
          clienteId: (v.clienteId ?? null) as never,
          efectivoRecibidoCentavos: v.cambio === null ? null : total(lines) + v.cambio,
          cambioCentavos: v.cambio,
          businessId: device.businessId as never,
        },
        lineas: lines.map((l) => ({
          concepto: l.nombre,
          categoria: 'Producto' as const,
          monto: total([l]),
          productoId: l.productoId as never,
          cantidad: l.cantidad,
        })),
      },
      // The Worker reads the business's stock switch itself (runtime/tickets.ts).
      { deviceId: device.deviceId, userId: sesion.userId, stockEnabled: false },
    );
    if (navigator.onLine) await desencolar();
  } catch (e) {
    console.error('registrar', e);
  }
}
