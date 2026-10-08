'use client';

/**
 * One tab owns the register (DB3-CAJA-01, DS-08 minimal). Before anything
 * opens the database, the tab's Worker asks for the register's Web Lock; the
 * tab that gets it is the caja. A second tab never opens the file: it shows
 * «La caja ya está abierta en otra pestaña.», and «Usar esta pestaña» waits
 * in the lock's queue until the first tab closes; if it has not closed after a
 * few seconds, «La otra pestaña sigue abierta» says so while the claim stays
 * queued (EsCajaPestana: aviso, esperando, sigue). Without Web Locks the tabs
 * ask each other over a BroadcastChannel instead — a warning, not a lock.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { OtraPestana } from './pestana-aviso';
import { registerRuntime } from '../runtime/client';
import { hayOtraPestana, responderPresencia } from '../runtime/pestana';

type Estado = 'decidiendo' | 'propia' | 'ocupada' | 'esperando';
type Decision = { readonly estado: 'propia' | 'ocupada'; readonly sinCandado: boolean };

async function decidir(): Promise<Decision> {
  const r = await registerRuntime().reclamar(false);
  if (r !== 'sin-soporte') return { estado: r, sinCandado: false };
  return { estado: (await hayOtraPestana()) ? 'ocupada' : 'propia', sinCandado: true };
}

/** «Usar esta pestaña»: the lock's queue, or (without locks) one more look. */
async function tomar(sinCandado: boolean): Promise<'propia' | 'ocupada'> {
  if (sinCandado) return (await hayOtraPestana()) ? 'ocupada' : 'propia';
  return (await registerRuntime().reclamar(true)) === 'ocupada' ? 'ocupada' : 'propia';
}

/** How long «Esperando a que se cierre la otra pestaña…» shows before «sigue abierta». */
const SIGUE_MS = 3_000;

function useDecision(setEstado: (e: Estado) => void, setSinCandado: (b: boolean) => void): void {
  useEffect(() => {
    let vivo = true;
    decidir()
      .then((d) => {
        if (!vivo) return;
        setSinCandado(d.sinCandado);
        setEstado(d.estado);
      })
      // A Worker that cannot start at all: the door behind shows its own error.
      .catch(() => vivo && setEstado('propia'));
    return () => {
      vivo = false;
    };
  }, [setEstado, setSinCandado]);
}

function usePestana() {
  const [estado, setEstado] = useState<Estado>('decidiendo');
  const [sinCandado, setSinCandado] = useState(false);
  const [sigue, setSigue] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  useDecision(setEstado, setSinCandado);
  useEffect(
    () => (estado === 'propia' && sinCandado ? responderPresencia() : undefined),
    [estado, sinCandado],
  );
  useEffect(() => () => (espera.current ? clearTimeout(espera.current) : undefined), []);
  const usarEsta = useCallback(() => {
    setEstado('esperando');
    setSigue(false);
    if (espera.current) clearTimeout(espera.current);
    // The claim stays queued; after a while the screen says the other tab is still open.
    espera.current = setTimeout(() => {
      setSigue(true);
      setEstado((e) => (e === 'esperando' ? 'ocupada' : e));
    }, SIGUE_MS);
    void tomar(sinCandado)
      .catch(() => 'ocupada' as const)
      .then((e) => {
        if (e === 'propia' && espera.current) clearTimeout(espera.current);
        setSigue(e === 'ocupada');
        setEstado(e);
      });
  }, [sinCandado]);
  return { estado, sigue, usarEsta };
}

export function PestanaUnica(p: { readonly children: ReactNode }): ReactNode {
  const t = usePestana();
  if (t.estado === 'decidiendo') return null;
  if (t.estado === 'propia') return p.children;
  return <OtraPestana esperando={t.estado === 'esperando'} sigue={t.sigue} onUsar={t.usarEsta} />;
}
