import { colors } from '@xangarro/tokens';

import { Button } from '@/components';
import { eyebrow, planLabel } from '@/styles/text.css';
import { precioDePlan, type PlanCard as PlanCardData } from '@/data/planes';
import type { BillingInterval } from '@xangarro/application/billing';
import type { BillingActionResult } from '@/server/billing/actions';

import { BotonStripe } from './acciones';

import {
  featureMark,
  featureRow,
  planBadge,
  planCard,
  priceRow,
  priceSymbol,
  priceValue,
} from './suscripcion.css';

/**
 * A plan card.
 *
 * **The current plan is marked and must not be sold back to the customer**: its
 * badge reads "Tu plan actual" and its CTA becomes a non-actionable "Este es tu
 * plan" at 55% opacity. When the promoted plan is not the current one, the
 * badge falls back to "El más popular" (design handoff).
 */
function Features({ plan, dark }: { readonly plan: PlanCardData; readonly dark: boolean }) {
  return (
    <>
      {plan.features.map((f) => (
        <div key={f.label} className={featureRow}>
          <span
            className={featureMark}
            style={{
              color: f.included ? (dark ? colors.yellow : colors.greenText) : colors.gray400,
            }}
            aria-hidden="true"
          >
            {f.included ? '✓' : '–'}
          </span>
          <span
            style={{ color: f.included ? (dark ? colors.white : colors.ink) : colors.textMuted }}
          >
            {f.label}
          </span>
        </div>
      ))}
    </>
  );
}

function Price({
  plan,
  dark,
  body,
  interval,
}: {
  readonly plan: PlanCardData;
  readonly dark: boolean;
  readonly body: string;
  readonly interval: BillingInterval;
}) {
  const { price, period } = precioDePlan(plan.id, interval);
  return (
    <>
      <div className={priceRow} style={{ color: dark ? colors.white : colors.black }}>
        <span className={priceSymbol}>$</span>
        <span className={priceValue} data-testid={`precio-${plan.id}`}>
          {price}
        </span>
      </div>
      <div style={{ marginTop: 8, color: body, fontWeight: 600 }}>{period}</div>
    </>
  );
}

type Accion = (() => Promise<BillingActionResult>) | null;

/** The current plan is inert and not sold back; others open Stripe for the owner only. */
function Cta(props: {
  readonly plan: PlanCardData;
  readonly current: boolean;
  readonly accion: Accion;
}) {
  const variant = props.plan.emphasis ? 'primary' : 'secondary';
  if (props.current) {
    return (
      <Button full variant={variant} disabled style={{ opacity: 0.55, cursor: 'default' }}>
        Este es tu plan
      </Button>
    );
  }
  if (props.accion === null) return null;
  return <BotonStripe full label={props.plan.cta} variant={variant} accion={props.accion} />;
}

/** The card's CTA, and «Pagar por transferencia» under it on annual paid plans (N-01). */
function Acciones(props: {
  readonly plan: PlanCardData;
  readonly current: boolean;
  readonly accion: Accion;
  readonly spei: Accion;
}) {
  return (
    <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
      <Cta plan={props.plan} current={props.current} accion={props.accion} />
      {props.spei === null || props.current ? null : (
        <BotonStripe full label="Pagar por transferencia (SPEI)" accion={props.spei} />
      )}
    </div>
  );
}

export function PlanCard({
  plan,
  current,
  accion,
  interval,
  spei,
}: {
  readonly plan: PlanCardData;
  readonly current: boolean;
  /** The owner's way to switch to this plan; null for the current plan and for non-owners. */
  readonly accion: Accion;
  readonly interval: BillingInterval;
  /** «Pagar por transferencia», on annual paid plans only (N-01). */
  readonly spei: Accion;
}) {
  const dark = plan.emphasis;
  const body = dark ? colors.gray200 : colors.textMuted;
  const badge = current ? 'Tu plan actual' : plan.emphasis ? 'El más popular' : null;

  return (
    <div className={dark ? planCard.emphasis : planCard.plain}>
      {badge ? <span className={planBadge}>{badge}</span> : null}
      <div className={planLabel} style={{ color: dark ? colors.yellow : colors.gray600 }}>
        {plan.name}
      </div>
      <p style={{ margin: '10px 0 0', minHeight: '3em', color: body, fontWeight: 600 }}>
        {plan.pitch}
      </p>
      <Price plan={plan} dark={dark} body={body} interval={interval} />
      <Acciones plan={plan} current={current} accion={accion} spei={spei} />
      <div
        className={eyebrow}
        style={{ margin: '24px 0 14px', color: dark ? colors.gray400 : colors.gray600 }}
      >
        {plan.includesLabel}
      </div>
      <Features plan={plan} dark={dark} />
    </div>
  );
}
