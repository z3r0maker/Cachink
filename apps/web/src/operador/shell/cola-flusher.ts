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
 *   - after a failure    → one retry when the engine's backoff ends (`retryAt`);
 *   - an idle caja       → `refrescar()` (shell/cola) on boot, in view and every
 *                          5 min, scheduled at the gate (DB3-CAJA-03).
 *
 * The counts are the queue as Registros por enviar lists it (`colaPendiente`,
 * one definition with the phone: DB3-CAJA-02). A count that cannot be read
 * keeps the last one instead of inventing a number.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
import { leerFallo, type Reintento } from '@xangarro/caja';
import type { PendienteCrudo } from '@xangarro/caja/lectura';
import type { SyncRunResult } from '@xangarro/sync';
import type { SyncMode } from '../runtime/protocol';

/** The upper bound of the random wait before flushing on `online`. */
const ONLINE_JITTER_MS = 3_000;

export interface Reales {
  readonly pendientes: number;
  readonly reintentando: number;
  /** Refused for good (the pill's «con rechazos», DS-05). */
  readonly rechazados: number;
  readonly enLinea: boolean;
  /** When the engine goes again by itself and why, after a failed run (DS-05). */
  readonly reintento: Reintento | null;
}

type Cuenta = Pick<Reales, 'pendientes' | 'reintentando' | 'rechazados'>;

const VACIA: Omit<Reales, 'enLinea'> = {
  pendientes: 0,
  reintentando: 0,
  rechazados: 0,
  reintento: null,
};

/** The queue's two numbers: every unsent record, and those already retrying. */
export function contarCola(
  cola: readonly PendienteCrudo[],
): Pick<Reales, 'pendientes' | 'reintentando'> {
  return { pendientes: cola.length, reintentando: cola.filter((p) => p.reintento === true).length };
}

async function leerCola(): Promise<Cuenta> {
  const runtime = registerRuntime();
  const [cola, counts] = await Promise.all([
    runtime.colaPendiente(),
    runtime.counts().catch(() => null),
  ]);
  return { ...contarCola(cola), rechazados: counts?.rejected ?? 0 };
}

/** A run's failure as the pill reads it: offline, or when and why it retries. */
function lecturaDe(result: SyncRunResult): ReturnType<typeof leerFallo> {
  const error = result.push?.error ?? result.pull?.error ?? null;
  return leerFallo({ retryAt: result.retryAt ?? null, error });
}

/**
 * After a run: the queue as Registros por enviar lists it — everything not
 * yet accepted, including what was captured and never tried (O-27) — and
 * whether the engine now waits, when and why (DS-05).
 */
async function trasEnvio(result: SyncRunResult): Promise<Reales> {
  const fallo = lecturaDe(result);
  return {
    ...(await leerCola()),
    enLinea: navigator.onLine && !fallo.sinRed,
    reintento: fallo.reintento,
  };
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
        setReales(await trasEnvio(result));
      } catch {
        setReales((r) => ({ ...VACIA, ...r, enLinea: navigator.onLine }));
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
      .then((c) => setReales((r) => r ?? { ...c, reintento: null, enLinea: navigator.onLine }))
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
    const mark = (enLinea: boolean): void => setReales((r) => ({ ...VACIA, ...r, enLinea }));
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
