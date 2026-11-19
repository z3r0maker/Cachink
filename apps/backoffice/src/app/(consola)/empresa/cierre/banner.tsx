import type { Route } from 'next';
import Link from 'next/link';

import type { Pedido } from '@/server/empresa/cierre-encabezado';
import { hrefCierre } from '@/server/empresa/cierre-view';
import { nombreMes } from '@/server/empresa/fechas';
import * as k from '@/styles/mostrador-cierre.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { RechazarForm } from './acciones';

/**
 * A pending request to reopen (board CD-10, «Reabrir pedido»): the other
 * founder reviews and approves it, or rejects it; whoever asked waits.
 */
export function Banner({ mes, pedido }: { readonly mes: string; readonly pedido: Pedido }) {
  const nombre = nombreMes(mes);
  return (
    <div className={k.banner} role="status" data-testid="cierre-pedido">
      <span className={k.bannerTexto}>
        <span className={i.pasoTitulo}>
          {pedido.mio ? `Pediste reabrir ${nombre}` : `${pedido.quien} pidió reabrir ${nombre}`}
        </span>
        <span className={i.muted}>
          {`«${pedido.motivo}» Pedido el ${pedido.cuando}. `}
          {pedido.mio
            ? 'Lo tiene que aprobar el otro socio; mientras, sigue cerrado.'
            : `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} sigue cerrado hasta que lo apruebes.`}
        </span>
      </span>
      {pedido.mio ? null : (
        <span className={m.row}>
          <Link className={m.boton.primario} href={hrefCierre(mes, 'aprobar') as Route}>
            Revisar y aprobar
          </Link>
          <RechazarForm mes={mes} />
        </span>
      )}
    </div>
  );
}
