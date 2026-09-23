/**
 * «No pudimos cobrar tu suscripción» (B-10 step 3, B-14): sent once per
 * failed period, when the row turns `past_due`. It states the one date that
 * matters — the end of the 7-day grace `computeEntitlement` applies — and
 * what happens after it (the free plan, data kept), so the owner is never
 * surprised by a lapse.
 */
import type { PaidPlanId } from '@xangarro/application/billing';
import type { EmailContent } from '@xangarro/application/email';

import { fechaLarga, renderEmail } from '../render.js';
import { Cta, Layout, P, Small } from './layout.js';
import { planName, priceLine } from './plans.js';

export interface PaymentFailedEmailProps {
  readonly plan: PaidPlanId;
  /** ISO-8601: the entitlement's `graceUntil`. */
  readonly graceUntil: string;
  /** The portal's Suscripción page. */
  readonly subscriptionUrl: string;
  readonly name: string | null;
}

const hola = (name: string | null) => (name ? `Hola, ${name}:` : 'Hola:');

export function PaymentFailedEmail(p: PaymentFailedEmailProps) {
  const plan = planName(p.plan);
  const deadline = fechaLarga(p.graceUntil);
  return (
    <Layout preview={`No pudimos cobrar tu suscripción a ${plan}. Tienes hasta el ${deadline}.`}>
      <P>{hola(p.name)}</P>
      <P>
        No pudimos cobrar tu suscripción a {plan}. Suele ser una tarjeta vencida, sin fondos o
        bloqueada por el banco.
      </P>
      <P>
        Todavía no pasa nada: tienes hasta el {deadline} para actualizar tu tarjeta o pagar el plan
        anual por transferencia (SPEI). Mientras tanto, todo sigue funcionando igual.
      </P>
      <Cta href={p.subscriptionUrl}>Actualizar mi forma de pago</Cta>
      <P>
        Si no recibimos el pago para esa fecha, tu negocio pasará al plan gratuito Xangarrito: tus
        datos siguen ahí y puedes seguir vendiendo, con los límites del plan gratuito.
      </P>
      <Small>{priceLine(p.plan)}.</Small>
    </Layout>
  );
}

export function renderPaymentFailedEmail(p: PaymentFailedEmailProps): Promise<EmailContent> {
  return renderEmail(
    `No pudimos cobrar tu suscripción a ${planName(p.plan)}`,
    <PaymentFailedEmail {...p} />,
  );
}
