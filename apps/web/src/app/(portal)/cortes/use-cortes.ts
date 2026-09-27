'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@xangarro/tokens';

import { marcarAclarado, pedirAclaracion } from '@/server/actions/cortes';
import { aclaracion, aclarado, primerNombre } from './derive';
import type { Corte, EstadoCorte, FiltroCortes } from './types';

export interface Aviso {
  readonly tint: string;
  readonly title: string;
  readonly body: string;
}

type Resultado = { ok: true } | { ok: false; message: string };

/** The aclarado write's outcome: a failure toasts, a success refreshes. */
function aplicaAclarado(
  setAviso: (a: Aviso) => void,
  refrescar: () => void,
): (r: Resultado) => void {
  return (r) => {
    if (!r.ok) setAviso({ tint: colors.redSoft, title: 'No se pudo aclarar', body: r.message });
    else refrescar();
  };
}

/** The failure toast a write can leave behind. */
function avisaFallo(title: string, setAviso: (a: Aviso) => void): (r: Resultado) => void {
  return (r) => {
    if (!r.ok) setAviso({ tint: colors.redSoft, title, body: r.message });
  };
}

/** A local aclarado beats the row's stored state until the refresh lands. */
const estadoDe = (c: Corte, aclarados: readonly string[]): EstadoCorte =>
  aclarados.includes(c.id) ? 'Aclarado' : c.estado;

/** «Preguntarle a Ana» files this message; the operator reads it at her caja. */
function mensajeAclaracion(c: Corte): string {
  return (
    `Pedro te pregunta por el corte del ${c.dia}: lo contado no cuadró con lo esperado. ` +
    'Responde desde aquí con tu explicación.'
  );
}

/** The owner's two exits: «Marcar como aclarado» and «Preguntarle a …» (ADR-075). */
function useSalidas(setSel: (id: string | null) => void, setAviso: (a: Aviso) => void) {
  const router = useRouter();
  const [aclarados, setAclarados] = useState<readonly string[]>([]);
  const aclarar = (c: Corte) => {
    if (estadoDe(c, aclarados) !== 'Por aclarar') return;
    setAclarados((a) => [...a, c.id]);
    setSel(null);
    setAviso({ tint: colors.greenSoft, title: 'Corte aclarado', body: aclarado(c) });
    void marcarAclarado(c.id).then(aplicaAclarado(setAviso, () => router.refresh()));
  };
  const pedir = (c: Corte) => {
    setSel(null);
    setAviso({
      tint: colors.blueSoft,
      title: `Le preguntaste a ${primerNombre(c)}`,
      body: aclaracion(c),
    });
    void pedirAclaracion(c.id, mensajeAclaracion(c)).then(
      avisaFallo('No se pudo preguntar', setAviso),
    );
  };
  return { estado: (c: Corte) => estadoDe(c, aclarados), aclarar, pedir };
}

/** Filters (state, caja, search), the open corte and the last toast. */
export function useCortes(cortes: readonly Corte[], filtroInicial: FiltroCortes) {
  const [filtro, setFiltro] = useState<FiltroCortes>(filtroInicial);
  const [caja, setCaja] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const salidas = useSalidas(setSel, setAviso);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  /** «Ver todos los cortes»: back to every corte, no caja, no search. */
  const limpiar = () => {
    setFiltro('Todos');
    setCaja(null);
    setQuery('');
  };
  return {
    filtro,
    setFiltro,
    caja,
    alternarCaja: (c: string) => setCaja((x) => (x === c ? null : c)),
    query,
    setQuery,
    abierto: cortes.find((c) => c.id === sel) ?? null,
    setSel,
    ...salidas,
    aviso,
    cerrarAviso,
    limpiar,
  };
}

export type Cortes = ReturnType<typeof useCortes>;
