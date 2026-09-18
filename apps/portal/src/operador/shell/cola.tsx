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

/**
 * The register's send queue as every screen sees it. One state, so the header
 * pill, Registros por enviar and Cierre never disagree. The outbox flusher
 * (O-06) will drive it; until then a retry succeeds after the file's 1.4 s.
 */
export function ColaProvider(p: {
  readonly connection: Connection;
  readonly pendientes: number;
  readonly children: ReactNode;
}) {
  const [vacia, setVacia] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);
  const value = useMemo<Cola>(
    () => ({
      connection: vacia ? 'en-linea' : p.connection,
      pendientes: vacia ? 0 : p.pendientes,
      enviando,
      enviar: () => {
        if (enviando) return;
        setEnviando(true);
        timer.current = setTimeout(() => {
          setEnviando(false);
          setVacia(true);
        }, ENVIO_MS);
      },
    }),
    [vacia, enviando, p.connection, p.pendientes],
  );
  return <ColaContext.Provider value={value}>{p.children}</ColaContext.Provider>;
}

export function useCola(): Cola {
  const c = useContext(ColaContext);
  if (!c) throw new Error('useCola outside the operator shell');
  return c;
}
