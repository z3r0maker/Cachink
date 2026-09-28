'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import type { RangoChip } from './periodo';
import { urlDe, urlIrA, type EstadoMovimientos } from './url';

/** How long typing pauses before the search goes to the server. */
const ESPERA_BUSQUEDA_MS = 300;

/**
 * The search box's text, sent `ESPERA_BUSQUEDA_MS` after typing pauses. A
 * search still waiting when the person leaves the screen is dropped, so it
 * cannot pull them back to it.
 */
function useBusquedaDiferida(inicial: string, buscar: (q: string) => void) {
  const [query, setQuery] = useState(inicial);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const t = espera;
    return () => {
      if (t.current !== null) clearTimeout(t.current);
    };
  }, []);
  const onQuery = (v: string) => {
    setQuery(v);
    if (espera.current !== null) clearTimeout(espera.current);
    espera.current = setTimeout(() => buscar(v.trim()), ESPERA_BUSQUEDA_MS);
  };
  return { query, onQuery };
}

/**
 * Every filter on Movimientos narrows the rows and the counters follow — the
 * range chip included (P-09: a chip that only highlights is a bug). The
 * filters are the URL: each change navigates, and the server answers with
 * the page and summary for it (DB2-QRY-02).
 *
 * The state shown is the one last **asked for**, not the one last served, so
 * a chip lights at once and two quick changes build on each other instead of
 * the second overwriting the first. Any filter goes back to page 1; switching
 * tabs also clears the category, whose keys the tabs do not share.
 */
export function useMovimientos(servido: EstadoMovimientos) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [estado, setEstado] = useState(servido);
  const ultimo = useRef(servido);

  // Back, forward or a link: what the server served wins. Adjusted during
  // render, React's pattern for state that follows a prop.
  const clave = urlDe(servido);
  const [visto, setVisto] = useState(clave);
  if (visto !== clave) {
    setVisto(clave);
    setEstado(servido);
  }
  useEffect(() => {
    ultimo.current = estado;
  }, [estado]);

  const ir = (cambio: Partial<EstadoMovimientos>) => {
    // «Ir a fecha» is one request, never carried into the next change.
    const next = { ...ultimo.current, pagina: 1, ir: '', ...cambio };
    ultimo.current = next;
    setEstado(next);
    const url = next.ir === '' ? urlDe(next) : urlIrA(next, next.ir);
    startTransition(() => router.replace(url, { scroll: false }));
  };
  const busqueda = useBusquedaDiferida(servido.q, (q) => ir({ q }));

  return {
    estado,
    pendiente,
    query: busqueda.query,
    onQuery: busqueda.onQuery,
    onTab: (v: string) => ir({ tab: v === 'gastos' ? 'gastos' : 'ventas', cat: null }),
    setRange: (r: RangoChip) => ir({ rango: r }),
    setCustom: (c: { desde: string; hasta: string }) => ir({ desde: c.desde, hasta: c.hasta }),
    setFilter: (cat: string | null) => ir({ cat }),
    /** «Ir a fecha» (DS-01): the server opens that day's page and redirects to `?pagina=N`. */
    irAFecha: (dia: string) => ir({ ir: dia }),
    /** «Reintentar»: the same URL, asked again; the old rows stay until it answers. */
    reintentar: () => startTransition(() => router.refresh()),
    /**
     * One page on from the page last **asked for**, within `paginas`: two
     * quick clicks on «Siguiente» are two pages, not the same one twice.
     */
    moverPagina: (delta: number, paginas: number) =>
      ir({ pagina: Math.min(paginas, Math.max(1, ultimo.current.pagina + delta)) }),
  };
}

export type Movimientos = ReturnType<typeof useMovimientos>;
