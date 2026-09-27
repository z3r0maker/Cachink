'use client';

import { useState } from 'react';
import type { BillingInterval } from '@xangarro/application/billing';
import { PLAN_IDS } from '@xangarro/domain';

import { PLAN_CARDS } from '@/data/planes';
import { useSession } from '@/session/provider';

import { accionDePlan, speiDePlan } from './acciones';
import { PlanCard, type Relacion } from './plan-card';
import * as p from './planes.css';
import { notaDerecha, seccion, seccionHead, seccionTitulo } from './suscripcion.css';

/** «Mensual» or «Anual» (N-01): a radio pair; SPEI is offered on annual only. */
function Periodo(props: {
  readonly value: BillingInterval;
  readonly onChange: (v: BillingInterval) => void;
}) {
  return (
    <div className={p.seg} role="radiogroup" aria-label="Periodo de pago">
      <button
        type="button"
        role="radio"
        aria-checked={props.value === 'month'}
        className={p.segBoton}
        onClick={() => props.onChange('month')}
      >
        Mensual
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={props.value === 'year'}
        className={p.segBoton}
        onClick={() => props.onChange('year')}
      >
        Anual <span className={p.gratisTag}>2 meses gratis</span>
      </button>
    </div>
  );
}

const rango = (id: string) => PLAN_IDS.indexOf(id as (typeof PLAN_IDS)[number]);

function relacion(id: string, actual: string): Relacion {
  if (id === actual) return 'actual';
  return rango(id) > rango(actual) ? 'sube' : 'baja';
}

export function Planes({ owner }: { readonly owner: boolean }) {
  const session = useSession();
  const [interval, setInterval] = useState<BillingInterval>('month');
  const vende = (id: string) => owner && id !== session.planId;
  return (
    <section id="planes" className={seccion} aria-labelledby="planes-t">
      <div className={seccionHead}>
        <h2 id="planes-t" className={seccionTitulo}>
          Planes
        </h2>
        <Periodo value={interval} onChange={setInterval} />
        <span className={notaDerecha}>Precios en pesos, más IVA.</span>
      </div>
      <div className={p.grid}>
        {PLAN_CARDS.map((c) => (
          <PlanCard
            key={c.id}
            plan={c}
            interval={interval}
            relacion={relacion(c.id, session.planId)}
            accion={vende(c.id) ? accionDePlan(c.id, interval) : null}
            spei={
              vende(c.id) && interval === 'year' && c.id !== 'xangarrito' ? speiDePlan(c.id) : null
            }
          />
        ))}
      </div>
    </section>
  );
}
