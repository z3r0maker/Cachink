/**
 * The renewal reminder (LFPC art. 76 Bis, ADR-132): sent at least five días
 * hábiles before every charge, monthly included. It states the plan, the
 * period, the date and the total with IVA, and carries the single-use link
 * that cancels in one tap. A SPEI year speaks of the invoice, not a card.
 */
import type { BillingInterval, PaidPlanId } from '@xangarro/application/billing';
import type { EmailContent } from '@xangarro/application/email';

import { fechaLarga, renderEmail } from '../render.js';
import { Cta, Detalles, Layout, P, Small, Titulo } from './layout.js';
import { planName } from './plans.js';
import { diaMes, periodoRenovado } from './renewal-dates.js';
import { totalConIva } from './totales.js';

export interface RenewalEmailProps {
  readonly kind: 'card' | 'spei';
  readonly plan: PaidPlanId;
  readonly interval: BillingInterval;
  /** The business, as the Stripe customer is named; `null` when unknown. */
  readonly negocio: string | null;
  /** ISO-8601: the charge, or the day the SPEI invoice is issued. */
  readonly chargeAt: string;
  /** IVA included, in centavos. */
  readonly totalCentavos: number;
  /** The single-use link: `/cancelar?t=…`. */
  readonly cancelUrl: string;
}

const RAZON =
  'Te llega porque tienes un plan de pago en Xangarro. Te avisamos antes de cada cobro.';

function copy(p: RenewalEmailProps) {
  const dia = diaMes(p.chargeAt);
  const fecha = fechaLarga(p.chargeAt);
  const total = totalConIva(p.totalCentavos);
  const de = p.negocio ? `el plan de ${p.negocio}` : 'tu plan';
  const anual = p.interval === 'year';
  if (p.kind === 'spei') {
    return {
      asunto: `Tu plan ${planName(p.plan)} anual vence el ${dia}`,
      preview: `Ese día te llega la factura para pagar ${total} por SPEI.`,
      titulo: `Tu plan anual vence el ${dia}`,
      intro: `El ${fecha} vence ${de}. Ese día te mandamos la factura con la CLABE para pagarla por transferencia SPEI.`,
      fechaFila: ['La factura llega', fecha] as const,
      plan: `${planName(p.plan)}, anual por SPEI`,
      seguir: 'Si quieres seguir, paga la factura cuando te llegue.',
      cancelar: `Si prefieres cancelar, basta con un clic y ya no te mandamos la factura. Sigues con tu plan hasta el ${dia}.`,
      nota: 'Para cambiar de plan o pagar con tarjeta, entra a Mi negocio › Plan y pagos.',
    };
  }
  return {
    asunto: `Tu plan ${planName(p.plan)}${anual ? ' anual' : ''} se renueva el ${dia}`,
    preview: `Te cobraremos ${total} con IVA. Si quieres cancelar, es un clic.`,
    titulo: `Tu plan${anual ? ' anual' : ''} se renueva el ${dia}`,
    intro: `El ${fecha} renovamos${anual ? ' por un año' : ''} ${de} y te cobramos con la tarjeta que registraste.`,
    fechaFila: ['Fecha del cobro', fecha] as const,
    plan: `${planName(p.plan)}, ${anual ? 'anual' : 'mensual'}`,
    seguir: 'Si quieres seguir, no tienes que hacer nada.',
    cancelar: `Si prefieres cancelar, basta con un clic. Sigues con tu plan hasta el ${dia} y ya no se te cobra.`,
    nota: anual
      ? 'Para cambiar de plan o pasar a mensual, entra a Mi negocio › Plan y pagos.'
      : 'Para cambiar de plan o de tarjeta, entra a Mi negocio › Plan y pagos.',
  };
}

export function RenewalEmail(p: RenewalEmailProps) {
  const c = copy(p);
  return (
    <Layout preview={c.preview} reason={RAZON} legal>
      <Titulo>{c.titulo}</Titulo>
      <P>{c.intro}</P>
      <Detalles
        filas={[
          ['Plan', c.plan],
          ['Periodo', periodoRenovado(p.chargeAt, p.interval)],
          c.fechaFila,
          ['Total', `${totalConIva(p.totalCentavos)} MXN, IVA incluido`],
        ]}
      />
      <P>{c.seguir}</P>
      <P>{c.cancelar}</P>
      <Cta href={p.cancelUrl} secundario>
        Cancelar mi suscripción
      </Cta>
      <Small>{c.nota}</Small>
    </Layout>
  );
}

export function renderRenewalEmail(p: RenewalEmailProps): Promise<EmailContent> {
  return renderEmail(copy(p).asunto, <RenewalEmail {...p} />);
}
