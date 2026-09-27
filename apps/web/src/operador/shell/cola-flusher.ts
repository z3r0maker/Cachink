'use client';

/**
 * The linked register's queue flusher (O-06): the Worker's SyncEngine and the
 * wire, scheduled so a busy caja is a good citizen at the evening peak
 * (DB2-DEV-02):
 *
 *   - after a capture   → `captura`: push now, pull at most every 45 s;
 *   - «Reintentar envío» → `completa`, manual (skips the engine's backoff);
 *   - back online        → `completa`, manual, after 0–3 s of jitter so a
 *                          shop's registers do not reconnect in the same instant;
 *   - after a failure    → one retry when the engine's backoff ends (`retryAt`).
 *
 * The counts are the queue as Registros por enviar lists it (`colaPendiente`,
 * one definition with the phone: DB3-CAJA-02). A count that cannot be read
 * keeps the last one instead of inventing a number.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import type { PendienteCrudo } from '../runtime/cola-shapes';
import type { SyncMode } from '../runtime/protocol';

/** The upper bound of the random wait before flushing on `online`. */
const ONLINE_JITTER_MS = 3_000;

export interface Reales {
  readonly pendientes: number;
  readonly reintentando: number;
  readonly enLinea: boolean;
}

/** The queue's two numbers: every unsent record, and those already retrying. */
export function contarCola(cola: readonly PendienteCrudo[]): Omit<Reales, 'enLinea'> {
  return { pendientes: cola.length, reintentando: cola.filter((p) => p.reintento === true).length };
}

async function leerCola(): Promise<Omit<Reales, 'enLinea'>> {
  return contarCola(await registerRuntime().colaPendiente());
}

export type Flush = (mode: SyncMode, manual: boolean) => Promise<void>;

type Timer = ReturnType<typeof setTimeout>;

function useTimer(): {
  readonly set: (fn: () => void, ms: number) => void;
  readonly clear: () => void;
} {
  const ref = useRef<Timer | null>(null);
  const clear = useCallback(() => {
    if (ref.current !== null) clearTimeout(ref.current);
    ref.current = null;
  }, []);
  const set = useCallback(
    (fn: () => void, ms: number) => {
      clear();
      ref.current = setTimeout(
        () => {
          ref.current = null;
          fn();
        },
        Math.max(0, ms),
      );
    },
    [clear],
  );
  useEffect(() => clear, [clear]);
  return useMemo(() => ({ set, clear }), [set, clear]);
}

export function useFlusher(linked: boolean): {
  readonly reales: Reales | null;
  readonly enviando: boolean;
  readonly flush: Flush;
} {
  const [reales, setReales] = useState<Reales | null>(null);
  const [enviando, setEnviando] = useState(false);
  const enCurso = useRef(0);
  const reintento = useTimer();

  const flush = useCallback<Flush>(
    async (mode, manual) => {
      const credentials = readDevice();
      if (credentials === null) return;
      enCurso.current += 1;
      setEnviando(true);
      try {
        const result = await registerRuntime().sync(credentials.deviceToken, { mode, manual });
        if (result.retryAt)
          reintento.set(
            () => void flush('captura', false),
            Date.parse(result.retryAt) - Date.now(),
          );
        else reintento.clear();
        // The queue as Registros por enviar lists it: everything not yet
        // accepted, including what was captured and never tried (O-27).
        setReales({ ...(await leerCola()), enLinea: navigator.onLine });
      } catch {
        setReales((r) => ({ pendientes: 0, reintentando: 0, ...r, enLinea: navigator.onLine }));
      } finally {
        enCurso.current -= 1;
        setEnviando(enCurso.current > 0);
      }
    },
    [reintento],
  );

  useConexion(linked, flush, setReales);
  useCuentaInicial(linked, setReales);
  return { reales, enviando, flush };
}

/** A linked caja's pill starts from its real queue, never the fixture's count. */
function useCuentaInicial(
  linked: boolean,
  setReales: (fn: (r: Reales | null) => Reales) => void,
): void {
  useEffect(() => {
    if (!linked) return;
    void leerCola()
      .then((c) => setReales((r) => r ?? { ...c, enLinea: navigator.onLine }))
      .catch(() => undefined);
  }, [linked, setReales]);
}

/** Online/offline moves the pill; coming back online flushes what queued. */
function useConexion(
  linked: boolean,
  flush: Flush,
  setReales: (fn: (r: Reales | null) => Reales) => void,
): void {
  const espera = useTimer();
  useEffect(() => {
    if (!linked) return;
    const mark = (enLinea: boolean): void =>
      setReales((r) => ({ pendientes: 0, reintentando: 0, ...r, enLinea }));
    const onLine = (): void => {
      mark(true);
      espera.set(() => void flush('completa', true), Math.random() * ONLINE_JITTER_MS);
    };
    const offline = (): void => {
      mark(false);
      espera.clear();
    };
    addEventListener('online', onLine);
    addEventListener('offline', offline);
    return () => {
      removeEventListener('online', onLine);
      removeEventListener('offline', offline);
    };
  }, [linked, flush, setReales, espera]);
}
