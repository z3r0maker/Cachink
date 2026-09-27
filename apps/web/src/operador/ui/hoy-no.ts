'use client';

/**
 * «Hoy no»: rows the operator put off for the rest of today on this device
 * (Inicio's «Para hoy» and Mi turno's «Pendientes de registrar» share the
 * list, so a recurring gasto put off in one is off in the other). Device-local
 * on purpose: the domain's «descartar» skips a whole period, this only waits
 * for tomorrow. Read after mount so the server's markup still matches.
 */

import { useCallback, useEffect, useState } from 'react';

import { hoyLocal } from '../runtime/fechas';

const KEY = 'operador.hoyNo';

interface Guardado {
  readonly fecha: string;
  readonly ids: readonly string[];
}

/** Today's put-off ids from what was stored; another day's list is stale. */
export function vigentes(raw: string | null, hoy: string): readonly string[] {
  if (raw === null) return [];
  try {
    const v = JSON.parse(raw) as Partial<Guardado>;
    if (v.fecha !== hoy || !Array.isArray(v.ids)) return [];
    return v.ids.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function leer(): readonly string[] {
  try {
    return vigentes(localStorage.getItem(KEY), hoyLocal());
  } catch {
    return [];
  }
}

function guardar(ids: readonly string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ fecha: hoyLocal(), ids }));
  } catch {
    /* sin localStorage vale solo mientras la pantalla esté abierta */
  }
}

export interface HoyNo {
  readonly ocultos: readonly string[];
  readonly ocultar: (id: string) => void;
  /** «Ver todas»: bring back everything put off today. */
  readonly mostrarTodo: () => void;
}

export function useHoyNo(): HoyNo {
  const [ocultos, setOcultos] = useState<readonly string[]>([]);
  useEffect(() => setOcultos(leer()), []);
  const ocultar = useCallback((id: string) => {
    setOcultos((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      guardar(next);
      return next;
    });
  }, []);
  const mostrarTodo = useCallback(() => {
    guardar([]);
    setOcultos([]);
  }, []);
  return { ocultos, ocultar, mostrarTodo };
}
