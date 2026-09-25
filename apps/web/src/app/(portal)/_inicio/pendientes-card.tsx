import { DonDice } from '@/components';
import { Icon } from '@/shell/icon';

import type { Pendiente, PendienteTone } from './briefing';
import * as s from './hoy.css';

const ICONO: Readonly<Record<PendienteTone, string>> = {
  alerta:
    'M21.7 18 13.7 4a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3ZM12 9v4M12 17h.01',
  sync: 'M21 11a9 9 0 0 0-15-5.5L3 8m0-5v5h5m-5 3a9 9 0 0 0 15 5.5l3-2.5m0 5v-5h-5',
  gente: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  paso: 'M5 12h14M12 5l7 7-7 7',
};

/** «Pendientes de hoy»: each row names the problem and links to where it is fixed. */
export function PendientesCard({ items }: { readonly items: readonly Pendiente[] }) {
  return (
    <section id="pendientes" className={s.quiet} aria-labelledby="pend-t">
      <div className={s.cardHead}>
        <h2 id="pend-t" className={s.pendTitle} style={{ margin: 0, fontSize: 'inherit' }}>
          Pendientes de hoy
        </h2>
        {items.length > 0 ? <span className={s.count}>{items.length}</span> : null}
      </div>
      {items.length === 0 ? (
        <DonDice pose="quieto" size={72}>
          Nada pendiente por hoy. ¡A vender!
        </DonDice>
      ) : (
        <div data-testid="hoy-pendientes">
          {items.map((p) => (
            <a key={p.key} className={s.pendRow} href={p.href}>
              <span className={`${s.pendIcon} ${s.pendTone[p.tone]}`}>
                <Icon path={ICONO[p.tone]} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span className={s.pendTitle}>{p.title}</span>
                <span className={s.pendSub}>{p.sub}</span>
              </span>
              <span className={s.pendCta}>{p.cta} ›</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
