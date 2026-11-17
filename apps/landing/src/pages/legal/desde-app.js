/**
 * Whether a legal page was reached from the phone (X-05, board TrLegal). The
 * app opens the aviso and the terms with `?desde=app`; those visits drop the
 * header's link to the home page, which shows plans and prices (3.1.1(a),
 * Play's Payments policy). The mark is kept for the tab, so a link from the
 * terms to the aviso, or from the aviso to ARCO, stays marked too.
 */

export const PARAMETRO = 'desde';
export const VALOR = 'app';
const CLAVE = 'xangarro.desde-app';

/**
 * True when the URL carries the mark, or an earlier page in this tab did.
 * `storage` is the tab's sessionStorage, or null when the browser refuses it.
 */
export function vieneDeLaApp(search, storage) {
  const marcada = new URLSearchParams(search).get(PARAMETRO) === VALOR;
  try {
    if (marcada) storage?.setItem(CLAVE, '1');
    return marcada || storage?.getItem(CLAVE) === '1';
  } catch {
    return marcada;
  }
}

/** The tab's sessionStorage, or null in a private window or with storage blocked. */
export function almacenDeLaPestana() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
