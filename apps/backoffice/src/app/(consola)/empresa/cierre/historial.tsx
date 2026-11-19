import type { Route } from 'next';
import Link from 'next/link';

import type { MesHistorial } from '@/server/empresa/cierre-historial';
import * as k from '@/styles/mostrador-cierre.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

/** «Meses de <año>» (board CD-10): each month's state and its history in one line. */
export function Historial({
  anio,
  meses,
}: {
  readonly anio: string;
  readonly meses: readonly MesHistorial[];
}) {
  if (meses.length === 0) return null;
  return (
    <section className={m.panelPad} aria-labelledby="cierre-historial">
      <h2 id="cierre-historial" className={i.pasoTitulo}>
        {`Meses de ${anio}`}
      </h2>
      {meses.map((h) => (
        <Link
          key={h.mes}
          className={k.mesFila}
          href={h.href as Route}
          data-testid="cierre-historial"
        >
          <span className={i.pasoTitulo}>{h.nombre}</span>
          <span className={i.pasoSub}>{h.detalle}</span>
          <span
            className={`${m.tagBase} ${h.estado === 'Cerrado' ? k.chipCerrado : h.estado === 'Reabrir pedido' ? i.tono.warn : m.tag.off}`}
          >
            {h.estado}
          </span>
        </Link>
      ))}
    </section>
  );
}
