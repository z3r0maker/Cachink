'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import type { RangoChip } from './periodo';
import { urlDe, type EstadoMovimientos } from './url';

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
    const next = { ...ultimo.current, pagina: 1, ...cambio };
    ultimo.current = next;
    setEstado(next);
    startTransition(() => router.replace(urlDe(next), { scroll: false }));
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
    irAPagina: (pagina: number) => ir({ pagina }),
  };
}

export type Movimientos = ReturnType<typeof useMovimientos>;
