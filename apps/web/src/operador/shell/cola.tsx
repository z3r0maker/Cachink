'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { readDevice } from '../runtime/device-store';
import { registerRuntime } from '../runtime/client';

import type { Connection } from './types';

/** How long the fixture «send» takes, as in `Operador Pendientes.dc.html`. */
const ENVIO_MS = 1400;

export interface Cola {
  readonly connection: Connection;
  /** Records captured here and not yet accepted by the server. */
  readonly pendientes: number;
  readonly enviando: boolean;
  /** «Reintentar envío», from Registros por enviar or the close's banner. */
  readonly enviar: () => void;
}

const ColaContext = createContext<Cola | null>(null);

/** The linked register's queue (O-06): the Worker's SyncEngine and the wire. */
function useFlusher(linked: boolean): {
  readonly reales: { pendientes: number; enLinea: boolean } | null;
  readonly enviando: boolean;
  readonly flush: () => Promise<void>;
} {
  const [reales, setReales] = useState<{ pendientes: number; enLinea: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const flush = useCallback(async (): Promise<void> => {
    const credentials = readDevice();
    if (credentials === null) return;
    setEnviando(true);
    try {
      await registerRuntime().sync(credentials.deviceToken);
      const counts = await registerRuntime().counts();
      setReales({ pendientes: counts.pending, enLinea: navigator.onLine });
    } catch {
      setReales({ pendientes: -1, enLinea: navigator.onLine });
    } finally {
      setEnviando(false);
    }
  }, []);

  // Online/offline moves the pill; coming back online flushes what queued.
  useEffect(() => {
    if (!linked) return;
    const mark = (enLinea: boolean): void =>
      setReales((r) => ({ pendientes: r?.pendientes ?? -1, enLinea }));
    const onLine = (): void => {
      mark(true);
      void flush();
    };
    const offline = (): void => mark(false);
    addEventListener('online', onLine);
    addEventListener('offline', offline);
    return () => {
      removeEventListener('online', onLine);
      removeEventListener('offline', offline);
    };
  }, [linked, flush]);

  return { reales, enviando, flush };
}

/** The design-file queue: a retry succeeds after the file's 1.4 s. */
function useFixtureQueue(): {
  readonly vacia: boolean;
  readonly enviando: boolean;
  readonly enviar: () => void;
} {
  const [vacia, setVacia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);
  return {
    vacia,
    enviando,
    enviar: () => {
      if (enviando) return;
      setEnviando(true);
      timer.current = setTimeout(() => {
        setEnviando(false);
        setVacia(true);
      }, ENVIO_MS);
    },
  };
}

/**
 * The register's send queue as every screen sees it. One state, so the header
 * pill, Registros por enviar and Cierre never disagree. Linked: the outbox
 * flusher drives it; not linked yet: the fixture, until O-12's linking screen.
 */
export function ColaProvider(p: {
  readonly connection: Connection;
  readonly pendientes: number;
  readonly children: ReactNode;
}) {
  const linked = readDevice() !== null;
  const real = useFlusher(linked);
  const fixture = useFixtureQueue();
  const value = useMemo<Cola>(
    () =>
      linked && real.reales !== null
        ? {
            connection: real.reales.enLinea ? 'en-linea' : 'sin-conexion',
            pendientes: real.reales.pendientes < 0 ? p.pendientes : real.reales.pendientes,
            enviando: real.enviando,
            enviar: () => void real.flush(),
          }
        : {
            connection: fixture.vacia ? 'en-linea' : p.connection,
            pendientes: fixture.vacia ? 0 : p.pendientes,
            enviando: fixture.enviando,
            enviar: fixture.enviar,
          },
    [linked, real, fixture, p.connection, p.pendientes],
  );
  return <ColaContext.Provider value={value}>{p.children}</ColaContext.Provider>;
}

export function useCola(): Cola {
  const c = useContext(ColaContext);
  if (!c) throw new Error('useCola outside the operator shell');
  return c;
}
