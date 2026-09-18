'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Connection } from './types';

export interface Cola {
  readonly connection: Connection;
  /** Records captured here and not yet accepted by the server. */
  readonly pendientes: number;
  /** The queue went up: nothing waits and the register is evidently online. */
  readonly vaciada: () => void;
}

const ColaContext = createContext<Cola | null>(null);

/**
 * The register's send queue as the shell and Registros por enviar see it. One
 * state, so the header pill and the screen never disagree. The outbox flusher
 * (O-06) will drive it; until then it starts from the shell fixture.
 */
export function ColaProvider(p: {
  readonly connection: Connection;
  readonly pendientes: number;
  readonly children: ReactNode;
}) {
  const [vacia, setVacia] = useState(false);
  const value = useMemo<Cola>(
    () => ({
      connection: vacia ? 'en-linea' : p.connection,
      pendientes: vacia ? 0 : p.pendientes,
      vaciada: () => setVacia(true),
    }),
    [vacia, p.connection, p.pendientes],
  );
  return <ColaContext.Provider value={value}>{p.children}</ColaContext.Provider>;
}

export function useCola(): Cola {
  const c = useContext(ColaContext);
  if (!c) throw new Error('useCola outside the operator shell');
  return c;
}
