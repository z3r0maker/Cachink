'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';

import { pantallaDeRuta, pantallaPorHref, type Pantalla } from './pantallas';

/**
 * The last screen the person was on before opening Ayuda (P-48, ADR-162 §8).
 *
 * «Algo no funciona» fills «¿En qué pantalla?» by itself, so the shell
 * remembers the last screen the menu names. Ayuda is not one, so walking from
 * Ventas y gastos into Ayuda and on to the form still says «Ventas y gastos».
 *
 * Kept in `sessionStorage`: per tab, gone when the tab closes, and only a
 * screen's own address (`/movimientos`), never a query string or a record's
 * id. Where storage is refused nothing is remembered and the form asks.
 */
const KEY = 'xg:ultima-pantalla';

function leer(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Mounted once in the portal shell: remembers each screen as the person reaches it. */
export function RecuerdaPantalla() {
  const pathname = usePathname();
  useEffect(() => {
    const pantalla = pantallaDeRuta(pathname);
    if (pantalla === null) return;
    try {
      window.sessionStorage.setItem(KEY, pantalla.href);
    } catch {
      // Storage refused (private mode, a full quota): the form will ask instead.
    }
  }, [pathname]);
  return null;
}

/** Storage does not change under an open form: nothing to subscribe to. */
const subscribe = () => () => undefined;
const enElServidor = () => null;

/** The screen the person came from; null on the server, and when none was remembered. */
export function useUltimaPantalla(): Pantalla | null {
  const href = useSyncExternalStore(subscribe, leer, enElServidor);
  return href === null ? null : pantallaPorHref(href);
}
