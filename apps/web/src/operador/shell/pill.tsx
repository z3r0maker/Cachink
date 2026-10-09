'use client';

import Link from 'next/link';

import { Icon } from '../../shell/icon';
import { useCola } from './cola';
import * as p from './pill.css';
import { useAhora } from './use-ahora';
import { OPERADOR_BASE, pillEnvio, type EstadoPill } from '@xangarro/caja';

const CHECK = 'M20 6 9 17l-5-5';
const REFRESH =
  'M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 16h5v5';
const CLOCK = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2';
const WIFI_OFF =
  'M12 20h.01M8.5 16.429a5 5 0 0 1 7 0M5 12.859a10 10 0 0 1 5.17-2.69M19 12.859a10 10 0 0 0-2.007-1.523M2 8.82a15 15 0 0 1 4.177-2.643M22 8.82a15 15 0 0 0-11.288-3.764M2 2l20 20';
const ALERT = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8v4M12 16h.01';

const GLIFO: Readonly<Record<EstadoPill, string>> = {
  'en-linea': CHECK,
  enviando: REFRESH,
  reintentando: CLOCK,
  'por-enviar': REFRESH,
  'sin-conexion': WIFI_OFF,
  'con-rechazos': ALERT,
};

/** The pill's words and state from the shared queue, the countdown kept moving. */
function usePill() {
  const cola = useCola();
  const reintentando = cola.reintento !== null && cola.pendientes > 0;
  const ahora = useAhora(reintentando);
  return pillEnvio({
    enLinea: cola.connection === 'en-linea',
    enviando: cola.enviando,
    pendientes: cola.pendientes,
    rechazados: cola.rechazados,
    reintento: cola.reintento,
    ahora,
  });
}

/**
 * The header's send state (DS-05, EsCajaReintentando): en línea, enviando,
 * reintentando with its countdown, sin conexión, con rechazos. On main
 * screens it opens Registros por enviar; on Pendientes and Cierre it stands.
 */
export function SyncPill({ asLink }: { readonly asLink: boolean }) {
  const pill = usePill();
  const body = (
    <>
      <span className={pill.estado === 'enviando' ? p.gira : undefined} aria-hidden="true">
        <Icon path={GLIFO[pill.estado]} size={16} strokeWidth={2.4} />
      </span>
      <span className={p.larga}>{pill.etiqueta}</span>
      <span className={p.corta}>{pill.corta}</span>
    </>
  );
  const clase = `${asLink ? p.enlace : p.fija} ${p.estado[pill.estado]}`;
  if (!asLink) {
    return (
      <div className={clase} role="status" aria-label={pill.aria} data-estado={pill.estado}>
        {body}
      </div>
    );
  }
  return (
    <Link
      href={`${OPERADOR_BASE}/pendientes`}
      className={clase}
      title="Ver registros pendientes"
      aria-label={pill.aria}
      data-estado={pill.estado}
    >
      {body}
    </Link>
  );
}
