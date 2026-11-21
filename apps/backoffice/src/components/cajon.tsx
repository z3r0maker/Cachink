'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import * as c from '@/styles/mostrador-limites.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as m from '@/styles/mostrador.css';

/** Closes the dialog it sits in: a `method="dialog"` form needs no script. */
function Cerrar() {
  return (
    <form method="dialog">
      <button className={c.cerrar} type="submit" aria-label="Cerrar">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </form>
  );
}

/**
 * A drawer over the page (board CD-12d): a modal `<dialog>`, so focus stays
 * inside, Esc closes it and the page behind is inert. Its URL is the page's
 * with a parameter; closing goes back to the page's own. It slides in from
 * the right and its content enters once it has arrived (ADR-161 «Panel»).
 */
export function Cajon(props: {
  readonly eyebrow: string;
  readonly titulo: string;
  readonly sub?: string;
  readonly cerrar: string;
  /** «amplio» for a table read across, as board CD-10d's. */
  readonly ancho?: 'normal' | 'amplio';
  readonly children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    const d = ref.current;
    if (d !== null && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${props.ancho === 'amplio' ? c.cajonAmplio : c.cajon} ${mv.cajon}`}
      aria-labelledby="cajon-titulo"
      onClose={() => router.replace(props.cerrar as Route, { scroll: false })}
    >
      <div className={`${c.cuerpo} ${mv.panel}`}>
        <div className={c.cabeza}>
          <div>
            <span className={m.eyebrow}>{props.eyebrow}</span>
            <h2 id="cajon-titulo" className={c.titulo}>
              {props.titulo}
            </h2>
            {props.sub === undefined ? null : <p className={m.sub}>{props.sub}</p>}
          </div>
          <Cerrar />
        </div>
        {props.children}
      </div>
    </dialog>
  );
}
