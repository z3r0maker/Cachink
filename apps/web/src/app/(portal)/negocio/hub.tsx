import Link from 'next/link';
import type { ReactNode } from 'react';

import * as h from './hub.css';

export type SeccionNegocio =
  | 'general'
  | 'comprobantes'
  | 'cobros'
  | 'funciones'
  | 'plan'
  | 'sincronizacion';

const SECCIONES: readonly {
  readonly id: SeccionNegocio;
  readonly label: string;
  readonly href: string;
}[] = [
  { id: 'general', label: 'General', href: '/negocio' },
  { id: 'comprobantes', label: 'Comprobantes', href: '/negocio/comprobantes' },
  { id: 'cobros', label: 'Cobros', href: '/negocio/cobros' },
  { id: 'funciones', label: 'Funciones', href: '/negocio/funciones' },
  { id: 'plan', label: 'Plan y pagos', href: '/suscripcion' },
  { id: 'sincronizacion', label: 'Sincronización', href: '/sincronizacion' },
];

/**
 * One home for every setting (CfgNegocio): owners couldn't find the ticket
 * settings, so each settings screen opens with this title and tab row.
 */
export function MiNegocioHead({
  activo,
  acciones,
}: {
  readonly activo: SeccionNegocio;
  /** Right of the title: the screen's own buttons («Editar», …). */
  readonly acciones?: ReactNode;
}) {
  return (
    <div className={h.head}>
      <div className={h.titulos}>
        <h1 className={h.titulo}>Mi negocio</h1>
        <span className={h.sub}>Los datos de tu changarro, tus comprobantes y tu plan</span>
        {acciones ? <div className={h.acciones}>{acciones}</div> : null}
      </div>
      <nav className={h.tabs} aria-label="Secciones de Mi negocio">
        {SECCIONES.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className={h.tab}
            aria-current={s.id === activo ? 'page' : undefined}
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
