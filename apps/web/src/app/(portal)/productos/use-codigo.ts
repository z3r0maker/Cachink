'use client';

import { useEffect, useRef, useState } from 'react';

import { codigoEnUso } from '@/server/actions/codigo-en-uso';

import type { CodigoOcupado } from './codigo-barras';
import { lectorTecla, SIN_RAFAGA } from './lector';

/** Where a key lands in a field of its own; the page-wide reader stays out of it. */
const enCampo = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/**
 * A reader that types while no field has focus (P-44): its burst and Enter
 * become the code, and that Enter presses nothing else on the page.
 */
export function useLectorEnPagina(onCodigo: (codigo: string) => void): void {
  const alLeer = useRef(onCodigo);
  alLeer.current = onCodigo;
  useEffect(() => {
    let rafaga = SIN_RAFAGA;
    const onKey = (e: KeyboardEvent) => {
      if (enCampo(e.target) || e.ctrlKey || e.metaKey || e.altKey) {
        rafaga = SIN_RAFAGA;
        return;
      }
      const paso = lectorTecla(rafaga, e.key, e.timeStamp);
      rafaga = paso.rafaga;
      if (paso.codigo === null) return;
      e.preventDefault();
      alLeer.current(paso.codigo);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}

/**
 * The code field's state (P-44, EcPortalCodigo): «Más opciones» opens by itself
 * when a code arrives, «Leímos el código…» after the reader's Enter, and the
 * product that already has the code once `revisar` asked the server.
 */
export function useCodigo(sku: string, setSku: (codigo: string) => void, propio?: string) {
  const [leido, setLeido] = useState(false);
  const [ocupado, setOcupado] = useState<CodigoOcupado | null>(null);
  const [abierto, setAbierto] = useState(sku.trim() !== '');
  const cambiar = (codigo: string) => {
    setSku(codigo);
    setLeido(false);
    setOcupado(null);
  };
  const leer = (codigo: string) => {
    cambiar(codigo);
    setLeido(true);
    setAbierto(true);
  };
  /** True when the code is free; false when another product has it; a sentence when the check failed. */
  const revisar = async (): Promise<true | false | string> => {
    if (sku.trim() === '') return true;
    const r = await codigoEnUso(sku, propio);
    if (!r.ok) return r.message;
    setOcupado(r.otro);
    if (r.otro !== null) setAbierto(true);
    return r.otro === null;
  };
  return {
    leido,
    ocupado,
    abierto,
    setAbierto,
    cambiar,
    leer,
    onLeido: () => setLeido(true),
    revisar,
  };
}

export type CodigoVivo = ReturnType<typeof useCodigo>;
