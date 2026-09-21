'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@xangarro/tokens';

import { marcarAclarado, pedirAclaracion } from '@/server/actions/cortes';
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
/** The aclarado write's outcome: a failure toasts, a success refreshes. */
function aplicaAclarado(
  setAviso: (a: Aviso) => void,
  refrescar: () => void,
): (r: { ok: true } | { ok: false; message: string }) => void {
  return (r) => {
    if (!r.ok) setAviso({ tint: colors.redSoft, title: 'No se pudo aclarar', body: r.message });
    else refrescar();
  };
}

/** The failure toast a write can leave behind. */
function avisaFallo(
  title: string,
  setAviso: (a: Aviso) => void,
): (r: { ok: true } | { ok: false; message: string }) => void {
  return (r) => {
    if (!r.ok) setAviso({ tint: colors.redSoft, title, body: r.message });
  };
}

/** A local aclarado beats the row's stored state until the refresh lands. */
const estadoDe = (c: Corte, aclarados: readonly string[]): EstadoCorte =>
  aclarados.includes(c.id) ? 'Aclarado' : c.estado;

/** The two toasts, as the design words them. */
function corteAclarado(c: Corte): Aviso {
  return {
    tint: colors.greenSoft,
    title: 'Corte aclarado',
    body: `El corte de ${c.operador} del ${c.dia} queda cerrado. La diferencia se registra como ajuste de caja.`,
  };
}

function aclaracionPedida(c: Corte): Aviso {
  return {
    tint: colors.blueSoft,
    title: 'Aclaración pedida',
    body: `A ${c.operador.split(' ')[0] ?? c.operador} le llega el detalle del corte en sus Avisos. Cuando responda, su respuesta aparece en los tuyos.`,
  };
}

/** «Pedir aclaración» files this message; the operator reads it in Avisos. */
function mensajeAclaracion(c: Corte): string {
  return (
    `Pedro te pide aclarar el corte del ${c.dia}: lo contado no cuadró con lo esperado. ` +
    'Responde desde aquí con tu explicación.'
  );
}

export function useCortes(cortes: readonly Corte[], filtroInicial: FiltroCortes) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<FiltroCortes>(filtroInicial);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [aclarados, setAclarados] = useState<readonly string[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const abierto = cortes.find((c) => c.id === sel) ?? null;
  const aclarar = (c: Corte) => {
    if (estadoDe(c, aclarados) !== 'Por aclarar') return;
    setAclarados((a) => [...a, c.id]);
    setSel(null);
    setAviso(corteAclarado(c));
    void marcarAclarado(c.id).then(aplicaAclarado(setAviso, () => router.refresh()));
  };
  const pedir = (c: Corte) => {
    setSel(null);
    setAviso(aclaracionPedida(c));
    void pedirAclaracion(c.id, mensajeAclaracion(c)).then(avisaFallo('No se pudo pedir', setAviso));
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
    estado: (c: Corte) => estadoDe(c, aclarados),
    aclarar,
    pedir,
    aviso,
    cerrarAviso,
    limpiar,
  };
}

export type Cortes = ReturnType<typeof useCortes>;
