'use client';

import { PLAN_NOMBRE } from '@xangarro/domain';

import { administrarSuscripcion } from '@/server/billing/actions';
import type { SuscripcionData } from '@/server/suscripcion';
import { useSession } from '@/session/provider';

import { BotonStripe } from './acciones';
import { estadoCopy, estadoTono, TONO_LABEL } from './estado';
import { IconoAlerta, IconoCalendario } from './iconos';
import { precioLinea } from './precio';
import * as r from './resumen.css';
import { btn } from './suscripcion.css';

/**
 * «Tu plan»: the yellow hero. The name, the price, what Stripe says right now
 * (a tag and a sentence) and, for the owner, the ways to change it.
 */
function Acciones({ data }: { readonly data: SuscripcionData }) {
  // A monthly subscriber can move to annual in the Customer Portal (N-01);
  // proration is Stripe's.
  const puedeAnual =
    data.estado !== null &&
    data.estado.interval === 'month' &&
    (data.estado.status === 'active' || data.estado.status === 'trialing');
  return (
    <div className={r.heroAcciones}>
      <a href="#planes" className={`${btn.secundario} ${r.heroBoton}`}>
        Cambiar plan
      </a>
      {data.estado === null ? null : (
        <span className={r.heroBoton}>
          <BotonStripe full label="Administrar pago" accion={() => administrarSuscripcion()} />
        </span>
      )}
      {puedeAnual ? (
        <span className={r.heroBoton}>
          <BotonStripe
            full
            label="Cambiar a anual, 2 meses gratis"
            accion={() => administrarSuscripcion()}
          />
        </span>
      ) : null}
    </div>
  );
}

export function PlanHero({
  owner,
  data,
}: {
  readonly owner: boolean;
  readonly data: SuscripcionData;
}) {
  const { planId } = useSession();
  const copy = estadoCopy(data.estado);
  const tono = estadoTono(data.estado);
  return (
    <section className={r.hero} aria-labelledby="plan-hero-t">
      <div className={r.heroTop}>
        <span className={r.heroEyebrow}>Tu plan</span>
        <span className={r.tono[tono]}>{TONO_LABEL[tono]}</span>
      </div>
      <h2 id="plan-hero-t" className={r.planNombre}>
        {PLAN_NOMBRE[planId]}
      </h2>
      <span className={r.precio}>{precioLinea(planId, data.estado?.interval ?? 'month')}</span>
      <span className={r.estadoLinea}>
        {tono === 'atrasado' || tono === 'vencido' ? <IconoAlerta /> : <IconoCalendario />}
        <span data-testid="suscripcion-estado">{copy.linea}</span>
      </span>
      {owner ? <Acciones data={data} /> : null}
    </section>
  );
}
