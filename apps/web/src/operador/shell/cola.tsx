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

import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';

import { useFlusher } from './cola-flusher';

import type { Connection, Reintento } from '@xangarro/caja';

/** How long the fixture «send» takes, as in `Operador Pendientes.dc.html`. */
const ENVIO_MS = 1400;

export interface Cola {
  readonly connection: Connection;
  /** Records captured here and not yet accepted by the server (`unsentRows`). */
  readonly pendientes: number;
  /** Of those, the ones already tried once and retrying by themselves. */
  readonly reintentando: number;
  /** Refused for good: they wait for a person (DS-05's «con rechazos»). */
  readonly rechazados: number;
  /** The engine's own retry after a failed run: when, and why (DS-05). */
  readonly reintento: Reintento | null;
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

/** «Reintentar envío»: a manual full run, past the engine's own wait (never the server's, DS-05). */
let enviarYaAhora: (() => Promise<void>) | null = null;

export function enviarYa(): Promise<void> {
  return enviarYaAhora?.() ?? Promise.resolve();
}

/** The linked shell's full sync (push and pull), when mounted; the pill follows it. */
let refrescarAhora: (() => Promise<void>) | null = null;

/**
 * A background pull (DB3-CAJA-03): through the shell's flusher when it is
 * mounted, straight to the runtime at the door. Automatic, so the engine's
 * backoff holds; a failure waits for the next one.
 */
export function refrescar(): Promise<void> {
  if (refrescarAhora !== null) return refrescarAhora();
  const device = readDevice();
  if (device === null) return Promise.resolve();
  return registerRuntime()
    .sync(device.deviceToken, { mode: 'completa', manual: false })
    .then(
      () => undefined,
      () => undefined,
    );
}

/** The flusher, published for `desencolar` while a linked provider is mounted. */
function useLinkedQueue(linked: boolean): ReturnType<typeof useFlusher> {
  const real = useFlusher(linked);
  const { flush } = real;
  useEffect(() => {
    if (!linked) return;
    desencolarAhora = () => flush('captura', false);
    refrescarAhora = () => flush('completa', false);
    enviarYaAhora = () => flush('completa', true);
    return () => {
      desencolarAhora = null;
      refrescarAhora = null;
      enviarYaAhora = null;
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

/** A linked caja's queue: the outbox flusher's, never the fixture's count. */
function colaVinculada(real: ReturnType<typeof useFlusher>): Cola {
  const r = real.reales;
  return {
    connection: (r?.enLinea ?? navigator.onLine) ? 'en-linea' : 'sin-conexion',
    pendientes: r?.pendientes ?? 0,
    reintentando: r?.reintentando ?? 0,
    rechazados: r?.rechazados ?? 0,
    reintento: r?.reintento ?? null,
    enviando: real.enviando,
    enviar: () => void real.flush('completa', true),
  };
}

/** The design-file queue, before the browser is linked. */
function colaDiseno(
  fixture: ReturnType<typeof useFixtureQueue>,
  connection: Connection,
  pendientes: number,
): Cola {
  return {
    connection: fixture.vacia ? 'en-linea' : connection,
    pendientes: fixture.vacia ? 0 : pendientes,
    reintentando: 0,
    rechazados: 0,
    reintento: null,
    enviando: fixture.enviando,
    enviar: fixture.enviar,
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
    () => (linked ? colaVinculada(real) : colaDiseno(fixture, p.connection, p.pendientes)),
    [linked, real, fixture, p.connection, p.pendientes],
  );
  return <ColaContext.Provider value={value}>{p.children}</ColaContext.Provider>;
}

export function useCola(): Cola {
  const c = useContext(ColaContext);
  if (!c) throw new Error('useCola outside the operator shell');
  return c;
}
