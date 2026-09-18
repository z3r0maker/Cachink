import { colors } from '@xangarro/tokens';

import { Button } from '@/components';
import { eyebrow, planLabel } from '@/styles/text.css';
import type { PlanCard as PlanCardData } from '@/fixtures/planes';

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
}: {
  readonly plan: PlanCardData;
  readonly dark: boolean;
  readonly body: string;
}) {
  return (
    <>
      <div className={priceRow} style={{ color: dark ? colors.white : colors.black }}>
        <span className={priceSymbol}>$</span>
        <span className={priceValue}>{plan.price}</span>
      </div>
      <div style={{ marginTop: 8, color: body, fontWeight: 600 }}>{plan.period}</div>
    </>
  );
}

export function PlanCard({
  plan,
  current,
}: {
  readonly plan: PlanCardData;
  readonly current: boolean;
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
      <Price plan={plan} dark={dark} body={body} />
      <div style={{ marginTop: 22 }}>
        <Button
          full
          variant={dark ? 'primary' : 'secondary'}
          disabled={current}
          style={current ? { opacity: 0.55, cursor: 'default' } : undefined}
        >
          {current ? 'Este es tu plan' : plan.cta}
        </Button>
      </div>
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
