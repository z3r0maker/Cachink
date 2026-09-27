'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { readDevice } from '../runtime/device-store';

import { useFlusher } from './cola-flusher';

import type { Connection } from './types';

/** How long the fixture «send» takes, as in `Operador Pendientes.dc.html`. */
const ENVIO_MS = 1400;

export interface Cola {
  readonly connection: Connection;
  /** Records captured here and not yet accepted by the server (`unsentRows`). */
  readonly pendientes: number;
  /** Of those, the ones already tried once and retrying by themselves. */
  readonly reintentando: number;
  readonly enviando: boolean;
  /** «Reintentar envío», from Registros por enviar or the close's banner. */
  readonly enviar: () => void;
}

const ColaContext = createContext<Cola | null>(null);

/** The linked queue's flush, when a provider mounted; the capture path calls
 *  it after recording a sale, gasto, abono or cierre, so an online register
 *  uploads at once. It pushes; it pulls at most every 45 s (DB2-DEV-02). */
let desencolarAhora: (() => Promise<void>) | null = null;

export function desencolar(): Promise<void> {
  return desencolarAhora?.() ?? Promise.resolve();
}

/** The flusher, published for `desencolar` while a linked provider is mounted. */
function useLinkedQueue(linked: boolean): ReturnType<typeof useFlusher> {
  const real = useFlusher(linked);
  const { flush } = real;
  useEffect(() => {
    if (!linked) return;
    desencolarAhora = () => flush('captura', false);
    return () => {
      desencolarAhora = null;
    };
  }, [linked, flush]);
  return real;
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
 * flusher drives it — never the fixture's count, not even before the first
 * read (DB3-CAJA-02); not linked yet: the fixture, until O-12's linking screen.
 */
export function ColaProvider(p: {
  readonly connection: Connection;
  readonly pendientes: number;
  readonly children: ReactNode;
}) {
  const linked = readDevice() !== null;
  const real = useLinkedQueue(linked);
  const fixture = useFixtureQueue();
  const value = useMemo<Cola>(
    () =>
      linked
        ? {
            connection: (real.reales?.enLinea ?? navigator.onLine) ? 'en-linea' : 'sin-conexion',
            pendientes: real.reales?.pendientes ?? 0,
            reintentando: real.reales?.reintentando ?? 0,
            enviando: real.enviando,
            enviar: () => void real.flush('completa', true),
          }
        : {
            connection: fixture.vacia ? 'en-linea' : p.connection,
            pendientes: fixture.vacia ? 0 : p.pendientes,
            reintentando: 0,
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
