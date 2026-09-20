'use client';

import { useRef, useState } from 'react';

import { matches } from '../ui/search';
import { addProducto, bump, contar, total } from './ticket';
import type { CajaData, Categoria, CobroPaso, LineaTicket, Producto } from './types';
import { useSaleToast, type VentaHecha } from './use-sale-toast';
import { desencolar } from '../shell/cola';
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
  const [lines, setLines] = useState<readonly LineaTicket[]>(data.ticket);
  const [paso, setPaso] = useState<CobroPaso>(pasoInicial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const toast = useSaleToast();
  const count = contar(lines);
  const vendida = useRef<readonly LineaTicket[] | null>(null);
  return {
    ...useCatalogo(data.catalogo),
    lines,
    setLines,
    count,
    total: total(lines),
    add: (p: Producto) => setLines((l) => addProducto(l, p)),
    bump: (id: string, delta: number) => setLines((l) => bump(l, id, delta)),
    paso,
    setPaso,
    cobrar: () => {
      if (count === 0) return;
      setPaso('metodo');
      setSheetOpen(false);
    },
    sheetOpen,
    setSheetOpen,
    toast,
    /** The sale is recorded; the ticket starts over. A button smash fires
     *  this several times with the same render's `lines` — one ticket, one
     *  sale; a new ticket is always a different array. Linked (O-06), the
     *  sale also lands in the register's own database through the atomic
     *  ticket use case — offline-safe, flushed by the queue when online. */
    vender: (v: Omit<VentaHecha, 'lines' | 'total'>) => {
      if (vendida.current === lines) return;
      vendida.current = lines;
      toast.show({ ...v, lines, total: total(lines) });
      setLines([]);
      setPaso('catalogo');
      setSheetOpen(false);
      void registrarSiVinculado(lines, v);
    },
    /** «Deshacer»: the just-sold lines come back as the ticket in progress. */
    deshacer: () => {
      if (toast.venta) setLines(toast.venta.lines);
      toast.dismiss();
    },
  };
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
  const ahora = new Date();
  try {
    await registerRuntime().registrar(
      {
        ticket: {
          fecha: ahora.toISOString().slice(0, 10) as never,
          hora: `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`,
          concepto: lines[0]?.nombre ?? 'Venta',
          metodo: v.metodo as never,
          clienteId: null,
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
      // stockEnabled arrives with the screens' feature-flag wiring (O-14+);
      // a linked register today sells without moving stock in the same breath.
      { deviceId: device.deviceId, userId: sesion.userId, stockEnabled: false },
    );
    if (navigator.onLine) await desencolar();
  } catch (e) {
    console.error('registrar', e);
  }
}
