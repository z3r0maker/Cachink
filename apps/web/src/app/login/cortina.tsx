'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * How far the storefront's shutter is up — shared by the left panel, which
 * draws it, and the doors and the sign-in form on the right, which move it.
 *
 * The login's one piece of theatre: opening your business is raising the
 * cortina. It follows the form (a crack when the form opens, a third with a
 * plausible email, two thirds with a password, all the way while the server
 * checks) and drops back with a clunk on a refusal. It never carries
 * information the form does not also say in words.
 */
export type Etapa = 'cerrada' | 'asomo' | 'dueno' | 'correo' | 'lista' | 'abriendo' | 'error';

interface Cortina {
  readonly etapa: Etapa;
  /** Counts refusals, so a second wrong password clunks again. */
  readonly golpes: number;
  readonly set: (etapa: Etapa) => void;
}

const CortinaContext = createContext<Cortina>({ etapa: 'cerrada', golpes: 0, set: () => {} });

export function CortinaProvider({ children }: { readonly children: React.ReactNode }) {
  const [etapa, setEtapa] = useState<Etapa>('cerrada');
  const [golpes, setGolpes] = useState(0);
  const set = useCallback((next: Etapa) => {
    setEtapa(next);
    if (next === 'error') setGolpes((g) => g + 1);
  }, []);
  const value = useMemo(() => ({ etapa, golpes, set }), [etapa, golpes, set]);
  return <CortinaContext.Provider value={value}>{children}</CortinaContext.Provider>;
}

export function useCortina(): Cortina {
  return useContext(CortinaContext);
}
