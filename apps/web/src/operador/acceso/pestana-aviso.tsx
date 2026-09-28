'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { Icon } from '../../shell/icon';
import { Continuar } from './boton';
import { Marco } from './marco';
import * as a from './acceso.css';
import * as p from './pestana.css';
import { readDevice } from '../runtime/device-store';

const AVISO = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8v4M12 16h.01';

/** «JUEVES 14 DE MAYO», read after mount: the server and the counter can sit in different zones. */
function Fecha(): ReactNode {
  const [hoy, setHoy] = useState('');
  useEffect(() => {
    const f = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    setHoy(f.format(new Date()));
  }, []);
  return <span className={a.eyebrow}>{hoy}</span>;
}

function DosPestanas(): ReactNode {
  return (
    <div className={p.pestanas} aria-hidden="true">
      <span className={p.pestanaCaja}>
        <span className={p.punto} />
        Caja 1
      </span>
      <span className={p.pestanaEsta}>Caja 1 (esta)</span>
    </div>
  );
}

/** The live region under the button: waiting in the lock's queue, or still open. */
function Estado(p2: { readonly esperando: boolean; readonly sigue: boolean }): ReactNode {
  return (
    <div id="pes-estado" role="status" aria-live="polite">
      {p2.esperando ? (
        <span className={p.esperando}>Esperando a que se cierre la otra pestaña…</span>
      ) : null}
      {p2.sigue && !p2.esperando ? (
        <p className={p.sigue}>
          <span className={p.sigueIcono} aria-hidden="true">
            <Icon path={AVISO} size={20} strokeWidth={2.2} />
          </span>
          La otra pestaña sigue abierta. Ciérrala y vuelve a intentar.
        </p>
      ) : null}
    </div>
  );
}

/**
 * The caja already open in another tab (DS-08, EsCajaPestana): Don worried,
 * the notice as his words, the rule, and «Usar esta pestaña». No «Cerrar esta
 * pestaña»: a script can only close a tab it opened.
 */
export function OtraPestana(x: {
  readonly esperando: boolean;
  readonly sigue: boolean;
  readonly onUsar: () => void;
}): ReactNode {
  return (
    <Marco
      pose="preocupado"
      mensaje="La caja ya está abierta en otra pestaña."
      mensajeTitulo
      chip="Esta pestaña"
      chipSub="en espera"
      vinculada={readDevice() !== null}
    >
      <div className={p.encabezado} data-testid="otra-pestana">
        <Fecha />
        <DosPestanas />
        <p className={p.regla}>Para no perder ventas, usa una sola pestaña.</p>
      </div>
      <div className={p.acciones}>
        <Continuar
          listo
          ocupado={x.esperando}
          testId="usar-esta-pestana"
          describedBy="pes-estado"
          onClick={x.onUsar}
        >
          Usar esta pestaña
        </Continuar>
        <Estado esperando={x.esperando} sigue={x.sigue} />
      </div>
    </Marco>
  );
}
