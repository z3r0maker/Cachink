/**
 * «Cancelaste tu plan» (LFPC art. 76 Bis, ADR-132): the acuse. Sent once per
 * cancellation, from Plan y pagos or the email link, with the folio the
 * ledger gave it. The plan runs to the end of the period already paid, and
 * «Seguir con mi plan» undoes it until then.
 */
import type { BillingInterval, PaidPlanId } from '@xangarro/application/billing';
import type { EmailContent } from '@xangarro/application/email';

import { fechaLarga, renderEmail } from '../render.js';
import { Cta, Detalles, Layout, P, Small, Titulo } from './layout.js';
import { planName } from './plans.js';
import { diaMes } from './renewal-dates.js';

export interface CancellationEmailProps {
  readonly plan: PaidPlanId;
  readonly interval: BillingInterval;
  readonly negocio: string | null;
  /** ISO-8601: when the plan ends. */
  readonly endsAt: string;
  /** ISO-8601: when the owner cancelled. */
  readonly requestedAt: string;
  /** «CX-7F3A21». */
  readonly folio: string;
  /** The portal's Plan y pagos page. */
  readonly subscriptionUrl: string;
}

const HORA = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function CancellationEmail(p: CancellationEmailProps) {
  const fin = fechaLarga(p.endsAt);
  const filas: [string, string][] = [
    ['Plan', `${planName(p.plan)}, ${p.interval === 'year' ? 'anual' : 'mensual'}`],
    ['Cancelada el', `${fechaLarga(p.requestedAt)}, ${HORA.format(new Date(p.requestedAt))}`],
    ['Folio', p.folio],
  ];
  if (p.negocio) filas.unshift(['Negocio', p.negocio]);
  return (
    <Layout
      preview={`Tu plan sigue hasta el ${diaMes(p.endsAt)} y no se te cobrará más.`}
      reason="Te llega porque cancelaste tu plan de Xangarro."
      legal
    >
      <Titulo>Cancelaste tu suscripción</Titulo>
      <P>
        Recibimos tu cancelación. Tu plan sigue hasta el {fin} y no se te cobrará más. Después pasas
        a Xangarrito, gratis, con todos tus registros.
      </P>
      <Detalles filas={filas} />
      <P>Guarda este correo: es tu comprobante de cancelación.</P>
      <Cta href={p.subscriptionUrl}>Seguir con mi plan</Cta>
      <Small>¿Cambiaste de idea? Puedes seguir con tu plan hasta el {diaMes(p.endsAt)}.</Small>
    </Layout>
  );
}

export function renderCancellationEmail(p: CancellationEmailProps): Promise<EmailContent> {
  return renderEmail(`Cancelaste tu plan ${planName(p.plan)}`, <CancellationEmail {...p} />);
}
