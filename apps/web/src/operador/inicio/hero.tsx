import Link from 'next/link';

import { Icon } from '../../shell/icon';
import type { Hero, Nota } from './copy';
import * as h from './hero.css';

const FLECHA = 'M5 12h14M13 6l6 6-6 6';

/** «Lo primero»: what to do now, in the situation's tone, with one big action. */
export function HeroCard({ hero }: { readonly hero: Hero }) {
  const t = hero.tono;
  const cta = t === 'listo' ? 'negro' : t === 'offline' ? 'blanco' : 'amarillo';
  return (
    <section aria-label={hero.eyebrow} className={`${h.hero} ${h.heroTono[t]}`}>
      <span className={`${h.tile} ${h.tileTono[t]}`}>
        <Icon path={hero.icon} size={26} strokeWidth={2} />
      </span>
      <div className={h.text}>
        <div className={h.eyebrowRow}>
          <span className={`${h.eyebrow} ${h.eyebrowTono[t]}`}>{hero.eyebrow}</span>
          {hero.chip ? (
            <span className={h.chip}>
              <span className={h.chipDot} aria-hidden="true" />
              {hero.chip}
            </span>
          ) : null}
        </div>
        <h2 className={h.title}>{hero.title}</h2>
        <p className={h.body}>{hero.body}</p>
      </div>
      <div className={h.side}>
        <Link
          href={hero.href}
          className={`${h.cta} ${h.ctaTono[cta]} ${t === 'listo' ? '' : h.ctaMid}`}
        >
          {hero.cta}
          <Icon path={FLECHA} size={t === 'listo' ? 24 : 22} strokeWidth={2.6} />
        </Link>
        {hero.nota ? <NotaLine nota={hero.nota} /> : null}
        {hero.extra ? (
          <Link href={hero.extra.href} className={h.extra}>
            {hero.extra.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function NotaLine({ nota }: { readonly nota: Nota }) {
  return (
    <span className={h.nota}>
      {nota.map((p, i) =>
        typeof p === 'string' ? (
          p
        ) : (
          <b key={i} className={h.notaFigure}>
            {p.b}
          </b>
        ),
      )}
    </span>
  );
}
