'use client';

import { useEffect, useRef } from 'react';

import type { Caja } from './use-caja';

/** The search input's id: typing anywhere on Cobrar lands in it. */
export const BUSCAR_ID = 'cx-buscar';

const escribiendo = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement &&
  (el.isContentEditable ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.tagName === 'INPUT');

const esCobrar = (ev: KeyboardEvent): boolean =>
  ev.key === 'F2' || (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey));

/**
 * Cobrar from a PC keyboard (ADR-107): type to search, Enter adds the first
 * match, + and − change the last line, F2 or Ctrl+Enter charges, Esc steps
 * back. Nothing fires while a text field other than the search has focus.
 */
export function useAtajosCaja(caja: Caja): void {
  const ref = useRef(caja);
  ref.current = caja;
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => atajo(ev, ref.current);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

const dialogoAbierto = (): boolean =>
  document.querySelector('[role="dialog"], [role="alertdialog"]') !== null;

function atajo(ev: KeyboardEvent, caja: Caja): void {
  // A dialog on top (producto nuevo, comprobante) owns the keyboard.
  if (ev.defaultPrevented || ev.altKey || dialogoAbierto()) return;
  const enBuscar = ev.target instanceof HTMLElement && ev.target.id === BUSCAR_ID;
  if (esCobrar(ev) && caja.paso === 'catalogo') {
    ev.preventDefault();
    caja.cobrar();
  } else if (ev.key === 'Escape') {
    escape(caja, enBuscar);
  } else if (enBuscar) {
    enterEnBuscar(ev, caja);
  } else if (libre(ev, caja)) {
    cantidadOBuscar(ev, caja);
  }
}

/** Nothing else has the keyboard: no field, no step, no modifier. */
const libre = (ev: KeyboardEvent, caja: Caja): boolean =>
  !escribiendo(ev.target) && caja.paso === 'catalogo' && !ev.ctrlKey && !ev.metaKey;

function escape(caja: Caja, enBuscar: boolean): void {
  if (caja.paso !== 'catalogo') caja.setPaso('catalogo');
  else if (enBuscar) caja.buscar('');
}

function enterEnBuscar(ev: KeyboardEvent, caja: Caja): void {
  const primero = caja.productos[0];
  if (ev.key !== 'Enter' || primero === undefined) return;
  ev.preventDefault();
  caja.add(primero);
  caja.buscar('');
}

function cantidadOBuscar(ev: KeyboardEvent, caja: Caja): void {
  const ultima = caja.lines[caja.lines.length - 1];
  if ((ev.key === '+' || ev.key === '-') && ultima !== undefined) {
    ev.preventDefault();
    caja.bump(ultima.productoId, ev.key === '+' ? 1 : -1);
    return;
  }
  if (ev.key.length !== 1 || ev.key === ' ') return;
  const input = document.getElementById(BUSCAR_ID);
  if (!(input instanceof HTMLInputElement)) return;
  ev.preventDefault();
  caja.buscar(caja.query + ev.key);
  input.focus();
}
