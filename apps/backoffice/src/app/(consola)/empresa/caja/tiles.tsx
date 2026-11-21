import type { Route } from 'next';
import Link from 'next/link';

import { Odometro } from '@/components/odometro';
import type { Tile } from '@/server/empresa/caja-view';
import * as c from '@/styles/mostrador-caja.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as m from '@/styles/mostrador.css';

/**
 * Caja's five tiles (board CD-15c): cash, Bancos, Stripe, spending a month,
 * months of cash. The cash tile is the screen's hero (ADR-161): it lands with
 * the sweep; the others enter in turn, and every figure rolls.
 */
export function Tiles({ tiles }: { readonly tiles: readonly Tile[] }) {
  return (
    <div className={`${c.tiles} ${mv.escalona}`}>
      {tiles.map((t) => (
        <div
          key={t.label}
          className={
            t.hero ? `${c.tile.hero} ${mv.aterriza} ${mv.barrido}` : `${c.tile.normal} ${mv.entra}`
          }
          data-testid="caja-tile"
        >
          <span className={m.tileLabel}>{t.label}</span>
          <Odometro
            className={t.hero ? c.valorHero : c.valor}
            texto={t.valor}
            testId={`caja-${t.label}`}
          />
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
