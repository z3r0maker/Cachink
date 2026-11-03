'use client';

import { Don } from '@/components';
import type { AsesorTier } from '@/data/planes';
import { useSession } from '@/session/provider';
import { PLAN_NOMBRE } from '@xangarro/domain';

import * as a from './asesor.css';
import { IconoCheck } from './iconos';
import * as p from './planes.css';
import { check } from './resumen.css';
import * as s from './suscripcion.css';

function AsesorTierCard({ t, tuyo }: { readonly t: AsesorTier; readonly tuyo: boolean }) {
  return (
    <article className={tuyo ? a.donCartaTuya : a.donCarta}>
      <span className={a.donNombre}>
        <span className={s.eyebrow}>{t.name}</span>
        {tuyo ? <span className={a.tuPlanChico}>Tu plan</span> : null}
      </span>
      <span className={a.donLinea}>{t.oneLiner}</span>
      <ul className={p.lista}>
        {t.items.map((item) => (
          <li key={item} className={p.rasgo}>
            <span className={`${p.marca} ${check}`}>
              <IconoCheck />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/** The Asesor is sold as its own block, separate from the plan feature lists. */
export function AsesorBlock({ tiers }: { readonly tiers: readonly AsesorTier[] }) {
  const tuyo = PLAN_NOMBRE[useSession().planId];
  return (
    <section className={s.seccion} aria-labelledby="don-t">
      <div className={a.donHead}>
        <Don pose="hola" size={44} />
        <h2 id="don-t" className={s.seccionTitulo}>
          Don Cuentas en cada plan
        </h2>
        <span className={s.notaDerecha}>Sus avisos y su análisis con IA crecen con tu plan.</span>
      </div>
      <div className={p.grid}>
        {tiers.map((t) => (
          <AsesorTierCard key={t.name} t={t} tuyo={t.name === tuyo} />
        ))}
      </div>
    </section>
  );
}
