/**
 * The acuse of an ARCO request (Reglamento de la LFPDPPP art. 95; board
 * PvCorreos): folio, the moment received, the right asked for and the day we
 * answer by. The same facts the screen «Recibimos tu solicitud» shows.
 */
import type { EmailContent } from '@xangarro/application/email';
import { finDelDiaCdmx, type DerechoArco, type IsoDate } from '@xangarro/domain';

import { fechaLarga, renderEmail } from '../render.js';
import { Detalles, Layout, P, Titulo } from './layout.js';

export interface ArcoAcuseEmailProps {
  readonly folio: string;
  readonly nombre: string;
  readonly derecho: DerechoArco;
  /** ISO-8601: the moment the request was received. */
  readonly recibidaEn: string;
  /** Last day to answer, in Mexico City. */
  readonly responderA: IsoDate;
}

const LO_QUE_PEDISTE: Readonly<Record<DerechoArco, string>> = {
  acceso: 'Acceso a tus datos',
  rectificacion: 'Rectificación de tus datos',
  cancelacion: 'Cancelación de tus datos',
  oposicion: 'Oposición al uso de tus datos',
  revocacion: 'Revocación de tu consentimiento',
};

const HORA = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function Acuse(p: ArcoAcuseEmailProps & { readonly responder: string }) {
  return (
    <Layout
      preview={`Te respondemos a más tardar el ${p.responder}.`}
      reason="Te llega porque hiciste una solicitud sobre tus datos personales en Xangarro."
      legal
    >
      <Titulo>Recibimos tu solicitud</Titulo>
      <P>
        Hola, {p.nombre}: recibimos tu solicitud sobre tus datos personales. Este correo es tu acuse
        de recibo.
      </P>
      <Detalles
        filas={[
          ['Folio', p.folio],
          ['Recibida el', `${fechaLarga(p.recibidaEn)}, ${HORA.format(new Date(p.recibidaEn))}`],
          ['Lo que pediste', LO_QUE_PEDISTE[p.derecho]],
          ['Te respondemos a más tardar', p.responder],
        ]}
      />
      <P>
        El plazo es de 20 días hábiles. Antes de actuar te pediremos, respondiendo a este correo,
        una identificación para confirmar que eres tú. No mandes documentos hasta que te los
        pidamos.
      </P>
      <P>Guarda el folio: te lo pediremos en cada mensaje.</P>
    </Layout>
  );
}

export function renderArcoAcuseEmail(p: ArcoAcuseEmailProps): Promise<EmailContent> {
  return renderEmail(
    `Recibimos tu solicitud sobre tus datos · Folio ${p.folio}`,
    <Acuse {...p} responder={fechaLarga(finDelDiaCdmx(p.responderA))} />,
  );
}
