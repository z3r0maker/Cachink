/**
 * Trial emails (N-01): day 11 «Tu prueba termina en 3 días» and day 14 «Tu
 * prueba terminó» (the business is on Xangarrito now). Both point at the
 * portal's Suscripción page, where the owner adds a card or pays the annual
 * plan by SPEI.
 */
import type { PaidPlanId } from '@xangarro/application/billing';
import type { EmailContent } from '@xangarro/application/email';

import { fechaLarga, renderEmail } from '../render.js';
import { Cta, Layout, P, Small } from './layout.js';
import { planName, priceLine } from './plans.js';

export interface TrialEmailProps {
  readonly stage: 'ending' | 'ended';
  readonly plan: PaidPlanId;
  /** ISO-8601. */
  readonly trialEnd: string;
  /** The portal's Suscripción page. */
  readonly subscriptionUrl: string;
  readonly name: string | null;
}

const hola = (name: string | null) => (name ? `Hola, ${name}:` : 'Hola:');

export function TrialEndingEmail(p: TrialEmailProps) {
  const plan = planName(p.plan);
  return (
    <Layout preview={`Tu prueba de ${plan} termina el ${fechaLarga(p.trialEnd)}.`}>
      <P>{hola(p.name)}</P>
      <P>
        Tu prueba de {plan} termina el {fechaLarga(p.trialEnd)}. Para seguir sin interrupciones,
        agrega una tarjeta o paga el plan anual por transferencia (SPEI).
      </P>
      <Cta href={p.subscriptionUrl}>Agregar tarjeta o pagar por SPEI</Cta>
      <P>{priceLine(p.plan)}.</P>
      <Small>Si ya agregaste una tarjeta, no tienes que hacer nada.</Small>
    </Layout>
  );
}

export function TrialEndedEmail(p: TrialEmailProps) {
  const plan = planName(p.plan);
  return (
    <Layout preview="Tus datos siguen ahí y puedes seguir vendiendo.">
      <P>{hola(p.name)}</P>
      <P>
        Tu prueba de {plan} terminó el {fechaLarga(p.trialEnd)}. Tu negocio pasó al plan gratuito
        Xangarrito: tus datos siguen ahí y puedes seguir vendiendo, con los límites del plan
        gratuito.
      </P>
      <P>Cuando quieras volver a {plan}, contrátalo con tarjeta, o paga el plan anual por SPEI.</P>
      <Cta href={p.subscriptionUrl}>Volver a {plan}</Cta>
      <Small>{priceLine(p.plan)}.</Small>
    </Layout>
  );
}

export function renderTrialEmail(p: TrialEmailProps): Promise<EmailContent> {
  return p.stage === 'ending'
    ? renderEmail('Tu prueba termina en 3 días', <TrialEndingEmail {...p} />)
    : renderEmail('Tu prueba terminó: tu negocio sigue en Xangarrito', <TrialEndedEmail {...p} />);
}
