'use client';

import { useRef, useState } from 'react';

import { matches } from '../ui/search';
import { addProducto, bump, contar, total } from './ticket';
import type { CajaData, Categoria, CobroPaso, LineaTicket, Producto } from './types';
import { useSaleToast, type VentaHecha } from './use-sale-toast';

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
    /** The sale is recorded (O-06 wires the ticket use case); the ticket starts over.
     *  A button smash fires this several times with the same render's `lines` —
     *  one ticket, one sale; a new ticket is always a different array. */
    vender: (v: Omit<VentaHecha, 'lines' | 'total'>) => {
      if (vendida.current === lines) return;
      vendida.current = lines;
      toast.show({ ...v, lines, total: total(lines) });
      setLines([]);
      setPaso('catalogo');
      setSheetOpen(false);
    },
    /** «Deshacer»: the just-sold lines come back as the ticket in progress. */
    deshacer: () => {
      if (toast.venta) setLines(toast.venta.lines);
      toast.dismiss();
    },
  };
}

export type Caja = ReturnType<typeof useCaja>;
