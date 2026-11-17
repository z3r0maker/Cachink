import type { Route } from 'next';
import Link from 'next/link';

import type { cuadreDe } from '@/server/empresa/balance-cuadre-view';
import * as b from '@/styles/mostrador-balance.css';
import * as m from '@/styles/mostrador.css';

function Icono({ cuadra }: { readonly cuadra: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {cuadra ? (
        <polyline points="20 6 9 17 4 12" />
      ) : (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      )}
    </svg>
  );
}

/**
 * «Activo = Pasivo + Capital» (E-12, board CD-08): the sheet's own check, the
 * page's one hero. When it does not balance it says by how much and why, and
 * the figures under it are not to be trusted.
 */
export function Cuadre({ c }: { readonly c: ReturnType<typeof cuadreDe> }) {
  const tono = c.cuadra ? 'cuadra' : 'roto';
  return (
    <section
      className={`${m.hero} ${b.cuadre[tono]} ${b.cuadreCuerpo}`}
      aria-labelledby="cuadre"
      data-testid="balance-cuadre"
    >
      <div className={b.cuadreTexto}>
        <span className={m.eyebrow}>Activo = Pasivo + Capital</span>
        <h2 id="cuadre" className={b.cuadreTitulo}>
          {c.titulo}
        </h2>
        <p className={m.sub}>{c.texto}</p>
      </div>
      <span className={b.estado[tono]}>
        <Icono cuadra={c.cuadra} />
        {c.cuadra ? 'Cuadra' : 'No cuadra'}
      </span>
    </section>
  );
}

/** No movement up to the day: the first one is usually the partners' capital. */
export function SinMovimientos({ dia }: { readonly dia: string }) {
  return (
    <section className={`${m.hero} ${b.cuadreCuerpo}`} aria-labelledby="vacio">
      <div className={b.cuadreTexto}>
        <span className={m.eyebrow}>Balance</span>
        <h2 id="vacio" className={b.cuadreTitulo}>
          Aún no hay movimientos al {dia}
        </h2>
        <p className={m.sub}>
          El balance sale de los movimientos registrados. El primero suele ser la aportación de
          capital de los socios.
        </p>
      </div>
      <Link
        className={m.boton.primario}
        href={'/empresa/movimientos/registrar?tipo=socios' as Route}
      >
        Registrar el capital
      </Link>
    </section>
  );
}
