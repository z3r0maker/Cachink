'use client';

import { useCallback, useState } from 'react';
import { colors } from '@xangarro/tokens';

import { aclaracion, aclarado } from './derive';
import type { Corte, EstadoCorte, FiltroCortes } from './types';

export interface Aviso {
  readonly tint: string;
  readonly title: string;
  readonly body: string;
}

/**
 * Filters, the open corte and the owner's two exits. «Marcar como aclarado»
 * and «Pedir aclaración» stay on this page until the close use case and the
 * owner→operator message (ADR-075) are wired (C-18, O-06).
 */
export function useCortes(cortes: readonly Corte[], filtroInicial: FiltroCortes) {
  const [filtro, setFiltro] = useState<FiltroCortes>(filtroInicial);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [aclarados, setAclarados] = useState<readonly string[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const estado = (c: Corte): EstadoCorte => (aclarados.includes(c.id) ? 'Aclarado' : c.estado);
  const abierto = cortes.find((c) => c.id === sel) ?? null;
  const aclarar = (c: Corte) => {
    if (estado(c) !== 'Por aclarar') return;
    setAclarados((a) => [...a, c.id]);
    setSel(null);
    setAviso({ tint: colors.greenSoft, title: 'Corte aclarado', body: aclarado(c) });
  };
  const pedir = (c: Corte) => {
    setSel(null);
    setAviso({ tint: colors.blueSoft, title: 'Aclaración pedida', body: aclaracion(c) });
  };
  const cerrarAviso = useCallback(() => setAviso(null), []);
  /** «Ver todos los cortes»: back to every corte, no search. */
  const limpiar = () => {
    setFiltro('Todos');
    setQuery('');
  };
  return {
    filtro,
    setFiltro,
    query,
    setQuery,
    abierto,
    setSel,
    estado,
    aclarar,
    pedir,
    aviso,
    cerrarAviso,
    limpiar,
  };
}

export type Cortes = ReturnType<typeof useCortes>;
