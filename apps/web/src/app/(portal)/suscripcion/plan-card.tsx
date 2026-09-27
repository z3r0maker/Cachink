import type { BillingInterval } from '@xangarro/application/billing';

import type { PlanCard as PlanCardData, PlanFeature } from '@/data/planes';
import type { BillingActionResult } from '@/server/billing/actions';

import { BotonStripe } from './acciones';
import { IconoCheck, IconoEstrella, IconoGuion } from './iconos';
import * as p from './planes.css';
import { eyebrow } from './suscripcion.css';
import { precioTexto } from './precio';
import { check } from './resumen.css';

/**
 * A plan card (CfgPlan). **The current plan is marked and never sold back**:
 * a yellow band, a «Tu plan» tag and an inert «Este es tu plan». A higher plan
 * offers «Cambiar a …» (yellow), a lower one «Bajar a …» (white).
 */
export type Relacion = 'actual' | 'sube' | 'baja';
type Accion = (() => Promise<BillingActionResult>) | null;

/** House number style («1,000») and nothing labelled as coming later. */
const rasgoTexto = (label: string) =>
  label.replace(/(\d) (\d{3})/g, '$1,$2').replace(/\s*\(próximamente\)/i, '');

function Rasgo({ f }: { readonly f: PlanFeature }) {
  return (
    <li className={f.included ? p.rasgo : p.rasgoNo}>
      <span className={`${p.marca} ${f.included ? check : ''}`}>
        {f.included ? <IconoCheck /> : <IconoGuion />}
      </span>
      <span>{rasgoTexto(f.label)}</span>
    </li>
  );
}

function Ctas(props: {
  readonly plan: PlanCardData;
  readonly relacion: Relacion;
  readonly accion: Accion;
  readonly spei: Accion;
}) {
  if (props.relacion === 'actual') {
    return (
      <button type="button" className={p.esteEs} disabled>
        <IconoCheck />
        Este es tu plan
      </button>
    );
  }
  if (props.accion === null) return null;
  const sube = props.relacion === 'sube';
  return (
    <div className={p.ctas}>
      <BotonStripe
        full
        estilo={sube ? 'primario' : 'secundario'}
        label={`${sube ? 'Cambiar a' : 'Bajar a'} ${props.plan.name}`}
        accion={props.accion}
      />
      {props.spei === null ? null : (
        <BotonStripe
          full
          estilo="quieto"
          label="Pagar por transferencia (SPEI)"
          accion={props.spei}
        />
      )}
    </div>
  );
}

function MarcaTuPlan() {
  return (
    <>
      <span className={p.banda} aria-hidden="true" />
      <span className={p.tuPlanTag}>
        <IconoEstrella />
        Tu plan
      </span>
    </>
  );
}

export function PlanCard(props: {
  readonly plan: PlanCardData;
  readonly relacion: Relacion;
  /** The owner's way to switch to this plan; null for the current plan and for non-owners. */
  readonly accion: Accion;
  readonly interval: BillingInterval;
  /** «Pagar por transferencia», on annual paid plans only (N-01). */
  readonly spei: Accion;
}) {
  const { plan } = props;
  const actual = props.relacion === 'actual';
  const precio = precioTexto(plan.id, props.interval);
  const hid = `plan-${plan.id}`;
  return (
    <article className={actual ? p.planTuyo : p.plan} aria-labelledby={hid}>
      {actual ? <MarcaTuPlan /> : null}
      <div>
        <h3 id={hid} className={p.nombre}>
          {plan.name}
        </h3>
        <span className={p.pitch}>{plan.pitch}</span>
      </div>
      <div className={p.precioFila}>
        <span className={p.precio} data-testid={`precio-${plan.id}`}>
          {precio.cifra}
        </span>
        <span className={p.periodo}>{precio.periodo}</span>
      </div>
      <Ctas plan={plan} relacion={props.relacion} accion={props.accion} spei={props.spei} />
      <span className={eyebrow}>{plan.includesLabel}</span>
      <ul className={p.lista}>
        {plan.features.map((f) => (
          <Rasgo key={f.label} f={f} />
        ))}
      </ul>
    </article>
  );
}
