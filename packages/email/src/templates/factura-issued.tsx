/**
 * «Tu factura está lista» (B-14, N-33): sent when a CFDI was stamped for a
 * subscription payment. Says the amount, the payment date and the folio
 * fiscal, and points at Suscripción → Facturas, where the PDF and XML live;
 * the documents are never attached, so a forwarded email leaks nothing.
 */
import type { EmailContent } from '@xangarro/application/email';

import { fechaLarga, pesos, renderEmail } from '../render.js';
import { Cta, Layout, P, Small } from './layout.js';

export interface FacturaIssuedEmailProps {
  readonly name: string | null;
  /** The CFDI's folio fiscal. */
  readonly uuid: string;
  readonly totalCentavos: number;
  /** ISO-8601. */
  readonly paidAt: string;
  /** The portal's Suscripción page (its Facturas section). */
  readonly facturasUrl: string;
}

const hola = (name: string | null) => (name ? `Hola, ${name}:` : 'Hola:');

export function FacturaIssuedEmail(p: FacturaIssuedEmailProps) {
  return (
    <Layout preview={`Tu factura del pago del ${fechaLarga(p.paidAt)} ya está lista.`}>
      <P>{hola(p.name)}</P>
      <P>
        Ya está lista tu factura (CFDI) por {pesos(p.totalCentavos)} del pago del{' '}
        {fechaLarga(p.paidAt)} de tu suscripción a Xangarro.
      </P>
      <P>Folio fiscal: {p.uuid}</P>
      <Cta href={p.facturasUrl}>Descargar PDF y XML</Cta>
      <Small>La encuentras siempre en Suscripción → Facturas, en el portal.</Small>
    </Layout>
  );
}

export function renderFacturaIssuedEmail(p: FacturaIssuedEmailProps): Promise<EmailContent> {
  return renderEmail('Tu factura de Xangarro está lista', <FacturaIssuedEmail {...p} />);
}
