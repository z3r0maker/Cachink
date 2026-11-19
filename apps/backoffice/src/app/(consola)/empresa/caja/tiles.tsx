import type { Route } from 'next';
import Link from 'next/link';

import type { Tile } from '@/server/empresa/caja-view';
import * as c from '@/styles/mostrador-caja.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

/** Caja's five tiles (board CD-15c): cash, Bancos, Stripe, spending a month, months of cash. */
export function Tiles({ tiles }: { readonly tiles: readonly Tile[] }) {
  return (
    <div className={c.tiles}>
      {tiles.map((t) => (
        <div key={t.label} className={c.tile[t.hero ? 'hero' : 'normal']} data-testid="caja-tile">
          <span className={m.tileLabel}>{t.label}</span>
          <span className={t.hero ? c.valorHero : c.valor} data-testid={`caja-${t.label}`}>
            {t.valor}
          </span>
          <span className={i.pasoSub}>{t.nota}</span>
          {t.enlace === null ? null : (
            <Link className={m.boton.secundario} href={t.enlace.href as Route}>
              {t.enlace.texto}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
