import type { Route } from 'next';
import Link from 'next/link';

import type { Hero, Tarjeta } from '@/server/empresa/resumen-hero';
import * as r from '@/styles/mostrador-resumen.css';
import * as m from '@/styles/mostrador.css';

/**
 * «Autonomía sin nuevo capital», the Resumen's one hero (E-16): CD-12 when
 * the operation sustains itself, CD-12b when the partners still fund it,
 * CD-12c before anything is recorded.
 */
const FLECHA = 'M12 5v14M19 12l-7 7-7-7';
const PALOMITA = 'M20 6 9 17l-5-5';

function Trazo({ d }: { readonly d: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function SinMovimientos() {
  return (
    <section
      className={`${m.hero} ${r.heroCabeza}`}
      aria-labelledby="autonomia"
      data-testid="autonomia"
    >
      <div>
        <span className={m.eyebrow}>Autonomía sin nuevo capital</span>
        <h2 id="autonomia" className={r.heroTitulo}>
          Aún no hay movimientos
        </h2>
        <p className={m.sub}>
          La autonomía se calcula con la caja y los movimientos de los últimos 3 meses. Registra el
          primero para verla.
        </p>
      </div>
      <Link className={m.boton.primario} href={'/empresa/movimientos/registrar' as Route}>
        Registrar
      </Link>
    </section>
  );
}

function Tarjetas({ tarjetas }: { readonly tarjetas: readonly Tarjeta[] }) {
  return (
    <div className={r.tarjetas}>
      {tarjetas.map((t) => (
        <div
          key={t.etiqueta}
          className={t.aviso ? r.tarjeta.aviso : r.tarjeta.normal}
          data-testid="autonomia-tarjeta"
        >
          <span className={r.tarjetaEtiqueta}>{t.etiqueta}</span>
          <span className={r.cifra}>{t.valor}</span>
          <span className={r.nota}>{t.nota}</span>
        </div>
      ))}
    </div>
  );
}

export function Autonomia({ hero }: { readonly hero: Hero }) {
  if (hero.estado === 'sinDatos') return <SinMovimientos />;
  return (
    <section className={`${m.hero} ${m.stack}`} aria-labelledby="autonomia" data-testid="autonomia">
      <div className={r.heroCabeza}>
        <div>
          <span className={m.eyebrow}>Autonomía sin nuevo capital</span>
          <h2 id="autonomia" className={r.heroTitulo}>
            {hero.titulo}
          </h2>
          <p className={m.sub}>{hero.explica}</p>
        </div>
        <span className={r.insignia[hero.estado]}>
          <Trazo d={hero.estado === 'fondeo' ? FLECHA : PALOMITA} />
          {hero.insignia}
        </span>
      </div>
      <Tarjetas tarjetas={hero.tarjetas} />
      <div className={r.pie}>
        <p className={r.tenue} data-testid="autonomia-pie">
          {hero.pie}
        </p>
        <Link className={m.boton.secundario} href={'/empresa/movimientos' as Route}>
          Ver movimientos
        </Link>
      </div>
    </section>
  );
}
