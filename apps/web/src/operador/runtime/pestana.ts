/**
 * One tab owns the register (DB3-CAJA-01, ADR-121 §1). sql.js keeps the whole
 * database in memory and writes it back to one OPFS file after each write, so
 * two tabs are two copies, and the last to save erases the other's unsent
 * sales — outbox included. The Worker that opens the database first takes the
 * Web Lock `xangarro-register` and holds it for its lifetime; the browser
 * frees it when the tab (and so the Worker) goes away. A second tab gets
 * «ocupada» and never opens the file; «Usar esta pestaña» waits in the lock's
 * queue until the first tab closes.
 *
 * A browser without Web Locks (none of the caja's supported ones) keeps the
 * old behaviour: «sin-soporte», and the tab opens the register anyway.
 */

export const CANDADO_CAJA = 'xangarro-register';

/** What `boot` throws in a tab that does not own the register. */
export const EN_OTRA_PESTANA = 'CAJA_EN_OTRA_PESTANA';

export type Reclamo = 'propia' | 'ocupada' | 'sin-soporte';

/** The slice of `LockManager` the claim needs; tests pass a fake. */
export interface Candados {
  request(
    nombre: string,
    opciones: { readonly ifAvailable?: boolean },
    fn: (lock: unknown) => Promise<unknown> | unknown,
  ): Promise<unknown>;
}

/** Never settles: returned from the lock's callback, it holds the lock until the Worker dies. */
const PARA_SIEMPRE = new Promise<never>(() => undefined);

/**
 * Ask for the register once. `esperar: false` answers at once (`ifAvailable`);
 * `esperar: true` queues behind the tab that holds it.
 */
export function pedirCandado(locks: Candados | undefined, esperar: boolean): Promise<Reclamo> {
  if (locks === undefined) return Promise.resolve('sin-soporte');
  return new Promise<Reclamo>((resolve) => {
    locks
      .request(CANDADO_CAJA, esperar ? {} : { ifAvailable: true }, (lock) => {
        if (lock === null) {
          resolve('ocupada');
          return undefined;
        }
        resolve('propia');
        return PARA_SIEMPRE;
      })
      // A lock manager that refuses (a sandboxed frame) is as good as none.
      .catch(() => resolve('sin-soporte'));
  });
}

/**
 * The Worker's claim, memoised: once «propia» (or «sin-soporte») it stays so;
 * «ocupada» may be asked again, and a waiting claim is shared, never doubled.
 */
export function reclamador(locks: Candados | undefined): {
  readonly reclamar: (esperar: boolean) => Promise<Reclamo>;
  readonly puedeAbrir: () => boolean;
} {
  let estado: Reclamo | null = null;
  let enCurso: Promise<Reclamo> | null = null;
  const reclamar = async (esperar: boolean): Promise<Reclamo> => {
    if (estado === 'propia' || estado === 'sin-soporte') return estado;
    enCurso ??= pedirCandado(locks, esperar).finally(() => {
      enCurso = null;
    });
    estado = await enCurso;
    return estado;
  };
  return { reclamar, puedeAbrir: () => estado === 'propia' || estado === 'sin-soporte' };
}

/** The fallback's channel: a tab asks «¿hay alguien?», an open register answers. */
const CANAL = CANDADO_CAJA;
const HOLA = 'hola';
const AQUI = 'aqui';

/** Without Web Locks: is another tab's register already open? Asks and listens `ms`. */
export function hayOtraPestana(ms = 300): Promise<boolean> {
  if (typeof BroadcastChannel === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const canal = new BroadcastChannel(CANAL);
    const fin = (hay: boolean): void => {
      clearTimeout(t);
      canal.close();
      resolve(hay);
    };
    const t = setTimeout(() => fin(false), ms);
    canal.onmessage = (e: MessageEvent) => {
      if (e.data === AQUI) fin(true);
    };
    canal.postMessage(HOLA);
  });
}

/** Without Web Locks: the open register answers every newcomer; returns the stop. */
export function responderPresencia(): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => undefined;
  const canal = new BroadcastChannel(CANAL);
  canal.onmessage = (e: MessageEvent) => {
    if (e.data === HOLA) canal.postMessage(AQUI);
  };
  return () => canal.close();
}
