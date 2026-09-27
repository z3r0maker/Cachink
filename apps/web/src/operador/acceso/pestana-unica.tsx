'use client';

/**
 * One tab owns the register (DB3-CAJA-01, DS-08 minimal). Before anything
 * opens the database, the tab's Worker asks for the register's Web Lock; the
 * tab that gets it is the caja. A second tab never opens the file: it shows
 * «La caja ya está abierta en otra pestaña.», and «Usar esta pestaña» waits
 * in the lock's queue until the first tab closes. Without Web Locks the tabs
 * ask each other over a BroadcastChannel instead — a warning, not a lock.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { Continuar } from './boton';
import { Marco } from './marco';
import * as a from './acceso.css';
import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';
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

function usePestana() {
  const [estado, setEstado] = useState<Estado>('decidiendo');
  const [sinCandado, setSinCandado] = useState(false);
  const [sigue, setSigue] = useState(false);
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
  }, []);
  useEffect(
    () => (estado === 'propia' && sinCandado ? responderPresencia() : undefined),
    [estado, sinCandado],
  );
  const usarEsta = useCallback(() => {
    setEstado('esperando');
    void tomar(sinCandado)
      .catch(() => 'ocupada' as const)
      .then((e) => {
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

function OtraPestana(p: {
  readonly esperando: boolean;
  readonly sigue: boolean;
  readonly onUsar: () => void;
}): ReactNode {
  return (
    <Marco
      pose="preocupado"
      mensaje={null}
      chip="Esta pestaña"
      chipSub="en espera"
      vinculada={readDevice() !== null}
    >
      <div className={a.heading} data-testid="otra-pestana">
        <h1 className={a.titulo}>La caja ya está abierta en otra pestaña.</h1>
        <p className={a.lead}>Para no perder ventas, usa una sola pestaña.</p>
      </div>
      <Continuar listo ocupado={p.esperando} testId="usar-esta-pestana" onClick={p.onUsar}>
        Usar esta pestaña
      </Continuar>
      {p.esperando ? (
        <p className={a.lead} role="status">
          Esperando a que se cierre la otra pestaña…
        </p>
      ) : null}
      {p.sigue ? (
        <p className={a.fallo} role="alert">
          La otra pestaña sigue abierta. Ciérrala y vuelve a intentar.
        </p>
      ) : null}
    </Marco>
  );
}
